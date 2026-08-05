import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const password = String(body?.password || "");
    const deviceId = String(body?.device_id || "");
    const trustDevice = Boolean(body?.trust_device);
    const otpCode = body?.otp ? String(body.otp).replace(/\D/g, "") : "";

    // 1. Verify the passcode against the stored SHA-256 hash.
    const adminPasswordHash = secrets.get("ADMIN_PASSWORD");
    if (!adminPasswordHash) {
      return Response.json({ verified: false, error: "Passcode not configured." });
    }
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const inputHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (inputHash !== adminPasswordHash.trim().toLowerCase()) {
      return Response.json({ verified: false, error: "Incorrect passcode." });
    }

    // 2. Determine device trust.
    const trustedDevices = Array.isArray(user.admin_trusted_devices) ? user.admin_trusted_devices : [];
    const isTrusted = Boolean(deviceId) && trustedDevices.includes(deviceId);

    // 3. Untrusted devices must also provide a valid OTP.
    if (!isTrusted) {
      if (otpCode.length !== 6) {
        return Response.json({ verified: false, need_otp: true, error: "Enter the 6-digit verification code." });
      }
      const rows = await base44.asServiceRole.entities.AdminOtp.filter(
        { user_id: user.id, code: otpCode, used: false }, "-created_date", 5
      );
      const match = rows.find((row) => new Date(row.expires_at) > new Date());
      if (!match) {
        return Response.json({ verified: false, need_otp: true, error: "That code is invalid or expired." });
      }
      await base44.asServiceRole.entities.AdminOtp.update(match.id, { used: true });
    }

    // 4. Optionally persist the device as trusted for next time.
    if (trustDevice && deviceId && !isTrusted) {
      await base44.auth.updateMe({ admin_trusted_devices: [...trustedDevices, deviceId] });
    }

    return Response.json({ verified: true, trusted: isTrusted || trustDevice });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
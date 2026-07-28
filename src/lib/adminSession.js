// In-memory admin re-authentication flag.
// Kept in module scope on purpose: it survives in-app navigation but is wiped
// on any page reload or new tab, forcing a fresh OTP verification.
let verified = false;

export const isAdminVerified = () => verified;
export const markAdminVerified = () => { verified = true; };
export const clearAdminVerified = () => { verified = false; };
import os
import glob
import csv
import json
import re
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

print(f"Connecting to Supabase at {SUPABASE_URL}...", flush=True)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def to_uuid(val):
    if not val or not isinstance(val, str):
        return None
    clean = val.strip().strip('"')
    if not clean:
        return None
    if clean.startswith("service_"):
        clean = clean[len("service_"):]
    if re.match(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", clean):
        return clean.lower()
    if re.match(r"^[0-9a-fA-F]{24}$", clean):
        hex_str = clean.zfill(32)
        return f"{hex_str[0:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:32]}".lower()
    return clean

USER_MAP = {
    "6a670dff96c46b62aaca0b7e": {
        "email": "danishpaeds@gmail.com",
        "full_name": "Danish sardar",
        "role": "admin",
        "status": "active",
        "welcome_email_sent": True,
        "admin_trusted_devices": [
            "fd51a1e6-fbf1-40f0-925e-3f896a456b5c", "9cd1ac76-78f8-4a80-a4e3-7110f8c38753",
            "328a68dc-9115-4dbd-96f7-47df820c2c33", "a59c1e20-6296-40a9-8357-0f65eff59df0",
            "39e73231-be46-439e-86c7-97656b4acf80", "9cda2933-e0cc-4972-96e5-92b3eba33700",
            "9d4062ad-5b8c-4c3d-8401-1251952d0de8", "a4e64956-0149-4f23-95ca-64d5f542a4e3",
            "4eacba97-5eca-4dc7-be27-55922bf6fd1c", "d13cbd04-50bb-404c-8df9-975dfc2b7d38",
            "38b147b8-a123-4500-9218-bbe74fe482d8", "29954e87-e930-4251-b9f6-a3f55df9ea99",
            "1877d0ec-666d-43f4-b6f1-ff1a52004655", "32f20e9e-cb00-4b92-bc06-e82890fc2709",
            "3f5785d0-bfdd-4333-94fe-cc82438168fd", "ca036a9f-eb17-4455-b11d-463341d8aaf2"
        ]
    },
    "6a69068592703d05559d1ac5": {
        "email": "zaincura@gmail.com",
        "full_name": "Zain Cura",
        "role": "user",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "6a69887fc6fa71d2a566d297": {
        "email": "drnehakathuria@gmail.com",
        "full_name": "Dr Neha Sardar",
        "role": "clinician",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "6a6a784e9a26b208dffcf56a": {
        "email": "pratsieeee@gmail.com",
        "full_name": "pratsieeee",
        "role": "user",
        "status": "invited",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "6a749aa6ddfc00140158eff3": {
        "email": "zsquad6767@gmail.com",
        "full_name": "Z Squad",
        "role": "user",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "6a7bb074ffcef7f9421063b4": {
        "email": "ifeeinai@gmail.com",
        "full_name": "Muhammad iftikhar",
        "role": "admin",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "6a7c3c86776e4c7809b327a8": {
        "email": "mhussainumar13@gmail.com",
        "full_name": "Hussain Umar",
        "role": "user",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "6a7c91122a05e655a342fc18": {
        "email": "dengiman36@gmail.com",
        "full_name": "dengiman36",
        "role": "admin",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": ["36d18d50-9a59-4b4d-9fc0-1571b06b99a8"]
    },
    "service_78041cd2-4f48-4953-b0e6-cba99c511068": {
        "email": "service_7804@aqla.io",
        "full_name": "System Service 7804",
        "role": "admin",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    },
    "service_aebac85e-c16b-4e0d-a0e1-9e79ea35a37b": {
        "email": "service_aebac@aqla.io",
        "full_name": "System Service aebac",
        "role": "admin",
        "status": "active",
        "welcome_email_sent": False,
        "admin_trusted_devices": []
    }
}

EXISTING_AUTH_USERS = set()

def load_auth_users():
    global EXISTING_AUTH_USERS
    try:
        users = supabase.auth.admin.list_users()
        EXISTING_AUTH_USERS = {u.id.lower() for u in users}
        print(f"Loaded {len(EXISTING_AUTH_USERS)} existing auth users.", flush=True)
    except Exception as e:
        print(f"Error loading auth users: {e}", flush=True)

def ensure_user_exists(uid, full_name=None, email=None):
    if not uid:
        return
    uid = uid.lower()
    if uid in EXISTING_AUTH_USERS:
        return
    try:
        if not email:
            email = f"user_{uid.replace('-', '')[:10]}@aqla.io"
        supabase.auth.admin.create_user({
            "id": uid,
            "email": email,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name or "AQLA User"}
        })
        EXISTING_AUTH_USERS.add(uid)
        print(f"  Auth user created: {email} -> {uid}", flush=True)
    except Exception as e:
        EXISTING_AUTH_USERS.add(uid)

def parse_array(val):
    if not val:
        return []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        val = val.strip()
        if val.startswith("[") and val.endswith("]"):
            try:
                return json.loads(val)
            except Exception:
                pass
        if val:
            return [val]
    return []

def parse_json(val):
    if not val:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        val = val.strip()
        if (val.startswith("{") and val.endswith("}")) or (val.startswith("[") and val.endswith("]")):
            try:
                return json.loads(val)
            except Exception:
                pass
    return val

def parse_bool(val):
    if val is None or val == "":
        return None
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    if s in ("true", "1", "t", "yes"):
        return True
    if s in ("false", "0", "f", "no"):
        return False
    return None

def parse_num(val):
    if val is None or val == "":
        return None
    try:
        if "." in str(val):
            return float(val)
        return int(val)
    except Exception:
        return None

def setup_users_and_profiles():
    print("\n--- 1. Provisioning Auth Users & Profiles ---", flush=True)
    load_auth_users()
    for key_id, udata in USER_MAP.items():
        uid = to_uuid(key_id)
        if uid not in EXISTING_AUTH_USERS:
            try:
                supabase.auth.admin.create_user({
                    "id": uid,
                    "email": udata["email"],
                    "email_confirm": True,
                    "user_metadata": {"full_name": udata["full_name"]}
                })
                EXISTING_AUTH_USERS.add(uid)
                print(f"  Auth user created: {udata['email']} -> {uid}", flush=True)
            except Exception as e:
                EXISTING_AUTH_USERS.add(uid)

        try:
            supabase.table("profiles").upsert({
                "id": uid,
                "email": udata["email"],
                "full_name": udata["full_name"],
                "role": udata["role"],
                "welcome_email_sent": udata["welcome_email_sent"],
                "admin_trusted_devices": udata["admin_trusted_devices"]
            }).execute()
            print(f"  Profile upserted: {udata['email']}", flush=True)
        except Exception as e:
            print(f"  Profile upsert error ({udata['email']}): {e}", flush=True)

def import_captcha_configs():
    print("\n--- 2. Importing Captcha Configs ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/e04009bd-79fe-41b1-b2ef-87e278b5e56e/.user_uploaded/media_1786928671902.csv"
    if not os.path.exists(path):
        print(f"  File not found: {path}", flush=True)
        return

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        records.append({
            "id": to_uuid(r["id"]),
            "score_threshold": parse_num(r["score_threshold"]),
            "v2_site_key": r["v2_site_key"],
            "v2_secret_key": r["v2_secret_key"],
            "v3_site_key": r["v3_site_key"],
            "v3_secret_key": r["v3_secret_key"],
        })

    if records:
        supabase.table("captcha_configs").upsert(records).execute()
        print(f"  Upserted {len(records)} captcha_configs records.", flush=True)

def import_daily_check_ins():
    print("\n--- 3. Importing Daily Check-ins ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/e04009bd-79fe-41b1-b2ef-87e278b5e56e/.user_uploaded/media_1786928671916.csv"
    if not os.path.exists(path):
        print(f"  File not found: {path}", flush=True)
        return

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        cid = to_uuid(r.get("created_by_id"))
        ensure_user_exists(cid)
        records.append({
            "id": to_uuid(r["id"]),
            "created_by_id": cid,
            "date": r["date"],
            "clarity": parse_num(r.get("clarity")),
            "energy": parse_num(r.get("energy")),
            "stress": parse_num(r.get("stress")),
            "sleep_quality": parse_num(r.get("sleep_quality")),
            "caffeine_drinks": r.get("caffeine_drinks") or None,
            "caffeine_servings": parse_num(r.get("caffeine_servings")),
            "caffeine_last_time": r.get("caffeine_last_time") or None,
            "side_effects": r.get("side_effects") or None,
            "demand": r.get("demand") or None,
            "note": r.get("note") or None,
            "valid": parse_bool(r.get("valid")),
        })

    if records:
        supabase.table("daily_check_ins").upsert(records).execute()
        print(f"  Upserted {len(records)} daily_check_ins records.", flush=True)

def import_clinician_reviews():
    print("\n--- 4. Importing Clinician Reviews ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/e04009bd-79fe-41b1-b2ef-87e278b5e56e/.user_uploaded/media_1786928672054.csv"
    if not os.path.exists(path):
        print(f"  File not found: {path}", flush=True)
        return

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        cid = to_uuid(r.get("created_by_id"))
        ensure_user_exists(cid)
        records.append({
            "id": to_uuid(r["id"]),
            "created_by_id": cid,
            "user_name": r.get("user_name"),
            "goal": r.get("goal"),
            "recommendation": r.get("recommendation"),
            "protocol_family": r.get("protocol_family"),
            "safety_flags": parse_array(r.get("safety_flags")),
            "evidence_level": r.get("evidence_level"),
            "ai_reasoning": r.get("ai_reasoning"),
            "status": r.get("status"),
            "decision_notes": r.get("decision_notes") or None,
            "decided_date": r.get("decided_date") or None,
        })

    if records:
        supabase.table("clinician_reviews").upsert(records).execute()
        print(f"  Upserted {len(records)} clinician_reviews records.", flush=True)

def import_brain_domains():
    print("\n--- 5. Importing Brain Domains ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/e04009bd-79fe-41b1-b2ef-87e278b5e56e/.user_uploaded/media_1786928671853.csv"
    if not os.path.exists(path):
        path = "C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded/media_1786915002147.csv"

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        cid = to_uuid(r.get("created_by_id"))
        ensure_user_exists(cid)
        records.append({
            "id": to_uuid(r["id"]),
            "created_by_id": cid,
            "domain_key": r.get("domain_key"),
            "domain_name": r.get("domain_name"),
            "score": parse_num(r.get("score")),
            "confidence": r.get("confidence") or "moderate",
            "trend": r.get("trend") or "stable",
            "summary": r.get("summary") or None,
            "limiting_factors": parse_array(r.get("limiting_factors")),
            "protective_factors": parse_array(r.get("protective_factors")),
            "next_action": r.get("next_action") or None,
            "data_sources": parse_array(r.get("data_sources")),
        })

    if records:
        for i in range(0, len(records), 20):
            chunk = records[i:i+20]
            supabase.table("brain_domains").upsert(chunk).execute()
        print(f"  Upserted {len(records)} brain_domains records.", flush=True)

def import_clinical_flags():
    print("\n--- 6. Importing Clinical Flags ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded/media_1786915002151.csv"
    if not os.path.exists(path):
        print(f"  File not found: {path}", flush=True)
        return

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        uid = to_uuid(r.get("user_id"))
        admin_id = to_uuid(r.get("admin_id"))
        cid = to_uuid(r.get("created_by_id"))
        ensure_user_exists(uid, full_name=r.get("user_name"))
        ensure_user_exists(admin_id, full_name=r.get("admin_name"))
        ensure_user_exists(cid)

        records.append({
            "id": to_uuid(r["id"]),
            "flag_type": r.get("flag_type") or "auto",
            "source_agent": r.get("source_agent") or "system",
            "message_snippet": r.get("message_snippet"),
            "user_id": uid,
            "user_name": r.get("user_name") or None,
            "admin_id": admin_id,
            "admin_name": r.get("admin_name") or None,
            "status": r.get("status") or "pending",
            "clinician_note": r.get("clinician_note") or None,
        })

    if records:
        supabase.table("clinical_flags").upsert(records).execute()
        print(f"  Upserted {len(records)} clinical_flags records.", flush=True)

def import_admin_otps():
    print("\n--- 7. Importing Admin OTPs ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded/media_1786915002142.csv"
    if not os.path.exists(path):
        print(f"  File not found: {path}", flush=True)
        return

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        uid = to_uuid(r.get("user_id"))
        cid = to_uuid(r.get("created_by_id"))
        ensure_user_exists(uid)
        ensure_user_exists(cid)

        records.append({
            "id": to_uuid(r["id"]),
            "user_id": uid,
            "code": r.get("code"),
            "expires_at": r.get("expires_at"),
            "used": parse_bool(r.get("used")),
            "created_by_id": cid,
        })

    if records:
        supabase.table("admin_otps").upsert(records).execute()
        print(f"  Upserted {len(records)} admin_otps records.", flush=True)

def import_assessments():
    print("\n--- 8. Importing Assessments ---", flush=True)
    path = "C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded/media_1786915002172.csv"
    if not os.path.exists(path):
        print(f"  File not found: {path}", flush=True)
        return

    with open(path, "r", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        cid = to_uuid(r.get("created_by_id"))
        ensure_user_exists(cid)
        records.append({
            "id": to_uuid(r["id"]),
            "created_by_id": cid,
            "responses": parse_json(r.get("responses")),
            "version": r.get("version") or "1.0",
            "completed_date": r.get("completed_date") or None,
        })

    if records:
        supabase.table("assessments").upsert(records).execute()
        print(f"  Upserted {len(records)} assessments records.", flush=True)

def export_clean_csvs():
    print("\n--- 9. Exporting Clean Standard CSVs to repository 'data/csv/' ---", flush=True)
    os.makedirs("data/csv", exist_ok=True)
    
    tables_to_export = [
        "profiles", "captcha_configs", "daily_check_ins", "clinician_reviews",
        "brain_domains", "clinical_flags", "admin_otps", "assessments", "super_admin_configs"
    ]
    
    for tbl in tables_to_export:
        res = supabase.table(tbl).select("*").execute()
        data = res.data or []
        csv_path = f"data/csv/{tbl}.csv"
        if data:
            fieldnames = list(data[0].keys())
            with open(csv_path, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for row in data:
                    formatted_row = {}
                    for k, v in row.items():
                        if isinstance(v, (dict, list)):
                            formatted_row[k] = json.dumps(v)
                        else:
                            formatted_row[k] = v
                    writer.writerow(formatted_row)
            print(f"  Saved data/csv/{tbl}.csv ({len(data)} rows)", flush=True)
        else:
            print(f"  Table {tbl} is empty.", flush=True)

def verify_all():
    print("\n--- 10. Verification of Supabase Tables vs Local Datasets ---", flush=True)
    tables = [
        "profiles", "captcha_configs", "daily_check_ins", "clinician_reviews",
        "brain_domains", "clinical_flags", "admin_otps", "assessments"
    ]
    for t in tables:
        res = supabase.table(t).select("*", count="exact").limit(1).execute()
        print(f"  Table '{t}': {res.count} records active in Supabase.", flush=True)

def main():
    setup_users_and_profiles()
    import_captcha_configs()
    import_daily_check_ins()
    import_clinician_reviews()
    import_brain_domains()
    import_clinical_flags()
    import_admin_otps()
    import_assessments()
    export_clean_csvs()
    verify_all()
    print("\n========================================================", flush=True)
    print(" ALL SUPABASE CONFIG & CSV DATA SYNCED SUCCESSFULLY! ", flush=True)
    print("========================================================", flush=True)

if __name__ == "__main__":
    main()

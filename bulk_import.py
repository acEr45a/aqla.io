import os
import glob
import csv
import json
import re
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_SECRET_KEY = (
    os.getenv("SUPABASE_SECRET_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("VITE_SUPABASE_ANON_KEY")
)

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment variables.")

print(f"Connecting to Supabase at {SUPABASE_URL} with Secret Key...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

TABLE_MAPPING = {
    "adminotp": "admin_otps",
    "appsettings": "app_settings",
    "assessment": "assessments",
    "assessments": "assessments",
    "braindomain": "brain_domains",
    "clinicalflag": "clinical_flags",
    "clinicianreview": "clinician_reviews",
    "cognitivetest": "cognitive_tests",
    "dailycheckin": "daily_check_ins",
    "devidea": "dev_ideas",
    "devwordbankidea": "dev_wordbank_ideas",
    "emaildigest": "email_digests",
    "experiment": "experiments",
    "gamerating": "game_ratings",
    "gamesession": "game_sessions",
    "healthprofile": "health_profiles",
    "memberrecommendation": "member_recommendations",
    "pdfarchive": "pdf_archives",
    "pdftheme": "pdf_themes",
    "planreview": "plan_reviews",
    "protocol": "protocols",
    "sitevisit": "site_visits",
    "superadminconfig": "super_admin_configs",
    "superadminlog": "super_admin_logs",
    "usercomplaint": "user_complaints",
    "user": "profiles",
}

HEADER_SIGNATURES = {
    "admin_otps": {"code", "expires_at", "used"},
    "brain_domains": {"domain_key", "domain_name", "score"},
    "clinical_flags": {"message_snippet", "source_agent", "flag_type"},
    "assessments": {"responses", "completed_date", "version"},
    "game_ratings": {"game_id", "game_name", "stars"},
    "plan_reviews": {"protocol_id", "protocol_family", "decision"},
    "game_sessions": {"game_id", "score", "raw_results"},
    "health_profiles": {"eligibility_status", "responses"},
    "ingredients": {"evidence_grade", "family", "role"},
    "daily_check_ins": {"clarity", "energy", "stress", "sleep_quality"},
    "cognitive_tests": {"test_type", "normalized_score"},
}

METADATA_COLUMNS_TO_STRIP = {"created_date", "updated_date", "is_sample"}
ARRAY_COLUMNS = {
    "data_sources", "protective_factors", "limiting_factors", "references",
    "supporting_actions", "measuring", "safety_flags", "steps", "expected_benefits",
    "confounders", "interactions"
}

def to_uuid(val):
    if not val or not isinstance(val, str):
        return None
    clean = val.strip().strip('"')
    if not clean or clean.startswith("service_"):
        return None
    if re.match(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", clean):
        return clean
    if re.match(r"^[0-9a-fA-F]{24}$", clean):
        hex_str = clean.zfill(32)
        return f"{hex_str[0:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:32]}"
    return clean

def json_to_pg_array(val):
    if not val:
        return []
    if isinstance(val, list):
        return val
    if isinstance(val, str) and val.startswith("[") and val.endswith("]"):
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return [str(val)]

def parse_cell_value(col, val):
    if val is None or val == "" or val == '""':
        return None

    val = str(val).strip()

    if col in ("id", "user_id", "created_by_id", "admin_id", "protocol_id", "target_user_id"):
        return to_uuid(val)

    if col in ARRAY_COLUMNS:
        return json_to_pg_array(val)

    if (val.startswith("{") and val.endswith("}")) or (val.startswith("[") and val.endswith("]")):
        try:
            return json.loads(val)
        except Exception:
            pass

    return val

def ensure_user_exists(user_id):
    if not user_id:
        return
    try:
        # Create user via Auth Admin API if not present
        supabase.auth.admin.create_user({
            "id": user_id,
            "email": f"user_{user_id.replace('-', '')[:10]}@aqla.io",
            "email_confirm": True,
            "user_metadata": {"full_name": "Imported User"}
        })
        print(f"  Provisioned auth.users entry for ID: {user_id}")
    except Exception as e:
        # Ignore if user already exists
        pass

def resolve_table_name(filepath, fieldnames=None):
    filename = os.path.basename(filepath).lower()
    clean_name = filename.replace("_export.csv", "").replace(".csv", "").replace("media_", "").replace("_sanitized", "").replace("_supabase_ready", "")

    for key, target_table in TABLE_MAPPING.items():
        if key == clean_name or key in clean_name:
            return target_table

    if fieldnames:
        cols_set = set(fieldnames)
        for target_table, sig in HEADER_SIGNATURES.items():
            if sig.issubset(cols_set):
                return target_table

    return None

def process_and_import_csv(filepath, chunk_size=50):
    if not os.path.exists(filepath):
        return

    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            return

        table_name = resolve_table_name(filepath, fieldnames)
        if not table_name:
            print(f"Skipping {os.path.basename(filepath)} - unmapped file structure.")
            return

        print(f"\nImporting {os.path.basename(filepath)} -> Table: '{table_name}'")

        valid_cols = [c for c in fieldnames if c not in METADATA_COLUMNS_TO_STRIP]

        rows = []
        user_ids_needed = set()

        for row in reader:
            parsed_row = {}
            for col in valid_cols:
                parsed_val = parse_cell_value(col, row.get(col))
                parsed_row[col] = parsed_val
                if col in ("user_id", "created_by_id") and parsed_val:
                    user_ids_needed.add(parsed_val)

            rows.append(parsed_row)

    if not rows:
        print(f"No records found in {os.path.basename(filepath)}")
        return

    # Provision referenced auth users to satisfy foreign key constraints
    if user_ids_needed:
        print(f"Ensuring {len(user_ids_needed)} referenced users exist in auth.users...")
        for uid in user_ids_needed:
            ensure_user_exists(uid)

    print(f"Found {len(rows)} records. Upserting into '{table_name}'...")

    total_upserted = 0
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        try:
            supabase.table(table_name).upsert(chunk).execute()
            total_upserted += len(chunk)
            print(f"  Batch {i // chunk_size + 1}: Upserted {len(chunk)} rows (Total: {total_upserted}/{len(rows)})")
        except Exception as e:
            err_str = str(e)
            print(f"  Batch starting at {i} error: {err_str}")
            # Fallback if unknown column error occurs
            if "Could not find" in err_str and "in the schema cache" in err_str:
                col_match = re.search(r"Could not find the '([^']+)' column", err_str)
                if col_match:
                    bad_col = col_match.group(1)
                    print(f"  Retrying batch without unmapped column '{bad_col}'...")
                    fallback_chunk = [{k: v for k, v in r.items() if k != bad_col} for r in chunk]
                    try:
                        supabase.table(table_name).upsert(fallback_chunk).execute()
                        total_upserted += len(fallback_chunk)
                        print(f"  Fallback Batch {i // chunk_size + 1}: Upserted {len(fallback_chunk)} rows (Total: {total_upserted}/{len(rows)})")
                    except Exception as e2:
                        print(f"  Fallback retry failed: {e2}")

    print(f"Table '{table_name}' sync complete: {total_upserted}/{len(rows)} rows inserted.")

def find_csv_files():
    search_paths = [
        "C:/Users/danis/.gemini/antigravity-ide/brain/131450f9-5807-422c-8b5c-e16cac541437/.user_uploaded/*.csv",
        "*.csv",
        "*_export.csv",
        "**/*_export.csv"
    ]
    found = set()
    for pattern in search_paths:
        for filepath in glob.glob(pattern, recursive=True):
            if "node_modules" not in filepath and "dist" not in filepath and "sanitized_imports" not in filepath and "supabase_ready_imports" not in filepath:
                found.add(os.path.abspath(filepath))
    return sorted(list(found))

def main():
    csv_files = find_csv_files()
    print(f"Found {len(csv_files)} source CSV files to import.")

    processed_tables = set()
    for filepath in csv_files:
        table_name = resolve_table_name(filepath)
        if table_name and table_name in processed_tables:
            continue
        process_and_import_csv(filepath)
        if table_name:
            processed_tables.add(table_name)

    print("\n========================================================")
    print("BULK IMPORT COMPLETED SUCCESSFULLY!")
    print("========================================================")

if __name__ == "__main__":
    main()

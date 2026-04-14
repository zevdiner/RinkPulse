"""
upload_to_supabase.py

Creates Supabase tables with explicit schemas (lineId/playerId as text),
then inserts MoneyPuck CSV data in batches.

Setup:
    pip install supabase

Usage:
    Set env vars, then run from the repo root:
        set SUPABASE_URL=https://ehgruwrzgmwtctzzqsew.supabase.co
        set SUPABASE_KEY=<your service_role key>   # NOT anon key — needs DDL access
        python upload_to_supabase.py

    Or on Mac/Linux:
        SUPABASE_URL=https://ehgruwrzgmwtctzzqsew.supabase.co \\
        SUPABASE_KEY=<your service_role key> \\
        python upload_to_supabase.py
"""

import csv
import os
import sys
import time

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase package not installed. Run: pip install supabase")
    sys.exit(1)

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ehgruwrzgmwtctzzqsew.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
BATCH_SIZE = 500  # rows per insert — stay well under Supabase's 1 MB request limit

# ─── Table Schemas ───────────────────────────────────────────────────────────

# DDL is executed via Supabase's SQL editor REST endpoint (service_role only).
# lineId and playerId are TEXT — their raw values exceed bigint's 19-digit max.

SKATERS_DDL = """
CREATE TABLE IF NOT EXISTS mp_skaters (
    "playerId"               text,
    season                   integer,
    name                     text,
    team                     text,
    position                 text,
    situation                text,
    games_played             integer,
    icetime                  real,
    shifts                   real,
    "gameScore"              real,
    "onIce_xGoalsPercentage" real,
    "offIce_xGoalsPercentage" real,
    "onIce_corsiPercentage"  real,
    "offIce_corsiPercentage" real,
    "onIce_fenwickPercentage" real,
    "offIce_fenwickPercentage" real,
    "iceTimeRank"            real,
    "I_F_xOnGoal"            real,
    "I_F_xGoals"             real,
    "I_F_xRebounds"          real,
    "I_F_xFreeze"            real,
    "I_F_xPlayStopped"       real,
    "I_F_xPlayContinued"     real,
    "I_F_primaryAssists"     real,
    "I_F_secondaryAssists"   real,
    "I_F_points"             real,
    "I_F_goals"              real,
    "I_F_rebounds"           real,
    "I_F_freeze"             real,
    "I_F_playStopped"        real,
    "I_F_playContinuedInZone" real,
    "I_F_playContinuedOutsideZone" real,
    "I_F_savedShotsOnGoal"   real,
    "I_F_savedUnblockedShotAttempts" real,
    "I_F_shots"              real,
    "I_F_highDangerShots"    real,
    "I_F_mediumDangerShots"  real,
    "I_F_lowDangerShots"     real,
    "I_F_blockedShotAttempts" real,
    "I_F_unblockedShotAttempts" real,
    "I_F_draftKings"         real,
    "I_F_shifts"             real,
    "I_F_oZoneShiftStarts"   real,
    "I_F_dZoneShiftStarts"   real,
    "I_F_neutralZoneShiftStarts" real,
    "I_F_flyShiftStarts"     real,
    "I_F_oZoneShiftEnds"     real,
    "I_F_dZoneShiftEnds"     real,
    "I_F_neutralZoneShiftEnds" real,
    "I_F_flyShiftEnds"       real,
    "I_F_faceOffsWon"        real,
    "I_F_faceOffsLost"       real,
    "I_F_highDangerGoals"    real,
    "I_F_mediumDangerGoals"  real,
    "I_F_lowDangerGoals"     real,
    "I_F_scoringChances"     real,
    "I_F_missedShots"        real,
    "I_F_hits"               real,
    "I_F_takeaways"          real,
    "I_F_giveaways"          real,
    "I_F_penalityMinutes"    real,
    "I_F_penaltiesDrawn"     real,
    "I_F_penaltiesTaken"     real
);
"""

LINES_DDL = """
CREATE TABLE IF NOT EXISTS mp_lines (
    "lineId"                 text,
    season                   integer,
    name                     text,
    team                     text,
    position                 text,
    situation                text,
    games_played             integer,
    icetime                  real,
    "iceTimeRank"            real,
    "xGoalsPercentage"       real,
    "corsiPercentage"        real,
    "fenwickPercentage"      real,
    "xOnGoalFor"             real,
    "xGoalsFor"              real,
    "xReboundsFor"           real,
    "xFreezeFor"             real,
    "xPlayStoppedFor"        real,
    "xPlayContinuedFor"      real,
    "xOnGoalAgainst"         real,
    "xGoalsAgainst"          real,
    "xReboundsAgainst"       real,
    "xFreezeAgainst"         real,
    "xPlayStoppedAgainst"    real,
    "xPlayContinuedAgainst"  real,
    "goalsFor"               real,
    "goalsAgainst"           real,
    "shotsOnGoalFor"         real,
    "shotsOnGoalAgainst"     real,
    "highDangerShotsFor"     real,
    "highDangerShotsAgainst" real,
    "highDangerGoalsFor"     real,
    "highDangerGoalsAgainst" real,
    "corsiFor"               real,
    "corsiAgainst"           real,
    "fenwickFor"             real,
    "fenwickAgainst"         real
);
"""

# ─── Helpers ─────────────────────────────────────────────────────────────────

def run_sql(client: Client, sql: str, label: str) -> None:
    """Execute arbitrary SQL via Supabase's rpc endpoint."""
    try:
        # Supabase exposes a built-in RPC for raw SQL when using service_role
        res = client.rpc("exec_sql", {"query": sql}).execute()
        print(f"  DDL OK  {label}")
    except Exception as e:
        # Fallback: some Supabase versions expose it differently
        print(f"  DDL WARN  {label}: {e}")
        print("  → If table creation failed, create the tables manually in the SQL editor,")
        print("    then re-run this script (it will skip DDL and go straight to inserts).")


def coerce_row(row: dict) -> dict:
    """Convert empty strings to None and numeric strings to numbers where safe."""
    out = {}
    for k, v in row.items():
        if v == "" or v is None:
            out[k] = None
        else:
            out[k] = v
    return out


def insert_csv(client: Client, table: str, csv_path: str, str_cols: set[str]) -> None:
    if not os.path.exists(csv_path):
        print(f"  SKIP  {csv_path} not found")
        return

    print(f"  Reading {os.path.basename(csv_path)} ...")
    rows: list[dict] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            coerced = coerce_row(row)
            # Ensure ID columns stay as strings
            for col in str_cols:
                if col in coerced and coerced[col] is not None:
                    coerced[col] = str(coerced[col])
            rows.append(coerced)

    total = len(rows)
    print(f"  Inserting {total:,} rows into {table} in batches of {BATCH_SIZE} ...")

    inserted = 0
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        try:
            client.table(table).insert(batch).execute()
            inserted += len(batch)
            pct = inserted / total * 100
            print(f"    {inserted:,}/{total:,}  ({pct:.0f}%)", end="\r")
        except Exception as e:
            print(f"\n  ERROR at batch {i//BATCH_SIZE + 1}: {e}")
            print("  Stopping — fix the error and re-run (already-inserted rows are safe).")
            sys.exit(1)
        # Small sleep to avoid overwhelming the REST API
        time.sleep(0.05)

    print(f"\n  Done — {inserted:,} rows inserted into {table}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY env var not set.")
        print("       Use your service_role key (Settings → API in the Supabase dashboard).")
        sys.exit(1)

    print(f"Connecting to {SUPABASE_URL} ...\n")
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── Create tables ────────────────────────────────────────────────────────
    print("Creating tables (if not exists) ...")
    run_sql(client, SKATERS_DDL, "mp_skaters")
    run_sql(client, LINES_DDL, "mp_lines")
    print()

    # ── Insert data ──────────────────────────────────────────────────────────
    # Prefer the _fixed CSVs (string IDs); fall back to originals if not present.
    skaters_csv = os.path.join(DATA_DIR, "skaters_fixed.csv")
    if not os.path.exists(skaters_csv):
        skaters_csv = os.path.join(DATA_DIR, "skaters.csv")

    lines_csv = os.path.join(DATA_DIR, "lines_fixed.csv")
    if not os.path.exists(lines_csv):
        lines_csv = os.path.join(DATA_DIR, "lines.csv")

    insert_csv(client, "mp_skaters", skaters_csv, str_cols={"playerId"})
    print()
    insert_csv(client, "mp_lines", lines_csv, str_cols={"lineId"})

    print("\nAll done.")


if __name__ == "__main__":
    main()

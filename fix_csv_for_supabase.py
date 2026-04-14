"""
fix_csv_for_supabase.py

Prepares MoneyPuck CSVs for Supabase upload:
  - lines.csv   → lines_fixed.csv   (lineId cast to text — 21-digit number exceeds bigint)
  - skaters.csv → skaters_fixed.csv (playerId cast to text — avoids type-inference edge cases)

Run from the repo root:
    python fix_csv_for_supabase.py
"""

import csv
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def fix_csv(src_name: str, dest_name: str, str_columns: list[str]) -> None:
    src = os.path.join(DATA_DIR, src_name)
    dest = os.path.join(DATA_DIR, dest_name)

    if not os.path.exists(src):
        print(f"  SKIP  {src_name} not found at {src}")
        return

    with open(src, newline="", encoding="utf-8") as fin, \
         open(dest, "w", newline="", encoding="utf-8") as fout:

        reader = csv.DictReader(fin)
        assert reader.fieldnames, f"No headers found in {src_name}"
        fieldnames = list(reader.fieldnames)

        missing = [c for c in str_columns if c not in fieldnames]
        if missing:
            print(f"  WARN  Column(s) not found in {src_name}: {missing}")

        writer = csv.DictWriter(fout, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()

        rows_written = 0
        for row in reader:
            for col in str_columns:
                if col in row and row[col] is not None:
                    # Force the value to be written as a quoted string
                    row[col] = str(row[col])
            writer.writerow(row)
            rows_written += 1

    print(f"  OK    {src_name} → {dest_name}  ({rows_written:,} rows, columns forced to text: {str_columns})")


def main() -> None:
    print(f"Data directory: {DATA_DIR}\n")

    fix_csv(
        src_name="lines.csv",
        dest_name="lines_fixed.csv",
        str_columns=["lineId"],
    )

    fix_csv(
        src_name="skaters.csv",
        dest_name="skaters_fixed.csv",
        str_columns=["playerId"],
    )

    print("\nDone. Upload lines_fixed.csv and skaters_fixed.csv to Supabase.")
    print("In the Supabase table editor, set lineId → text, playerId → text.")


if __name__ == "__main__":
    main()

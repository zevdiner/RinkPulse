"""
slim_lines.py

Filters lines.csv to situation=all and keeps only the columns needed
for the line comparison tool. Output is lines_slim.csv (~1-2 MB),
small enough to commit and bundle with Vercel.

Run from the repo root:
    python slim_lines.py
"""

import csv
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

KEEP_COLS = [
    "lineId", "season", "name", "team", "position", "situation",
    "games_played", "icetime",
    "xGoalsPercentage", "corsiPercentage", "fenwickPercentage",
    "goalsFor", "goalsAgainst",
]


def main() -> None:
    src = os.path.join(DATA_DIR, "lines.csv")
    dest = os.path.join(DATA_DIR, "lines_slim.csv")

    if not os.path.exists(src):
        print(f"ERROR: {src} not found.")
        return

    written = 0

    with open(src, newline="", encoding="utf-8") as fin, \
         open(dest, "w", newline="", encoding="utf-8") as fout:

        reader = csv.DictReader(fin)
        assert reader.fieldnames, "No headers in lines.csv"

        missing = [c for c in KEEP_COLS if c not in reader.fieldnames]
        if missing:
            print(f"WARN: columns not found in source: {missing}")

        # Write header
        fout.write(",".join(KEEP_COLS) + "\n")

        for row in reader:
            parts = []
            for col in KEEP_COLS:
                val = row.get(col, "")
                if col == "lineId":
                    # Always quote — value exceeds bigint (21 digits)
                    parts.append(f'"{val}"')
                elif val and any(c in val for c in (',', '"', '\n')):
                    parts.append('"' + val.replace('"', '""') + '"')
                else:
                    parts.append(val)
            fout.write(",".join(parts) + "\n")
            written += 1

    size_kb = os.path.getsize(dest) / 1024
    print(f"Done: {written:,} rows written")
    print(f"Output: {dest}  ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()

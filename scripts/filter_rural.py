#!/usr/bin/env python3
"""
Filter rural-accent speakers from corpus metadata (e.g. AISHELL-3).

Examples:
  # AISHELL-3 metadata (TSV)
  python3 scripts/filter_rural.py AISHELL-3/metadata.tsv data/rural_speakers.csv

  # Generic CSV (has 'accent' column)
  python3 scripts/filter_rural.py data/metadata.csv data/rural_speakers.csv

Requires: pandas (pip install pandas)
"""
import sys

def main():
  if len(sys.argv) < 3:
    print("Usage: filter_rural.py <metadata.(tsv|csv)> <output.csv>")
    sys.exit(1)
  src = sys.argv[1]
  out = sys.argv[2]
  try:
    import pandas as pd
  except Exception:
    print("This tool requires pandas. Install with: pip install pandas")
    sys.exit(2)

  # Heuristic delimiter
  sep = "\t" if src.endswith(".tsv") else ","
  df = pd.read_csv(src, sep=sep)

  # Try to locate an accent-like column
  cols = {c.lower(): c for c in df.columns}
  accent_col = None
  for key in ["accent", "region", "notes"]:
    if key in cols:
      accent_col = cols[key]
      break
  if accent_col is None:
    print("Could not find 'accent'/'region'/'notes' column in metadata.")
    print("Available columns:", list(df.columns))
    sys.exit(3)

  pattern = r"东北|河南|四川|山东|陕西|Dongbei|Henan|Sichuan|Shandong|Shaanxi"
  rural = df[df[accent_col].astype(str).str.contains(pattern, na=False, regex=True)].copy()
  rural.to_csv(out, index=False)
  print("Found", len(rural), "rural-accent speakers →", out)

if __name__ == "__main__":
  main()

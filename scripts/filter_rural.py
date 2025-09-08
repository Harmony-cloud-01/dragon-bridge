#!/usr/bin/env python3
"""
Filter rural speakers from dataset metadata.

Input: CSV with columns like: speaker_id,region,gender,age,notes
Output: CSV rows for rural speakers → stdout

Usage:
  python3 scripts/filter_rural.py data/raw/metadata.csv > data/rural_speakers.csv
"""
import csv
import sys


def is_rural(row: dict) -> bool:
  region = (row.get("region") or "").lower()
  notes = (row.get("notes") or "").lower()
  # naive rule: look for rural tags/keywords
  keywords = ["rural", "village", "county", "countryside", "乡", "村"]
  return any(k in region or k in notes for k in keywords)


def main():
  if len(sys.argv) < 2:
    print("Usage: filter_rural.py <metadata.csv>", file=sys.stderr)
    sys.exit(1)
  path = sys.argv[1]
  with open(path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    writer = csv.DictWriter(sys.stdout, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
      if is_rural(row):
        writer.writerow(row)


if __name__ == "__main__":
  main()


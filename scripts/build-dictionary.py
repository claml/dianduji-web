#!/usr/bin/env python3
"""Build the web dictionary from the mobile repo's ECDICT sqlite.

Reads `entries` (word/phonetic/part_of_speech/definition_english/
definition_chinese) and `lemmas` (form -> lemma) and writes one gzip
chunk per first letter plus `misc.json.gz` into public/dictionary/.

Usage:
    python scripts/build-dictionary.py <path-to-ecdict.sqlite>
    # e.g. 点读机/.worktrees/flutter-mvp-remaining/mobile/assets/dictionary/ecdict.sqlite

The chunks are committed to the repo (ECDICT is MIT licensed) so CI and
deploy do not need the source database; the script stays for rebuilds.
"""

import gzip
import json
import os
import sqlite3
import string
import sys

CHUNKS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "public", "dictionary"
)


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    source = sys.argv[1]
    conn = sqlite3.connect(source)
    conn.row_factory = sqlite3.Row

    chunks: dict[str, dict] = {}
    for letter in string.ascii_lowercase:
        chunks[letter] = {"entries": {}, "lemmas": {}}
    chunks["misc"] = {"entries": {}, "lemmas": {}}

    def chunk_for(word: str) -> str:
        key = word[0].lower() if word else ""
        return key if key in chunks else "misc"

    rows = conn.execute(
        "SELECT word, phonetic, part_of_speech, definition_english, "
        "definition_chinese FROM entries"
    )
    for row in rows:
        chunk = chunk_for(row["word"])
        chunks[chunk]["entries"][row["word"]] = {
            "p": row["phonetic"] or "",
            "pos": row["part_of_speech"] or "",
            "en": row["definition_english"] or "",
            "zh": row["definition_chinese"] or "",
        }

    rows = conn.execute("SELECT form, lemma FROM lemmas")
    for row in rows:
        form = (row["form"] or "").strip()
        if form:
            chunks[chunk_for(form)]["lemmas"][form] = row["lemma"]

    conn.close()

    os.makedirs(CHUNKS_DIR, exist_ok=True)
    total = 0
    for key, data in sorted(chunks.items()):
        if not data["entries"] and not data["lemmas"]:
            continue
        raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode(
            "utf-8"
        )
        path = os.path.join(CHUNKS_DIR, f"{key}.json.gz")
        with gzip.open(path, "wb", compresslevel=9) as handle:
            handle.write(raw)
        size = os.path.getsize(path)
        total += size
        print(f"{key}.json.gz  {size / 1024:.0f} KB  ({len(data['entries'])} entries)")

    print(f"total: {total / 1024:.0f} KB across chunks")


if __name__ == "__main__":
    main()

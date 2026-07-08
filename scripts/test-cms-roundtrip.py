#!/usr/bin/env python3
"""Test sheet ↔ JSON round-trip (mirrors Apps Script SheetReader logic)."""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def nested_to_flat(obj, prefix=""):
    flat = {}
    for key, val in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(val, dict):
            flat.update(nested_to_flat(val, full_key))
        elif isinstance(val, list):
            flat[full_key] = "\n".join(val)
        else:
            flat[full_key] = "" if val is None else str(val)
    return flat


def flat_to_nested(flat):
    result = {}
    for key, val in flat.items():
        parts = key.split(".")
        current = result
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        last = parts[-1]
        if key == "crisis.paragraphs":
            current[last] = [p.strip() for p in val.split("\n") if p.strip()]
        else:
            current[last] = val
    return result


def main():
    with open(os.path.join(ROOT, "content.json")) as f:
        original = json.load(f)

    flat = nested_to_flat(original)
    rebuilt = flat_to_nested(flat)

    if original == rebuilt:
        print(f"Round-trip OK ({len(flat)} fields)")
        return

    print("Round-trip MISMATCH:")
    for key in set(list(original.keys()) + list(rebuilt.keys())):
        if original.get(key) != rebuilt.get(key):
            print(f"  {key}:")
            print(f"    original: {original.get(key)!r:.80}")
            print(f"    rebuilt:  {rebuilt.get(key)!r:.80}")
    sys.exit(1)


if __name__ == "__main__":
    main()

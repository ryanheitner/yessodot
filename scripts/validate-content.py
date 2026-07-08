#!/usr/bin/env python3
"""Validate content.json structure and run basic site checks."""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_json(path):
    with open(path) as f:
        return json.load(f)


def validate_content(data):
    errors = []

    required_top = [
        "meta", "hero", "crisis", "atmosphere", "approach",
        "science", "evidence", "partners", "leadership", "donate",
    ]
    for key in required_top:
        if key not in data:
            errors.append(f"Missing top-level key: {key}")

    if "hero" in data:
        h = data["hero"]
        if not h.get("headlineEmphasis"):
            errors.append("hero.headlineEmphasis is required")
        if not re.match(r"^\d+$|vimeo\.com", str(h.get("videoUrl", ""))):
            errors.append("hero.videoUrl must be Vimeo ID or URL")

    if "crisis" in data:
        if not data["crisis"].get("paragraphs"):
            errors.append("crisis.paragraphs must have at least one paragraph")

    if "donate" in data:
        email = data["donate"].get("email", "")
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
            errors.append("donate.email is invalid")

    return errors


def validate_fallback_in_index():
    errors = []
    index_path = os.path.join(ROOT, "index.html")
    with open(index_path) as f:
        html = f.read()

    match = re.search(
        r'<script type="application/json" id="content-fallback">(.*?)</script>',
        html,
        re.DOTALL,
    )
    if not match:
        errors.append("index.html missing content-fallback script tag")
        return errors

    try:
        fallback = json.loads(match.group(1))
        errors.extend(validate_content(fallback))
    except json.JSONDecodeError as e:
        errors.append(f"content-fallback JSON invalid: {e}")

    return errors


def validate_files_exist():
    errors = []
    for path in ["index.html", "content.json", "site.js", "assets/logo-nav.png"]:
        if not os.path.exists(os.path.join(ROOT, path)):
            errors.append(f"Missing file: {path}")
    return errors


def main():
    all_errors = validate_files_exist()

    content_path = os.path.join(ROOT, "content.json")
    if os.path.exists(content_path):
        data = load_json(content_path)
        all_errors.extend(validate_content(data))

    all_errors.extend(validate_fallback_in_index())

    if all_errors:
        print("VALIDATION FAILED:")
        for e in all_errors:
            print(f"  - {e}")
        sys.exit(1)

    print("All validations passed.")
    print(f"  content.json: {len(json.dumps(load_json(content_path)))} bytes")
    print(f"  sections: meta, hero, crisis, atmosphere, approach, science, evidence, partners, leadership, donate")


if __name__ == "__main__":
    main()

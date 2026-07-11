#!/usr/bin/env python3
"""Regenerate google-sheets/sheet-fields.json and SeedData.gs from content.json."""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LABELS = {
    "meta.pageTitle": "Browser tab title",
    "meta.copyrightYear": "Copyright year (e.g. 2026)",
    "hero.eyebrow": "Hero location label",
    "hero.headlineBefore": "Headline text before emphasis",
    "hero.headlineEmphasis": "Headline emphasized word (shown in italic)",
    "hero.headlineAfter": "Headline text after emphasis",
    "hero.tagline": "Hero subtitle paragraph",
    "hero.videoUrl": "Vimeo video ID or URL",
    "hero.ctaPrimary": "Primary button text",
    "hero.ctaSecondary": "Secondary button text",
    "crisis.eyebrow": "Section label",
    "crisis.title": "Section heading",
    "crisis.paragraphs": "Body paragraphs (one per line)",
    "crisis.stat1.value": "Stat 1 number",
    "crisis.stat1.label": "Stat 1 description",
    "crisis.stat2.value": "Stat 2 number",
    "crisis.stat2.label": "Stat 2 description",
    "crisis.stat3.value": "Stat 3 number",
    "crisis.stat3.label": "Stat 3 description",
    "atmosphere.quote": "Photo overlay quote",
    "atmosphere.attribution": "Photo overlay attribution",
    "atmosphere.imageAlt": "Photo accessibility description",
    "approach.eyebrow": "Section label",
    "approach.title": "Section heading",
    "approach.lead": "Intro paragraph",
    "approach.pillar1.title": "Pillar 1 title",
    "approach.pillar1.body": "Pillar 1 description",
    "approach.pillar2.title": "Pillar 2 title",
    "approach.pillar2.body": "Pillar 2 description",
    "approach.pillar3.title": "Pillar 3 title",
    "approach.pillar3.body": "Pillar 3 description",
    "science.eyebrow": "Section label",
    "science.title": "Section heading",
    "science.lead": "Intro paragraph",
    "science.point1.title": "Research point 1 title",
    "science.point1.body": "Research point 1 description",
    "science.point2.title": "Research point 2 title",
    "science.point2.body": "Research point 2 description",
    "science.point3.title": "Research point 3 title",
    "science.point3.body": "Research point 3 description",
    "science.point4.title": "Research point 4 title",
    "science.point4.body": "Research point 4 description",
    "evidence.eyebrow": "Section label",
    "evidence.title": "Section heading",
    "evidence.lead": "Intro paragraph",
    "evidence.source": "Chart source line",
    "evidence.captionBold": "Chart caption (bold part)",
    "evidence.caption": "Chart caption (regular part)",
    "evidence.chartAlt": "Chart accessibility description",
    "partners.eyebrow": "Section label",
    "partners.title": "Section heading",
    "partners.lead": "Intro paragraph",
    "partners.partner1.badge": "Partner 1 category badge",
    "partners.partner1.name": "Partner 1 name",
    "partners.partner1.description": "Partner 1 description",
    "partners.partner2.badge": "Partner 2 category badge",
    "partners.partner2.name": "Partner 2 name",
    "partners.partner2.description": "Partner 2 description",
    "partners.partner3.badge": "Partner 3 category badge",
    "partners.partner3.name": "Partner 3 name",
    "partners.partner3.description": "Partner 3 description",
    "leadership.eyebrow": "Section label",
    "leadership.title": "Section heading",
    "leadership.lead": "Intro paragraph",
    "leadership.leader1.name": "Team member 1 name",
    "leadership.leader1.title": "Team member 1 role/title (optional)",
    "leadership.leader1.bio": "Team member 1 bio",
    "leadership.leader1.photo": "Team member 1 photo path (e.g. assets/team-arik.jpg)",
    "leadership.leader1.photoPosition": "Team member 1 photo crop position (e.g. center 20%)",
    "leadership.leader2.name": "Team member 2 name",
    "leadership.leader2.title": "Team member 2 role/title (optional)",
    "leadership.leader2.bio": "Team member 2 bio",
    "leadership.leader2.photo": "Team member 2 photo path",
    "leadership.leader2.photoPosition": "Team member 2 photo crop position",
    "leadership.leader3.name": "Team member 3 name",
    "leadership.leader3.title": "Team member 3 role/title (optional)",
    "leadership.leader3.bio": "Team member 3 bio",
    "leadership.leader3.photo": "Team member 3 photo path",
    "leadership.leader3.photoPosition": "Team member 3 photo crop position",
    "leadership.leader4.name": "Team member 4 name",
    "leadership.leader4.title": "Team member 4 role/title (optional)",
    "leadership.leader4.bio": "Team member 4 bio",
    "leadership.leader4.photo": "Team member 4 photo path",
    "leadership.leader4.photoPosition": "Team member 4 photo crop position",
    "leadership.leader5.name": "Team member 5 name",
    "leadership.leader5.title": "Team member 5 role/title (optional)",
    "leadership.leader5.bio": "Team member 5 bio",
    "leadership.leader5.photo": "Team member 5 photo path",
    "leadership.leader5.photoPosition": "Team member 5 photo crop position",
    "donate.eyebrow": "Section label",
    "donate.title": "Section heading",
    "donate.lead": "Intro paragraph",
    "donate.email": "Donation contact email",
    "donate.ctaText": "Donate button text",
    "donate.tier1.amount": "Tier 1 amount",
    "donate.tier1.impact": "Tier 1 description",
    "donate.tier2.amount": "Tier 2 amount",
    "donate.tier2.impact": "Tier 2 description",
    "donate.tier3.amount": "Tier 3 amount",
    "donate.tier3.impact": "Tier 3 description",
    "donate.tier4.amount": "Tier 4 amount",
    "donate.tier4.impact": "Tier 4 description",
}

TAB_MAP = {
    "meta": "Meta",
    "hero": "Hero",
    "crisis": "Crisis",
    "atmosphere": "Atmosphere",
    "approach": "Approach",
    "science": "Science",
    "evidence": "Evidence",
    "partners": "Partners",
    "leadership": "Leadership",
    "donate": "Donate",
}


def flatten(obj, prefix=""):
    rows = []
    for k, v in obj.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            rows.extend(flatten(v, key))
        elif isinstance(v, list):
            rows.append((key, "\n".join(v)))
        else:
            rows.append((key, str(v) if v is not None else ""))
    return rows


def main():
    with open(os.path.join(ROOT, "content.json")) as f:
        content = json.load(f)

    tabs = {}
    for key, value in flatten(content):
        if key == "meta.publishedAt":
            continue  # stamped at publish time — never seeded into the sheet
        section = key.split(".")[0]
        tab = TAB_MAP.get(section, section.title())
        tabs.setdefault(tab, []).append(
            {"key": key, "label": LABELS.get(key, key), "value": value}
        )

    sheets_dir = os.path.join(ROOT, "google-sheets")
    with open(os.path.join(sheets_dir, "sheet-fields.json"), "w") as f:
        json.dump(tabs, f, indent=2, ensure_ascii=False)

    with open(os.path.join(sheets_dir, "SeedData.gs"), "w") as f:
        f.write("/** Auto-generated from content.json — run scripts/sync-sheet-seed.py */\n")
        f.write("var SHEET_SEED_DATA = ")
        f.write(json.dumps(tabs, ensure_ascii=False))
        f.write(";\n")

    print(f"Synced {sum(len(v) for v in tabs.values())} fields across {len(tabs)} tabs")


if __name__ == "__main__":
    main()

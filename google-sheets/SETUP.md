# Google Sheets CMS — Setup Guide

This guide walks through creating the **Yessodot Website Content** Google Sheet and connecting it to GitHub for publishing.

## Prerequisites

- Google account (admin — you own the sheet and Apps Script)
- GitHub account with write access to the [yessodot](https://github.com) repository
- A fine-grained GitHub Personal Access Token (PAT)

## Step 1: Create the GitHub token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Name: `Yessodot Sheet Publisher`
4. Repository access: **Only select repositories** → choose `yessodot`
5. Permissions → **Contents**: Read and write
6. Generate and copy the token (you won't see it again)

## Step 2: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Rename it to **Yessodot Website Content**
3. Share with your editor as **Editor** (optional — only if they should edit cells)
4. Keep Script Properties admin-only (the editor never needs Apps Script access)

## Step 3: Install the Apps Script

1. In the spreadsheet: **Extensions** → **Apps Script**
2. Delete any default `Code.gs` content
3. Create these script files (click **+** next to Files) and paste content from this repo's `google-sheets/` folder:

| Apps Script file | Source in repo |
|---|---|
| `Code.gs` | [`google-sheets/Code.gs`](Code.gs) |
| `Config.gs` | [`google-sheets/Config.gs`](Config.gs) |
| `SheetReader.gs` | [`google-sheets/SheetReader.gs`](SheetReader.gs) |
| `Validator.gs` | [`google-sheets/Validator.gs`](Validator.gs) |
| `GitHub.gs` | [`google-sheets/GitHub.gs`](GitHub.gs) |
| `Setup.gs` | [`google-sheets/Setup.gs`](Setup.gs) |
| `SeedData.gs` | [`google-sheets/SeedData.gs`](SeedData.gs) |

4. Click **Project Settings** (gear icon) → **Script properties** → Add:

| Property | Value |
|---|---|
| `GITHUB_TOKEN` | Your fine-grained PAT from Step 1 |
| `GITHUB_OWNER` | Your GitHub username or org |
| `GITHUB_REPO` | `yessodot` |
| `GITHUB_BRANCH` | `main` |

5. Update `GITHUB_OWNER` in `Config.gs` if you prefer hardcoding it there instead of Script Properties

6. Click **Run** on `setupSheet` (or reload the spreadsheet and use **Yessodot → Setup sheet**)
   - Authorize the script when prompted (Google account + external requests for GitHub API)

## Step 4: Initialize the sheet

1. Reload the Google Sheet
2. You should see a **Yessodot** menu in the menu bar
3. Click **Yessodot → Setup sheet (first time)**
4. Confirm — this creates all tabs with current website content
5. Read the **Instructions** tab

## Step 5: Test publish

1. Click **Yessodot → Preview changes** — should show a summary with no errors
2. Click **Yessodot → Publish to website** — confirm
3. Check the **Publish Log** tab for a Success entry with a commit SHA
4. Verify on GitHub that `content.json` was updated
5. Visit https://www.yessodot.org after ~1 minute to confirm

## Editor workflow (handoff)

Tell your editor:

1. **Edit** — change text in the **Value** column (column C) on any content tab
2. **Preview** — Yessodot menu → Preview changes (checks for errors)
3. **Publish** — Yessodot menu → Publish to website
4. **Undo mistakes in the sheet** — File → Version history
5. **Undo mistakes on the website** — ask admin to run Rollback last publish

## Regenerating seed data

If `content.json` in the repo is updated directly, regenerate the Apps Script seed file:

```bash
python3 scripts/sync-sheet-seed.py
```

Then copy the updated `google-sheets/SeedData.gs` into Apps Script.

## Troubleshooting

| Problem | Solution |
|---|---|
| `GITHUB_TOKEN not set` | Add token in Script Properties |
| `GitHub API error 401` | Token expired or wrong permissions — regenerate PAT |
| `GitHub API error 404` | Check GITHUB_OWNER and GITHUB_REPO |
| Validation errors on publish | Fix highlighted cells; check Publish Log for details |
| Website shows old content | Hard-refresh browser (Cmd+Shift+R); GitHub Pages can take ~1 min |
| Site blank after bad publish | Should not happen — fallback JSON is embedded in index.html. If it does, rollback via menu or git revert |

## Security notes

- Never put the GitHub token in the spreadsheet itself
- The sheet is private — only share with people who should edit content
- `content.json` on the live site is public (marketing copy only — no secrets)
- Rotate the GitHub PAT periodically

/**
 * Configuration — update GITHUB_REPO after forking, or set via Script Properties.
 *
 * Script Properties (File → Project properties → Script properties):
 *   GITHUB_TOKEN  — fine-grained PAT with Contents read/write on the repo
 *   GITHUB_OWNER  — GitHub username or org (optional if set here)
 *   GITHUB_REPO   — repository name (optional if set here)
 *   GITHUB_BRANCH — branch to publish to (default: main)
 */

var CONFIG = {
  GITHUB_OWNER: 'YOUR_GITHUB_USERNAME',
  GITHUB_REPO: 'yessodot',
  GITHUB_BRANCH: 'main',
  CONTENT_PATH: 'content.json',
  INDEX_PATH: 'index.html',
  CONTENT_TABS: [
    'Meta', 'Hero', 'Crisis', 'Atmosphere', 'Approach',
    'Science', 'Evidence', 'Partners', 'Leadership', 'Donate'
  ],
  PUBLISH_LOG_TAB: 'Publish Log',
  INSTRUCTIONS_TAB: 'Instructions'
};

function getConfig_(key) {
  var props = PropertiesService.getScriptProperties();
  var val = props.getProperty(key);
  if (val) return val;
  var map = {
    GITHUB_OWNER: CONFIG.GITHUB_OWNER,
    GITHUB_REPO: CONFIG.GITHUB_REPO,
    GITHUB_BRANCH: CONFIG.GITHUB_BRANCH
  };
  return map[key] || '';
}

function getGitHubToken_() {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN not set. Go to Extensions → Apps Script → Project Settings → Script Properties and add GITHUB_TOKEN.'
    );
  }
  return token;
}

/**
 * GitHub Contents API — publish content.json and update fallback in index.html.
 */

function githubApi_(method, path, body) {
  var token = getGitHubToken_();
  var owner = getConfig_('GITHUB_OWNER');
  var repo = getConfig_('GITHUB_REPO');
  var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;

  var options = {
    method: method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  };

  if (body) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('GitHub API error (' + code + '): ' + text);
  }

  return JSON.parse(text);
}

function getFileFromGitHub_(path) {
  var token = getGitHubToken_();
  var owner = getConfig_('GITHUB_OWNER');
  var repo = getConfig_('GITHUB_REPO');
  var branch = getConfig_('GITHUB_BRANCH') || 'main';
  var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path + '?ref=' + branch;

  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() === 404) return null;

  var data = JSON.parse(response.getContentText());
  return {
    sha: data.sha,
    content: Utilities.newBlob(Utilities.base64Decode(data.content)).getDataAsString()
  };
}

function commitFile_(path, content, message, sha) {
  var body = {
    message: message,
    content: Utilities.base64Encode(Utilities.newBlob(content).getBytes()),
    branch: getConfig_('GITHUB_BRANCH') || 'main'
  };
  if (sha) body.sha = sha;

  return githubApi_('PUT', path, body);
}

/**
 * Stamp publish time so the site can prefer fresher content over a stale CDN copy.
 */
function stampPublishedAt_(data) {
  if (!data.meta) data.meta = {};
  data.meta.publishedAt = Utilities.formatDate(
    new Date(),
    'UTC',
    "yyyy-MM-dd'T'HH:mm:ss'Z'"
  );
  return data;
}

/**
 * Ensure every Value column is plain text so Sheets never converts 80% → 0.8.
 */
function ensureValueColumnsAreText_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  CONFIG.CONTENT_TABS.forEach(function (tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet || sheet.getLastRow() < 2) return;
    sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).setNumberFormat('@');
  });
}

function updateIndexForPublish_(contentJson, publishedAt) {
  var indexFile = getFileFromGitHub_(CONFIG.INDEX_PATH);
  if (!indexFile) {
    Logger.log('index.html not found on GitHub — skipping fallback update');
    return null;
  }

  var html = indexFile.content;
  var minified = JSON.stringify(JSON.parse(contentJson));
  var pattern = /(<script type="application\/json" id="content-fallback">)([\s\S]*?)(<\/script>)/;
  if (!html.match(pattern)) {
    Logger.log('content-fallback script tag not found in index.html');
    return null;
  }

  html = html.replace(pattern, function (_match, openTag, _old, closeTag) {
    return openTag + minified + closeTag;
  });

  // Stamp revision on <html> so site.js can cache-bust fetches
  if (/data-content-rev="[^"]*"/.test(html)) {
    html = html.replace(/data-content-rev="[^"]*"/, 'data-content-rev="' + publishedAt + '"');
  } else {
    html = html.replace(/<html(\s[^>]*)?>/, function (match) {
      if (match.indexOf('data-content-rev=') !== -1) return match;
      return match.replace('<html', '<html data-content-rev="' + publishedAt + '"');
    });
  }

  // Cache-bust site.js itself after publishes
  if (/src="site\.js(\?[^"]*)?"/.test(html)) {
    html = html.replace(/src="site\.js(\?[^"]*)?"/, 'src="site.js?v=' + encodeURIComponent(publishedAt) + '"');
  }

  return {
    content: html,
    sha: indexFile.sha
  };
}

function publishToGitHub(data) {
  ensureValueColumnsAreText_();
  data = stampPublishedAt_(data);

  var contentJson = JSON.stringify(data, null, 2) + '\n';
  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jerusalem', "yyyy-MM-dd HH:mm");
  var message = 'Publish content from Google Sheet — ' + timestamp;
  var publishedAt = data.meta.publishedAt;

  var existing = getFileFromGitHub_(CONFIG.CONTENT_PATH);
  var contentResult = commitFile_(
    CONFIG.CONTENT_PATH,
    contentJson,
    message,
    existing ? existing.sha : null
  );

  var indexUpdate = updateIndexForPublish_(contentJson, publishedAt);
  var indexResult = null;
  if (indexUpdate) {
    // Re-fetch SHA in case content.json commit changed nothing about index path
    // (index is a separate file — existing sha from getFile is fine)
    indexResult = commitFile_(
      CONFIG.INDEX_PATH,
      indexUpdate.content,
      'Update content fallback — ' + timestamp,
      indexUpdate.sha
    );
  }

  return {
    contentSha: contentResult.commit.sha,
    indexSha: indexResult ? indexResult.commit.sha : null,
    message: message,
    publishedAt: publishedAt
  };
}

function rollbackLastPublish() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(CONFIG.PUBLISH_LOG_TAB);
  if (!logSheet) throw new Error('Publish Log tab not found');

  var data = logSheet.getDataRange().getValues();
  var lastSuccessSha = null;
  var previousContentSha = null;

  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === 'Success' && data[i][3]) {
      if (!lastSuccessSha) {
        lastSuccessSha = data[i][3];
      } else {
        previousContentSha = data[i][3];
        break;
      }
    }
  }

  if (!previousContentSha) {
    throw new Error('No previous successful publish found to roll back to. Use Google Sheets version history instead.');
  }

  var token = getGitHubToken_();
  var owner = getConfig_('GITHUB_OWNER');
  var repo = getConfig_('GITHUB_REPO');
  var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/commits/' + previousContentSha;

  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  var commit = JSON.parse(response.getContentText());
  var treeUrl = commit.commit.tree.url;

  var treeResponse = UrlFetchApp.fetch(treeUrl + '?recursive=1', {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json'
    }
  });
  var tree = JSON.parse(treeResponse.getContentText());
  var contentFile = tree.tree.find(function (f) {
    return f.path === CONFIG.CONTENT_PATH;
  });

  if (!contentFile) throw new Error('content.json not found in previous commit');

  var blobResponse = UrlFetchApp.fetch(contentFile.url, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json'
    }
  });
  var blob = JSON.parse(blobResponse.getContentText());
  var oldContent = Utilities.newBlob(Utilities.base64Decode(blob.content)).getDataAsString();

  // Re-stamp so the rolled-back content is treated as fresher than any stale CDN copy
  var oldData = JSON.parse(oldContent);
  stampPublishedAt_(oldData);
  oldContent = JSON.stringify(oldData, null, 2) + '\n';

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jerusalem', "yyyy-MM-dd HH:mm");
  var existing = getFileFromGitHub_(CONFIG.CONTENT_PATH);
  var result = commitFile_(
    CONFIG.CONTENT_PATH,
    oldContent,
    'Rollback content to ' + previousContentSha.substring(0, 7) + ' — ' + timestamp,
    existing ? existing.sha : null
  );

  var indexUpdate = updateIndexForPublish_(oldContent, oldData.meta.publishedAt);
  if (indexUpdate) {
    commitFile_(
      CONFIG.INDEX_PATH,
      indexUpdate.content,
      'Rollback content fallback — ' + timestamp,
      indexUpdate.sha
    );
  }

  return result.commit.sha;
}

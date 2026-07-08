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

function updateFallbackInIndex_(contentJson) {
  var indexFile = getFileFromGitHub_(CONFIG.INDEX_PATH);
  if (!indexFile) {
    Logger.log('index.html not found on GitHub — skipping fallback update');
    return null;
  }

  var html = indexFile.content;
  var minified = JSON.stringify(JSON.parse(contentJson));
  var pattern = /(<script type="application\/json" id="content-fallback">)([\s\S]*?)(<\/script>)/;
  var match = html.match(pattern);

  if (!match) {
    Logger.log('content-fallback script tag not found in index.html');
    return null;
  }

  var updated = html.replace(pattern, '$1' + minified + '$3');
  return {
    content: updated,
    sha: indexFile.sha
  };
}

function publishToGitHub(data) {
  var contentJson = JSON.stringify(data, null, 2) + '\n';
  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jerusalem', "yyyy-MM-dd HH:mm");
  var message = 'Publish content from Google Sheet — ' + timestamp;

  // Get current content.json SHA for update
  var existing = getFileFromGitHub_(CONFIG.CONTENT_PATH);
  var contentResult = commitFile_(
    CONFIG.CONTENT_PATH,
    contentJson,
    message,
    existing ? existing.sha : null
  );

  // Update fallback in index.html
  var indexUpdate = updateFallbackInIndex_(contentJson);
  var indexResult = null;
  if (indexUpdate) {
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
    message: message
  };
}

function rollbackLastPublish() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(CONFIG.PUBLISH_LOG_TAB);
  if (!logSheet) throw new Error('Publish Log tab not found');

  var data = logSheet.getDataRange().getValues();
  var lastSuccessSha = null;
  var previousContentSha = null;

  // Find last two successful publishes
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

  // Fetch the content.json from the previous commit
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

  // Find content.json in that commit's tree
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

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jerusalem', "yyyy-MM-dd HH:mm");
  var existing = getFileFromGitHub_(CONFIG.CONTENT_PATH);
  var result = commitFile_(
    CONFIG.CONTENT_PATH,
    oldContent,
    'Rollback content to ' + previousContentSha.substring(0, 7) + ' — ' + timestamp,
    existing ? existing.sha : null
  );

  var indexUpdate = updateFallbackInIndex_(oldContent);
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

/**
 * Reads content tabs and builds a nested JSON object.
 */

function readSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var flat = {};

  CONFIG.CONTENT_TABS.forEach(function (tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      throw new Error('Missing tab: ' + tabName);
    }
    var data = sheet.getDataRange().getValues();
    // Skip header row
    for (var i = 1; i < data.length; i++) {
      var key = String(data[i][0] || '').trim();
      var value = data[i][2];
      if (!key) continue;
      if (value === null || value === undefined) value = '';
      flat[key] = String(value);
    }
  });

  return flatToNested_(flat);
}

function flatToNested_(flat) {
  var result = {};

  Object.keys(flat).forEach(function (key) {
    var parts = key.split('.');
    var current = result;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    var lastKey = parts[parts.length - 1];
    var val = flat[key];

    // crisis.paragraphs is stored as newline-separated text
    if (key === 'crisis.paragraphs') {
      current[lastKey] = val.split('\n').map(function (p) {
        return p.trim();
      }).filter(function (p) {
        return p.length > 0;
      });
    } else {
      current[lastKey] = val;
    }
  });

  return result;
}

function nestedToFlat_(obj, prefix) {
  var flat = {};
  prefix = prefix || '';

  Object.keys(obj).forEach(function (key) {
    var fullKey = prefix ? prefix + '.' + key : key;
    var val = obj[key];
    if (Array.isArray(val)) {
      flat[fullKey] = val.join('\n');
    } else if (val !== null && typeof val === 'object') {
      var nested = nestedToFlat_(val, fullKey);
      Object.keys(nested).forEach(function (k) {
        flat[k] = nested[k];
      });
    } else {
      flat[fullKey] = val === null || val === undefined ? '' : String(val);
    }
  });

  return flat;
}

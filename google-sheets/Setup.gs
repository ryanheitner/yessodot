/**
 * One-time setup: creates tabs, headers, seed data, protections, and validations.
 * Run via menu: Yessodot → Setup sheet (first time only)
 */

var INSTRUCTIONS_TEXT = [
  ['YESSODOT WEBSITE CONTENT — EDITOR GUIDE'],
  [''],
  ['HOW TO EDIT'],
  ['1. Go to any content tab (Hero, Crisis, Approach, etc.)'],
  ['2. Edit only the Value column (column C)'],
  ['3. Do not change Field Key or Label columns'],
  [''],
  ['HOW TO PUBLISH'],
  ['1. Click Yessodot menu → Preview changes'],
  ['2. Review the summary, then click Yessodot → Publish to website'],
  ['3. Wait for the success message — changes go live in ~1 minute'],
  [''],
  ['IF SOMETHING GOES WRONG'],
  ['• Undo in the sheet: File → Version history → Restore an older version'],
  ['• Undo on the website: Yessodot menu → Rollback last publish'],
  ['• The website always keeps a backup copy, so it will not go blank'],
  [''],
  ['TIPS'],
  ['• Hero video: enter a Vimeo ID (e.g. 1204006570) or full vimeo.com URL'],
  ['• Crisis paragraphs: put each paragraph on its own line in the cell'],
  ['• Leadership: leave Name blank to show "coming soon" placeholder'],
  ['• Do not paste HTML tags — plain text only'],
  [''],
  ['NEED HELP? Contact the site administrator.']
];

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var response = ui.alert(
    'Setup Yessodot Sheet',
    'This will create/rebuild all content tabs with current website copy. Existing content tab values will be overwritten. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // Remove default Sheet1 if empty
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length === 1) {
    ss.deleteSheet(defaultSheet);
  }

  // Create content tabs
  Object.keys(SHEET_SEED_DATA).forEach(function (tabName) {
    setupContentTab_(ss, tabName, SHEET_SEED_DATA[tabName]);
  });

  setupInstructionsTab_(ss);
  setupPublishLogTab_(ss);

  // Reorder tabs
  var order = CONFIG.CONTENT_TABS.concat([CONFIG.INSTRUCTIONS_TAB, CONFIG.PUBLISH_LOG_TAB]);
  order.forEach(function (name, i) {
    var sheet = ss.getSheetByName(name);
    if (sheet) ss.setActiveSheet(sheet);
    if (sheet) ss.moveActiveSheet(i + 1);
  });

  ss.getSheetByName('Hero').activate();
  ui.alert('Setup complete!', 'The sheet is ready. Read the Instructions tab, then try Preview changes.', ui.ButtonSet.OK);
}

function setupContentTab_(ss, tabName, fields) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  } else {
    sheet.clear();
  }

  // Headers
  var headers = [['Field Key', 'Label', 'Value']];
  sheet.getRange(1, 1, 1, 3).setValues(headers);
  sheet.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setBackground('#3a9e88')
    .setFontColor('#ffffff');

  // Data rows
  var rows = fields.map(function (f) {
    return [f.key, f.label, f.value];
  });
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length + 1, 3).setValues(rows);
  }

  // Formatting
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 500);
  if (rows.length > 0) {
    sheet.getRange(2, 3, rows.length + 1, 3).setWrap(true);
  }

  // Conditional formatting: highlight empty required Value cells
  var valueRange = sheet.getRange(2, 3, Math.max(rows.length + 1, 2), 3);
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenCellEmpty()
    .setBackground('#fce4e4')
    .setRanges([valueRange])
    .build();
  sheet.setConditionalFormatRules([rule]);

  // Data validation for video URL on Hero tab
  if (tabName === 'Hero') {
    var videoRow = fields.findIndex(function (f) {
      return f.key === 'hero.videoUrl';
    });
    if (videoRow >= 0) {
      var cell = sheet.getRange(videoRow + 2, 3);
      var validation = SpreadsheetApp.newDataValidation()
        .requireTextMatchesPattern('^\\d+$|vimeo\\.com')
        .setHelpText('Enter a Vimeo video ID (numbers only) or a vimeo.com URL')
        .build();
      cell.setDataValidation(validation);
    }
  }

  // Data validation for email on Donate tab
  if (tabName === 'Donate') {
    var emailRow = fields.findIndex(function (f) {
      return f.key === 'donate.email';
    });
    if (emailRow >= 0) {
      var emailCell = sheet.getRange(emailRow + 2, 3);
      var emailValidation = SpreadsheetApp.newDataValidation()
        .requireTextMatchesPattern('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')
        .setHelpText('Enter a valid email address')
        .build();
      emailCell.setDataValidation(emailValidation);
    }
  }

  // Protect Field Key and Label columns
  protectSheetColumns_(sheet, Math.max(rows.length, 1));
}

function protectSheetColumns_(sheet, numRows) {
  var protection = sheet.protect().setDescription('Locked structure columns');
  protection.setUnprotectedRanges([
    sheet.getRange(2, 3, numRows + 1, 3)
  ]);
  // Only owner can edit protected ranges
  protection.setWarningOnly(false);
}

function setupInstructionsTab_(ss) {
  var sheet = ss.getSheetByName(CONFIG.INSTRUCTIONS_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.INSTRUCTIONS_TAB);
  } else {
    sheet.clear();
  }

  sheet.getRange(1, 1, INSTRUCTIONS_TEXT.length, 1).setValues(INSTRUCTIONS_TEXT);
  sheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  sheet.setColumnWidth(1, 700);

  sheet.protect().setDescription('Instructions — read only');
}

function setupPublishLogTab_(ss) {
  var sheet = ss.getSheetByName(CONFIG.PUBLISH_LOG_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.PUBLISH_LOG_TAB);
  } else {
    sheet.clear();
  }

  var headers = [['Timestamp', 'Status', 'Message', 'Commit SHA', 'Details']];
  sheet.getRange(1, 1, 1, 5).setValues(headers);
  sheet.getRange(1, 1, 1, 5)
    .setFontWeight('bold')
    .setBackground('#2a1f1a')
    .setFontColor('#f7f3ee');
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 300);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 400);

  sheet.protect().setDescription('Publish log — managed by script');
}

function logPublish_(status, message, commitSha, details) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PUBLISH_LOG_TAB);
  if (!sheet) return;

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([
    timestamp,
    status,
    message,
    commitSha || '',
    details || ''
  ]);
}

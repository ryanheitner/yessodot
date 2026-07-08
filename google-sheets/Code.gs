/**
 * Main entry point — custom menu and publish orchestration.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Yessodot')
    .addItem('Preview changes', 'menuPreview')
    .addItem('Publish to website', 'menuPublish')
    .addSeparator()
    .addItem('Rollback last publish', 'menuRollback')
    .addSeparator()
    .addItem('Setup sheet (first time)', 'setupSheet')
    .addToUi();
}

function menuPreview() {
  try {
    var data = readSheet();
    var errors = validateContent(data);
    var ui = SpreadsheetApp.getUi();

    if (errors.length > 0) {
      ui.alert(
        'Validation errors',
        'Fix these before publishing:\n\n' + errors.join('\n'),
        ui.ButtonSet.OK
      );
      return;
    }

    ui.alert(
      'Preview — ready to publish',
      getPreviewSummary(data),
      ui.ButtonSet.OK
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function menuPublish() {
  var ui = SpreadsheetApp.getUi();

  try {
    var data = readSheet();
    var errors = validateContent(data);

    if (errors.length > 0) {
      ui.alert(
        'Cannot publish — validation errors',
        errors.join('\n'),
        ui.ButtonSet.OK
      );
      logPublish_('Failed', 'Validation failed', '', errors.join('; '));
      return;
    }

    var confirm = ui.alert(
      'Publish to website?',
      getPreviewSummary(data) + '\n\nThis will update the live website. Continue?',
      ui.ButtonSet.YES_NO
    );
    if (confirm !== ui.Button.YES) return;

    var result = publishToGitHub(data);
    logPublish_('Success', result.message, result.contentSha, 'index: ' + (result.indexSha || 'skipped'));

    ui.alert(
      'Published!',
      'Changes are committed to GitHub and will be live in ~1 minute.\n\nCommit: ' + result.contentSha.substring(0, 7),
      ui.ButtonSet.OK
    );
  } catch (e) {
    logPublish_('Failed', e.message, '', '');
    ui.alert('Publish failed', e.message, ui.ButtonSet.OK);
  }
}

function menuRollback() {
  var ui = SpreadsheetApp.getUi();

  var confirm = ui.alert(
    'Rollback last publish?',
    'This will restore the website content to the previous successful publish. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  try {
    var sha = rollbackLastPublish();
    logPublish_('Rollback', 'Rolled back to previous version', sha, '');
    ui.alert('Rollback complete', 'Website content restored. Commit: ' + sha.substring(0, 7), ui.ButtonSet.OK);
  } catch (e) {
    logPublish_('Failed', 'Rollback failed: ' + e.message, '', '');
    ui.alert('Rollback failed', e.message, ui.ButtonSet.OK);
  }
}

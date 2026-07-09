/**
 * Content validation before publish.
 */

var FIELD_RULES = {
  'meta.pageTitle': { required: true, maxLength: 200 },
  'meta.copyrightYear': { required: true, pattern: /^\d{4}$/ },
  'hero.eyebrow': { required: true, maxLength: 50 },
  'hero.headlineBefore': { required: true, maxLength: 80 },
  'hero.headlineEmphasis': { required: true, maxLength: 40 },
  'hero.headlineAfter': { required: true, maxLength: 80 },
  'hero.tagline': { required: true, maxLength: 500 },
  'hero.videoUrl': { required: true, maxLength: 100, validator: 'vimeo' },
  'hero.ctaPrimary': { required: true, maxLength: 50 },
  'hero.ctaSecondary': { required: true, maxLength: 50 },
  'crisis.eyebrow': { required: true, maxLength: 50 },
  'crisis.title': { required: true, maxLength: 120 },
  'crisis.paragraphs': { required: true, validator: 'paragraphs' },
  'crisis.stat1.value': { required: true, maxLength: 20 },
  'crisis.stat1.label': { required: true, maxLength: 500 },
  'crisis.stat2.value': { required: true, maxLength: 20 },
  'crisis.stat2.label': { required: true, maxLength: 500 },
  'crisis.stat3.value': { required: true, maxLength: 20 },
  'crisis.stat3.label': { required: true, maxLength: 500 },
  'atmosphere.quote': { required: true, maxLength: 300 },
  'atmosphere.attribution': { required: true, maxLength: 100 },
  'atmosphere.imageAlt': { required: true, maxLength: 300 },
  'approach.eyebrow': { required: true, maxLength: 50 },
  'approach.title': { required: true, maxLength: 120 },
  'approach.lead': { required: true, maxLength: 500 },
  'approach.pillar1.title': { required: true, maxLength: 80 },
  'approach.pillar1.body': { required: true, maxLength: 600 },
  'approach.pillar2.title': { required: true, maxLength: 80 },
  'approach.pillar2.body': { required: true, maxLength: 600 },
  'approach.pillar3.title': { required: true, maxLength: 80 },
  'approach.pillar3.body': { required: true, maxLength: 600 },
  'science.eyebrow': { required: true, maxLength: 50 },
  'science.title': { required: true, maxLength: 120 },
  'science.lead': { required: true, maxLength: 500 },
  'science.point1.title': { required: true, maxLength: 80 },
  'science.point1.body': { required: true, maxLength: 600 },
  'science.point2.title': { required: true, maxLength: 80 },
  'science.point2.body': { required: true, maxLength: 600 },
  'science.point3.title': { required: true, maxLength: 80 },
  'science.point3.body': { required: true, maxLength: 600 },
  'science.point4.title': { required: true, maxLength: 80 },
  'science.point4.body': { required: true, maxLength: 600 },
  'evidence.eyebrow': { required: true, maxLength: 50 },
  'evidence.title': { required: true, maxLength: 120 },
  'evidence.lead': { required: true, maxLength: 800 },
  'evidence.source': { required: true, maxLength: 200 },
  'evidence.captionBold': { required: true, maxLength: 200 },
  'evidence.caption': { required: true, maxLength: 1000 },
  'evidence.chartAlt': { required: true, maxLength: 500 },
  'partners.eyebrow': { required: true, maxLength: 50 },
  'partners.title': { required: true, maxLength: 120 },
  'partners.lead': { required: true, maxLength: 500 },
  'partners.partner1.badge': { required: true, maxLength: 30 },
  'partners.partner1.name': { required: true, maxLength: 80 },
  'partners.partner1.description': { required: true, maxLength: 800 },
  'partners.partner2.badge': { required: true, maxLength: 30 },
  'partners.partner2.name': { required: true, maxLength: 80 },
  'partners.partner2.description': { required: true, maxLength: 800 },
  'partners.partner3.badge': { required: true, maxLength: 30 },
  'partners.partner3.name': { required: true, maxLength: 80 },
  'partners.partner3.description': { required: true, maxLength: 800 },
  'leadership.eyebrow': { required: true, maxLength: 50 },
  'leadership.title': { required: true, maxLength: 120 },
  'leadership.lead': { required: true, maxLength: 500 },
  'leadership.leader1.bio': { required: true, maxLength: 800 },
  'leadership.leader2.bio': { required: true, maxLength: 800 },
  'leadership.leader3.bio': { required: true, maxLength: 800 },
  'donate.eyebrow': { required: true, maxLength: 50 },
  'donate.title': { required: true, maxLength: 120 },
  'donate.lead': { required: true, maxLength: 500 },
  'donate.email': { required: true, maxLength: 100, validator: 'email' },
  'donate.ctaText': { required: true, maxLength: 50 },
  'donate.tier1.amount': { required: true, maxLength: 20 },
  'donate.tier1.impact': { required: true, maxLength: 100 },
  'donate.tier2.amount': { required: true, maxLength: 20 },
  'donate.tier2.impact': { required: true, maxLength: 100 },
  'donate.tier3.amount': { required: true, maxLength: 20 },
  'donate.tier3.impact': { required: true, maxLength: 100 },
  'donate.tier4.amount': { required: true, maxLength: 20 },
  'donate.tier4.impact': { required: true, maxLength: 100 }
};

var HTML_PATTERN = /<[^>]+>/;

function validateContent(data) {
  var errors = [];
  var flat = nestedToFlat_(data);

  Object.keys(FIELD_RULES).forEach(function (key) {
    var rule = FIELD_RULES[key];
    var val = flat[key];

    if (rule.required && (!val || String(val).trim() === '')) {
      errors.push(key + ': required field is empty');
      return;
    }

    if (!val) return;

    var str = String(val);

    if (rule.maxLength && str.length > rule.maxLength) {
      errors.push(key + ': exceeds ' + rule.maxLength + ' characters (' + str.length + ')');
    }

    if (rule.pattern && !rule.pattern.test(str)) {
      errors.push(key + ': invalid format');
    }

    if (HTML_PATTERN.test(str)) {
      errors.push(key + ': HTML tags are not allowed');
    }

    if (rule.validator === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      errors.push(key + ': invalid email address');
    }

    if (rule.validator === 'vimeo' && !isValidVimeo_(str)) {
      errors.push(key + ': must be a Vimeo video ID or vimeo.com URL');
    }

    if (rule.validator === 'paragraphs') {
      var paras = str.split('\n').filter(function (p) {
        return p.trim().length > 0;
      });
      if (paras.length === 0) {
        errors.push(key + ': at least one paragraph required');
      }
    }
  });

  return errors;
}

function isValidVimeo_(val) {
  val = String(val).trim();
  if (/^\d+$/.test(val)) return true;
  return /vimeo\.com\/(?:video\/)?\d+/.test(val);
}

function getPreviewSummary(data) {
  var flat = nestedToFlat_(data);
  var lines = [];
  lines.push('Hero headline: ' + (flat['hero.headlineBefore'] || '') +
    (flat['hero.headlineEmphasis'] || '') + (flat['hero.headlineAfter'] || ''));
  lines.push('Video: ' + (flat['hero.videoUrl'] || ''));
  lines.push('Crisis title: ' + (flat['crisis.title'] || ''));
  lines.push('Crisis stat 1: ' + (flat['crisis.stat1.value'] || '') + ' — ' + (flat['crisis.stat1.label'] || '').substring(0, 60));
  lines.push('Donate email: ' + (flat['donate.email'] || ''));
  lines.push('');
  lines.push('Total fields: ' + Object.keys(flat).length);
  return lines.join('\n');
}

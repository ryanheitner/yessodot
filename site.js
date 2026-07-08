(function () {
  'use strict';

  function getNested(obj, path) {
    return path.split('.').reduce(function (o, key) {
      return o && o[key] !== undefined ? o[key] : undefined;
    }, obj);
  }

  function validateContent(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.hero || !data.hero.headlineEmphasis) return false;
    if (!data.crisis || !data.crisis.title) return false;
    if (!data.donate || !data.donate.email) return false;
    return true;
  }

  function getFallbackContent() {
    var el = document.getElementById('content-fallback');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  async function loadContent() {
    try {
      var res = await fetch('/content.json');
      if (!res.ok) throw new Error('fetch failed: ' + res.status);
      var data = await res.json();
      if (!validateContent(data)) throw new Error('invalid content schema');
      return data;
    } catch (e) {
      var fallback = getFallbackContent();
      if (fallback && validateContent(fallback)) return fallback;
      throw e;
    }
  }

  function setText(el, value) {
    if (el && value !== undefined && value !== null) {
      el.textContent = value;
    }
  }

  function setHtml(el, value) {
    if (el && value !== undefined && value !== null) {
      el.innerHTML = value;
    }
  }

  function vimeoEmbedUrl(videoUrl) {
    var id = String(videoUrl).trim();
    var match = id.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) id = match[1];
    if (!/^\d+$/.test(id)) return null;
    return 'https://player.vimeo.com/video/' + id + '?badge=0&autopause=0&player_id=0&app_id=58479';
  }

  function hydrateHero(data) {
    var h = data.hero;
    setText(document.querySelector('[data-content="hero.eyebrow"]'), h.eyebrow);
    var headline = document.querySelector('[data-content="hero.headline"]');
    if (headline) {
      headline.innerHTML =
        escapeHtml(h.headlineBefore || '') +
        '<em>' + escapeHtml(h.headlineEmphasis || '') + '</em>' +
        escapeHtml(h.headlineAfter || '');
    }
    setText(document.querySelector('[data-content="hero.tagline"]'), h.tagline);
    setText(document.querySelector('[data-content="hero.ctaPrimary"]'), h.ctaPrimary);
    setText(document.querySelector('[data-content="hero.ctaSecondary"]'), h.ctaSecondary);
    var iframe = document.querySelector('[data-content="hero.video"]');
    if (iframe && h.videoUrl) {
      var url = vimeoEmbedUrl(h.videoUrl);
      if (url) iframe.src = url;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hydrateCrisis(data) {
    var c = data.crisis;
    setText(document.querySelector('[data-content="crisis.eyebrow"]'), c.eyebrow);
    setText(document.querySelector('[data-content="crisis.title"]'), c.title);
    var body = document.querySelector('[data-content="crisis.body"]');
    if (body && c.paragraphs) {
      body.innerHTML = c.paragraphs
        .map(function (p, i) {
          var style = i > 0 ? ' style="margin-top:1rem;"' : '';
          return '<p' + style + '>' + escapeHtml(p) + '</p>';
        })
        .join('');
    }
    setText(document.querySelector('[data-content="crisis.stat1.value"]'), c.stat1.value);
    setText(document.querySelector('[data-content="crisis.stat1.label"]'), c.stat1.label);
    setText(document.querySelector('[data-content="crisis.stat2.value"]'), c.stat2.value);
    setText(document.querySelector('[data-content="crisis.stat2.label"]'), c.stat2.label);
    setText(document.querySelector('[data-content="crisis.stat3.value"]'), c.stat3.value);
    setText(document.querySelector('[data-content="crisis.stat3.label"]'), c.stat3.label);
  }

  function hydrateAtmosphere(data) {
    var a = data.atmosphere;
    setText(document.querySelector('[data-content="atmosphere.quote"]'), a.quote);
    setText(document.querySelector('[data-content="atmosphere.attribution"]'), a.attribution);
    var img = document.querySelector('[data-content="atmosphere.image"]');
    if (img) img.alt = a.imageAlt || '';
  }

  function hydrateApproach(data) {
    var ap = data.approach;
    setText(document.querySelector('[data-content="approach.eyebrow"]'), ap.eyebrow);
    setText(document.querySelector('[data-content="approach.title"]'), ap.title);
    setText(document.querySelector('[data-content="approach.lead"]'), ap.lead);
    ['pillar1', 'pillar2', 'pillar3'].forEach(function (key) {
      var p = ap[key];
      setText(document.querySelector('[data-content="approach.' + key + '.title"]'), p.title);
      setText(document.querySelector('[data-content="approach.' + key + '.body"]'), p.body);
    });
  }

  function hydrateScience(data) {
    var s = data.science;
    setText(document.querySelector('[data-content="science.eyebrow"]'), s.eyebrow);
    setText(document.querySelector('[data-content="science.title"]'), s.title);
    setText(document.querySelector('[data-content="science.lead"]'), s.lead);
    ['point1', 'point2', 'point3', 'point4'].forEach(function (key) {
      var p = s[key];
      setText(document.querySelector('[data-content="science.' + key + '.title"]'), p.title);
      setText(document.querySelector('[data-content="science.' + key + '.body"]'), p.body);
    });
  }

  function hydrateEvidence(data) {
    var e = data.evidence;
    setText(document.querySelector('[data-content="evidence.eyebrow"]'), e.eyebrow);
    setText(document.querySelector('[data-content="evidence.title"]'), e.title);
    setText(document.querySelector('[data-content="evidence.lead"]'), e.lead);
    setText(document.querySelector('[data-content="evidence.source"]'), e.source);
    var caption = document.querySelector('[data-content="evidence.caption"]');
    if (caption) {
      caption.innerHTML =
        '<strong>' + escapeHtml(e.captionBold || '') + '</strong> ' + escapeHtml(e.caption || '');
    }
    var img = document.querySelector('[data-content="evidence.chart"]');
    if (img) img.alt = e.chartAlt || '';
  }

  function hydratePartners(data) {
    var p = data.partners;
    setText(document.querySelector('[data-content="partners.eyebrow"]'), p.eyebrow);
    setText(document.querySelector('[data-content="partners.title"]'), p.title);
    setText(document.querySelector('[data-content="partners.lead"]'), p.lead);
    ['partner1', 'partner2', 'partner3'].forEach(function (key) {
      var card = p[key];
      setText(document.querySelector('[data-content="partners.' + key + '.badge"]'), card.badge);
      setText(document.querySelector('[data-content="partners.' + key + '.name"]'), card.name);
      setText(document.querySelector('[data-content="partners.' + key + '.description"]'), card.description);
    });
  }

  function hydrateLeadership(data) {
    var l = data.leadership;
    setText(document.querySelector('[data-content="leadership.eyebrow"]'), l.eyebrow);
    setText(document.querySelector('[data-content="leadership.title"]'), l.title);
    setText(document.querySelector('[data-content="leadership.lead"]'), l.lead);
    ['leader1', 'leader2', 'leader3'].forEach(function (key) {
      var leader = l[key];
      var card = document.querySelector('[data-content="leadership.' + key + '"]');
      if (!card) return;
      if (leader.name) {
        card.innerHTML =
          '<div class="leader-avatar">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>' +
          '</div>' +
          '<h3 style="font-family:\'DM Serif Display\',serif;font-size:18px;margin-bottom:4px;">' +
          escapeHtml(leader.name) +
          '</h3>' +
          (leader.title
            ? '<p style="font-size:13px;color:var(--warm-muted);margin-bottom:8px;">' +
              escapeHtml(leader.title) +
              '</p>'
            : '') +
          '<p style="font-size:14px;color:var(--warm-mid);line-height:1.7;font-weight:300;">' +
          escapeHtml(leader.bio) +
          '</p>';
      } else {
        card.innerHTML =
          '<div class="leader-avatar">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>' +
          '</div>' +
          '<p class="leader-placeholder">' +
          escapeHtml(leader.bio || 'Leadership bio coming soon') +
          '</p>';
      }
    });
  }

  function hydrateDonate(data) {
    var d = data.donate;
    setText(document.querySelector('[data-content="donate.eyebrow"]'), d.eyebrow);
    setText(document.querySelector('[data-content="donate.title"]'), d.title);
    setText(document.querySelector('[data-content="donate.lead"]'), d.lead);
    setText(document.querySelector('[data-content="donate.ctaText"]'), d.ctaText);
    var btn = document.querySelector('[data-content="donate.email"]');
    if (btn && d.email) btn.href = 'mailto:' + d.email;
    ['tier1', 'tier2', 'tier3', 'tier4'].forEach(function (key) {
      var tier = d[key];
      setText(document.querySelector('[data-content="donate.' + key + '.amount"]'), tier.amount);
      setText(document.querySelector('[data-content="donate.' + key + '.impact"]'), tier.impact);
    });
  }

  function hydrateMeta(data) {
    if (data.meta && data.meta.pageTitle) {
      document.title = data.meta.pageTitle;
    }
    setText(document.querySelector('[data-content="meta.copyrightYear"]'), data.meta.copyrightYear);
  }

  function hydrate(data) {
    hydrateMeta(data);
    hydrateHero(data);
    hydrateCrisis(data);
    hydrateAtmosphere(data);
    hydrateApproach(data);
    hydrateScience(data);
    hydrateEvidence(data);
    hydratePartners(data);
    hydrateLeadership(data);
    hydrateDonate(data);
    document.documentElement.classList.add('content-loaded');
  }

  function initInteractions() {
    var tiers = document.getElementById('tiers');
    if (tiers) {
      tiers.addEventListener('click', function (e) {
        var tier = e.target.closest('.tier');
        if (!tier) return;
        document.querySelectorAll('.tier').forEach(function (t) {
          t.classList.remove('active');
        });
        tier.classList.add('active');
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async function () {
    initInteractions();
    try {
      var data = await loadContent();
      hydrate(data);
    } catch (e) {
      console.error('Failed to load content:', e);
    }
  });
})();

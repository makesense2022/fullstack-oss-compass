/* Portfolio Analytics v2. Source of truth: Projects/site-analytics/client.
 * No URL, query, title, form value, error message or stack is transmitted.
 */
(function () {
  'use strict';
  if (window.portfolioAnalytics || (window.top && window.top !== window.self)) return;
  var config = {"endpoint":"https://site-analytics.longlive.workers.dev/v2/collect","origins":{"https://qijian.netlify.app":"qijian","https://dongpo-a-life.netlify.app":"dongpo-a-life","https://art-m.netlify.app":"art-m","https://anibian-edu.netlify.app":"anibian-edu","https://childc-family.netlify.app":"childc-family","https://childc-family.longlive.workers.dev":"childc-family","https://healthspan-guide-cn.netlify.app":"healthspan-guide-cn","https://sea-eater.netlify.app":"sea-eater","https://ai-news-action-center.netlify.app":"ai-news-action-center","https://fluagent.netlify.app":"fluagent","https://fluagent.longlive.workers.dev":"fluagent","https://mindnessai.netlify.app":"mindnessai","https://backrooms-zhangjunnan510.netlify.app":"backrooms-zhangjunnan510","https://games-ten-ashy.vercel.app":"games","https://tiptap-editor-ochre.vercel.app":"tiptap-editor-demo"}};
  var script = document.currentScript;
  var site = script && script.getAttribute('data-site');
  if (!site || config.origins[location.origin] !== site || navigator.webdriver) return;
  var release = script.getAttribute('data-release') || 'unknown';
  if (!/^([a-f0-9]{7,40}|unknown)$/.test(release)) release = 'unknown';
  var visitorKey = 'site-analytics:visitor:v1', sessionKey = 'portfolio-analytics:session:v2';
  var lastPath = null, activeMs = 0, lastTick = Date.now(), engaged = false, errorCount = 0;
  var errorSeen = Object.create(null), disabled = false, actions = Object.create(null);
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function optedOut() {
    if (disabled || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return true;
    try { return localStorage.getItem('site-analytics:disabled') === '1'; } catch (_) { return false; }
  }
  function pathParts() { return location.pathname.split('/').filter(Boolean).filter(function (s, i) { return !(i === 0 && /^(zh|en|zh-CN)$/.test(s)); }); }
  function allowed() { return !optedOut() && !/^(admin|api|auth|login|sign-in|health-profile|chat|journal|settings|account|onboarding)$/.test(pathParts()[0] || ''); }
  function pageGroup() {
    var first = pathParts()[0] || '';
    if (!first) return 'home';
    if (/^(game|play|levels)$/.test(first)) return 'game';
    if (/^(art|movements|themes|collections|cinema|gallery|studio|experiments)$/.test(first)) return 'gallery';
    if (/^(tools|today|session|practice|check-in|compare)$/.test(first)) return 'tool';
    if (/^(about|project\.html|creator\.html|portfolio-privacy\.html|traffic-privacy|privacy|sources|contact)$/.test(first)) return 'about';
    if (/^(posts|articles|works|chapters|life|scenarios|books|guides|actions|capital|frontier|events|sports|principles|animals|stories|concepts|paths|sources|evidence)$/.test(first)) return 'content';
    return 'other';
  }
  function channel() {
    var aliases = { xhs: 'xiaohongshu', xiaohongshu: 'xiaohongshu', zhihu: 'zhihu', wechat: 'wechat', weixin: 'wechat', linkedin: 'linkedin', youtube: 'youtube', github: 'github' };
    try {
      var source = new URL(location.href).searchParams.get('utm_source');
      if (aliases[source]) return aliases[source];
      if (!document.referrer) return source ? 'other' : 'direct';
      var host = new URL(document.referrer).hostname;
      if (host === location.hostname) return 'direct';
      if (/(^|\.)(google\.[a-z.]+|bing\.com|baidu\.com|duckduckgo\.com)$/.test(host)) return 'search';
      for (var key in aliases) if (host === key + '.com' || host.endsWith('.' + key + '.com')) return aliases[key];
      return 'referral';
    } catch (_) { return 'other'; }
  }
  // Fix acquisition channel for a tab session; internal SPA links do not overwrite it.
  var entryChannel = channel();
  function storedId(storage, key, expiry, sliding) {
    try {
      var now = Date.now(), saved = JSON.parse(storage.getItem(key) || 'null');
      var time = saved && (sliding ? saved.last : saved.createdAt);
      if (!saved || !uuid.test(saved.id || '') || typeof time !== 'number' || time > now || now - time >= expiry) saved = { id: crypto.randomUUID(), createdAt: now, channel: entryChannel };
      if (sliding) { saved.last = now; entryChannel = saved.channel || entryChannel; }
      storage.setItem(key, JSON.stringify(saved)); return saved.id;
    } catch (_) { return null; }
  }
  function send(kind, extra) {
    if (!allowed() || document.visibilityState !== 'visible') return;
    var sessionId = storedId(sessionStorage, sessionKey, 30 * 60 * 1000, true);
    var body = { eventId: crypto.randomUUID(), visitorId: storedId(localStorage, visitorKey, 90 * 86400000, false), sessionId: sessionId, kind: kind, pageGroup: pageGroup(), channel: entryChannel, release: release };
    if (extra) { body.errorType = extra.errorType; body.signature = extra.signature; }
    var serialized = JSON.stringify(body);
    function transmit() { return fetch(config.endpoint, { method: 'POST', body: serialized, credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }); }
    // The same event ID is retained for a single retry; analytics failure never breaks the app.
    Promise.resolve().then(transmit).then(function (r) { if (r.status >= 500 && !optedOut()) return transmit(); }).catch(function () {});
  }
  function pageView() {
    if (!allowed()) { lastPath = null; activeMs = 0; return; }
    if (document.visibilityState !== 'visible' || lastPath === location.pathname) return;
    lastPath = location.pathname; activeMs = 0; lastTick = Date.now(); engaged = false; actions = Object.create(null);
    send('page_view');
  }
  var scheduled = false;
  function schedule() { if (scheduled) return; scheduled = true; setTimeout(function () { scheduled = false; pageView(); }, 0); }
  ['pushState', 'replaceState'].forEach(function (name) {
    var original = history[name];
    history[name] = function () { var result = original.apply(this, arguments); schedule(); return result; };
  });
  window.addEventListener('popstate', schedule);
  window.addEventListener('pageshow', function (e) { if (e.persisted) lastPath = null; schedule(); });
  document.addEventListener('visibilitychange', function () { lastTick = Date.now(); schedule(); });
  window.addEventListener('site-analytics-preference', schedule);
  window.addEventListener('storage', schedule);
  setInterval(function () {
    var now = Date.now(), elapsed = Math.min(1500, Math.max(0, now - lastTick)); lastTick = now;
    if (!lastPath || !allowed() || document.visibilityState !== 'visible' || engaged) return;
    activeMs += elapsed;
    if (activeMs >= 30000) { engaged = true; send('engaged'); }
  }, 1000);
  function track(kind) {
    if (!/^(start|complete|share|contact)$/.test(kind) || !allowed()) return;
    // A conversion indicator counts once per route view. It is not a payment or verified outcome.
    if (actions[kind]) return; actions[kind] = true; send(kind);
  }
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-analytics-event],a[href^="mailto:"]') : null;
    if (target) track(target.getAttribute('data-analytics-event') || 'contact');
  }, true);
  async function recordError(type, filename, line, column) {
    if (!allowed() || errorCount >= 10) return;
    var types = ['Error','TypeError','ReferenceError','RangeError','SyntaxError','URIError','EvalError','UnhandledRejection'];
    if (types.indexOf(type) < 0) type = 'Error';
    var file = 'unknown';
    try { var u = new URL(filename, location.origin); if (u.origin === location.origin) file = u.pathname; } catch (_) {}
    var seed = type + '|' + file + '|' + (Number(line) || 0) + '|' + (Number(column) || 0);
    if (errorSeen[seed]) return; errorSeen[seed] = true; errorCount++;
    var signature = 'unavailable';
    try { signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed)))).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 32); } catch (_) {}
    send('js_error', { errorType: type, signature: signature });
  }
  window.addEventListener('error', function (e) { if (typeof e.message === 'string') void recordError(e.error && e.error.name || 'Error', e.filename, e.lineno, e.colno); });
  window.addEventListener('unhandledrejection', function () { void recordError('UnhandledRejection', '', 0, 0); });
  window.portfolioAnalytics = { version: 2, track: track, optOut: function (value) { disabled = value !== false; if (!disabled) lastPath = null; try { localStorage.setItem('site-analytics:disabled', disabled ? '1' : '0'); if (disabled) localStorage.removeItem(visitorKey); } catch (_) {} window.dispatchEvent(new Event('site-analytics-preference')); } };
  schedule();
}());

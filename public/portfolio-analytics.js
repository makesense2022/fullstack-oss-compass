/* Portfolio Analytics v2. Source of truth: Projects/site-analytics/client.
 * No URL, query, title, form value, error message or stack is transmitted.
 */
(function () {
  'use strict';
  if (window.portfolioAnalytics || (window.top && window.top !== window.self)) return;
  var config = {"endpoint":"https://site-analytics.longlive.workers.dev/v2/collect","businessEndpoint":"https://site-analytics.longlive.workers.dev/v3/collect","healthEndpoint":"https://site-analytics.longlive.workers.dev/health","origins":{"https://qie.netlify.app":"qijian","https://qijian.netlify.app":"qijian","https://dongpo-a-life.netlify.app":"dongpo-a-life","https://art-m.netlify.app":"art-m","https://anibian-edu.netlify.app":"anibian-edu","https://childc-family.netlify.app":"childc-family","https://childc-family.longlive.workers.dev":"childc-family","https://healthspan-guide-cn.netlify.app":"healthspan-guide-cn","https://sea-eater.netlify.app":"sea-eater","https://ai-news-action-center.netlify.app":"ai-news-action-center","https://fluagent.netlify.app":"fluagent","https://fluagent.longlive.workers.dev":"fluagent","https://mindnessai.netlify.app":"mindnessai","https://backrooms-zhangjunnan510.netlify.app":"backrooms-zhangjunnan510","https://outdoo.netlify.app":"outdoor-atlas-pack","https://qijian-outside-atlas.netlify.app":"outdoor-atlas-pack","https://qijian-life-design.netlify.app":"life-design","https://qijian-seen.netlify.app":"seen-person-kit","https://last-classroom-3d.netlify.app":"codex-3d","https://clash-arcade-internal.netlify.app":"games","https://games-ten-ashy.vercel.app":"games","https://stock-app-internal.netlify.app":"stock.html-stock-app","https://qijian-word-quest.netlify.app":"word-quest","https://qijian-tiptap.netlify.app":"tiptap-editor-demo","https://tiptap-editor-ochre.vercel.app":"tiptap-editor-demo","https://hetian-jade-archive.netlify.app":"yu","https://sea-eater-odyssey.netlify.app":"sea-eater-odyssey"},"business":{"events":["project_open","story_start","act_complete","story_complete","game_start","game_end","replay","lesson_start","lesson_complete","review_complete","observe_start","observe_complete","guide_step_complete","scenario_open","action_use","practice_start","practice_complete","compare_start","compare_complete","plan_save","edition_open","source_open","archive_open","exhibit_open","exhibit_complete","artwork_open","artwork_save","chapter_open","chapter_complete","chapter_next","work_open","session_start","session_complete","session_feedback","experiment_start","experiment_complete","worksheet_complete","reflection_complete","material_download","share"],"modes":["default","daily","free","practice","challenge","new","review","first","replay","zh","en"],"outcomes":["completed","failed","abandoned","saved","shared","correct","incorrect","cancelled","opened","downloaded"],"contents":{"qijian":["primary","projects","AI-data","ai-test","AINews","AndroidDemo","art-gallary","art-me","article-growth-kit","backroom","bian","books","child","codex-3d","deep-simplicity-web-kit","earphone","east-cure","explore-city","finding-opp","fluagent","fullstack-oss-compass","games","how-to-do-big-things","info-radar","interview","interview-workbench","learn","life-design","longlive","marketing-os","mcp-doc","mindness","mogen","munger_wisdom","n8n","outdoor_atlas_pack","personal-blog","power","sea-eater","seen-person-kit","sep-watch","site","site-analytics","slate-editor","smart-iframe-viewer","stock.html","sushi","tiptap-editor","trainning","vultr-hy2-warp-ops","whispers-of-the-past","word-quest","xhs-growth-kit","yu","zhihu","fever-miniapp","sea-eater-odyssey"],"games":["primary","lobby","block-blast","2048-clash","sudoku-cash","pool-rush","dice-royal","solitaire-duel","jump-runner","bingo-blitz","21-strike","word-storm"],"word-quest":["primary","daily","cet4","cet6","postgrad","ielts","toefl"],"yu":["primary","color","occurrence","light","guide-step-1","guide-step-2","guide-step-3","guide-step-4","guide-step-5","guide-step-6"],"ai-news-action-center":["primary","archive"],"childc-family":["primary","scenario-list","meltdown","screen-transition","homework-delay","morning-rush","bedtime-resistance","lying","hitting-throwing","sibling-conflict","exam-anxiety","peer-rejection","i-hate-you","parent-yelled","parent-pause","say-it-better","family-meeting","conflict-review"],"outdoor-atlas-pack":["primary","comparison","plan"],"art-m":["primary","gallery","cinema","collection"],"art-gallary":["primary","gallery","exhibition","collection"],"backrooms-zhangjunnan510":["primary","level-0","level-1","level-3"],"sea-eater":["primary","archive","odyssey"],"sea-eater-odyssey":["primary","first","reef","flow","guardian"],"seen-person-kit":["primary","practice"],"life-design":["primary","observe","reframe","compass","possibilities","prototype","experiment","reflection"],"mindnessai":["primary","breathing","ambient","reflection"],"east-cure":["primary","breathing","stretch","sleep"],"fluagent":["primary","records","guidance","export"],"healthspan-guide-cn":["primary","guide","action"],"dongpo-a-life":["primary","chapter","work","life-stage"],"anibian-edu":["primary","challenge","printable"],"mogen-margin-housel-codex-kit-site":["primary","story","model"],"munger-wisdom":["primary","decision","model"],"how-to-do-big-things":["primary","assessment","experiment","project-card"],"site":["primary","lesson","experiment"],"whispers-of-the-past":["primary","journey","letter","saved"],"codex-3d":["primary","sol","astra","comparison"],"tiptap-editor-demo":["primary","editor","export"]}},"release":"dffd990d3f505c91f283c097e0f56e10"};
  var script = document.currentScript;
  var site = script && script.getAttribute('data-site');
  if (!site || config.origins[location.origin] !== site || navigator.webdriver) return;
  var release = config.release || script.getAttribute('data-release') || 'unknown';
  if (!/^([a-f0-9]{7,40}|unknown)$/.test(release)) release = 'unknown';
  var visitorKey = 'site-analytics:visitor:v1', sessionKey = 'portfolio-analytics:session:v2';
  var lastPath = null, activeMs = 0, lastTick = Date.now(), engaged = false, errorCount = 0;
  var errorSeen = Object.create(null), disabled = false, actions = Object.create(null);
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function optedOut() {
    if (disabled || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return true;
    try { return localStorage.getItem('site-analytics:disabled') === '1'; } catch { return false; }
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
    } catch { return 'other'; }
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
    } catch { return null; }
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
    try { var u = new URL(filename, location.origin); if (u.origin === location.origin) file = u.pathname; } catch {}
    var seed = type + '|' + file + '|' + (Number(line) || 0) + '|' + (Number(column) || 0);
    if (errorSeen[seed]) return; errorSeen[seed] = true; errorCount++;
    var signature = 'unavailable';
    try { signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed)))).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 32); } catch {}
    send('js_error', { errorType: type, signature: signature });
  }
  window.addEventListener('error', function (e) { if (typeof e.message === 'string') void recordError(e.error && e.error.name || 'Error', e.filename, e.lineno, e.colno); });
  window.addEventListener('unhandledrejection', function () { void recordError('UnhandledRejection', '', 0, 0); });
  // Business-capable client: basic events keep the deployed v2 protocol.
  // Only public enumerations are queued. A local contract is not proof of rollout.
  var businessQueue = [], businessSeen = Object.create(null), businessState = 'unverified', probeTime = -Infinity;
  var businessCatalog = config.business || {};
  function validBusiness(name, detail) {
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return false;
    if (Object.keys(detail).some(function (k) { return ['contentId','attemptId','mode','outcome'].indexOf(k) < 0; })) return false;
    if (detail.contentId !== undefined && typeof detail.contentId !== 'string') return false;
    if (detail.mode !== undefined && typeof detail.mode !== 'string') return false;
    if (detail.outcome != null && typeof detail.outcome !== 'string') return false;
    if ((businessCatalog.events || []).indexOf(name) < 0) return false;
    var content = detail.contentId || 'primary', contents = (businessCatalog.contents || {})[site] || ['primary'];
    var edition = site === 'ai-news-action-center' && /^edition-\d{4}-\d{2}-\d{2}$/.test(content);
    if (edition) { var date = content.slice(8), parsed = new Date(date + 'T00:00:00Z'); edition = Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date; }
    if (contents.indexOf(content) < 0 && !edition) return false;
    if (detail.attemptId !== undefined && (typeof detail.attemptId !== 'string' || !uuid.test(detail.attemptId))) return false;
    if ((businessCatalog.modes || []).indexOf(detail.mode || 'default') < 0) return false;
    if (detail.outcome != null && (businessCatalog.outcomes || []).indexOf(detail.outcome) < 0) return false;
    if (name === 'game_end' && ['completed','failed','abandoned','cancelled'].indexOf(detail.outcome) < 0) return false;
    return true;
  }
  function flushBusiness() {
    if (!allowed()) { businessQueue = []; return; }
    if (businessState !== 'ready' || document.visibilityState !== 'visible') return;
    var pending = businessQueue; businessQueue = [];
    pending.forEach(function (entry) {
      if (Date.now() - entry.queuedAt > 30000) return;
      var body = { eventId: entry.id, visitorId: storedId(localStorage, visitorKey, 90 * 86400000, false), sessionId: storedId(sessionStorage, sessionKey, 30 * 60 * 1000, true), attemptId: entry.attempt, name: entry.name, contentId: entry.detail.contentId || 'primary', mode: entry.detail.mode || 'default', outcome: entry.detail.outcome || null, channel: entryChannel, release: release };
      var serialized = JSON.stringify(body);
      function transmit() { return fetch(config.businessEndpoint, { method: 'POST', body: serialized, credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }); }
      Promise.resolve().then(transmit).then(function (r) { if (r.status >= 500 && !optedOut()) return transmit(); }).catch(function () {});
    });
  }
  function probeBusiness() {
    if (!config.healthEndpoint || !config.businessEndpoint || !allowed() || businessState === 'checking') return;
    if (businessState !== 'ready' && Date.now() - probeTime < 30000) return;
    probeTime = Date.now(); businessState = 'checking';
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    if (controller) setTimeout(function () { controller.abort(); }, 8000);
    Promise.resolve().then(function () { return fetch(config.healthEndpoint, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller ? controller.signal : undefined }); }).then(function (r) {
      if (!r.ok) throw new Error('health unavailable'); return r.json();
    }).then(function (data) {
      businessState = data.collectorVersion >= 3 && data.business && data.business.enabled === true ? 'ready' : 'pending';
      if (businessState === 'ready') flushBusiness(); else businessQueue = [];
    }).catch(function () { businessState = 'unverified'; });
  }
  function action(name, detail) {
    detail = detail || {};
    if (!allowed() || document.visibilityState !== 'visible' || !validBusiness(name, detail)) return false;
    var key = [location.pathname,name,detail.contentId || 'primary',detail.mode || 'default',detail.attemptId || 'page'].join('|');
    if (businessSeen[key] || businessQueue.length >= 40) return false;
    businessSeen[key] = true;
    businessQueue.push({ id: crypto.randomUUID(), attempt: detail.attemptId || crypto.randomUUID(), name: name, detail: Object.assign({}, detail), queuedAt: Date.now() });
    if (businessState === 'ready') flushBusiness(); else probeBusiness();
    // Accepted locally is not a delivery acknowledgment or a real-world result.
    return true;
  }
  document.addEventListener('portfolio-analytics:action', function (event) { var d = event.detail || {}; action(d.name, d.context); });
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-analytics-action]') : null;
    if (target) action(target.getAttribute('data-analytics-action'), { contentId: target.getAttribute('data-analytics-content') || 'primary', mode: target.getAttribute('data-analytics-mode') || 'default', outcome: target.getAttribute('data-analytics-outcome') || null });
  }, true);
  document.addEventListener('visibilitychange', flushBusiness);
  window.portfolioAnalytics = { version: 3, track: track, action: action, get businessStatus() { return businessState; }, optOut: function (value) { disabled = value !== false; if (disabled) businessQueue = []; if (!disabled) lastPath = null; try { localStorage.setItem('site-analytics:disabled', disabled ? '1' : '0'); if (disabled) localStorage.removeItem(visitorKey); } catch {} window.dispatchEvent(new Event('site-analytics-preference')); } };
  var earlyActions = window.__portfolioActions || []; window.__portfolioActions = [];
  earlyActions.slice(0, 40).forEach(function (entry) { action(entry.name, entry.context); });
  schedule();
}());

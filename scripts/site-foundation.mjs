import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Self-contained: copied into each application so independent checkouts can build.
export function loadEnvironment(root, input = process.env, mode = 'production') {
  const env = {};
  const files = mode === 'local' ? ['.env', '.env.local'] : ['.env', '.env.local', '.env.production', '.env.production.local'];
  for (const name of files) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      let value = match[2].trim();
      if (/^["']/.test(value)) value = value.slice(1, value.lastIndexOf(value[0]));
      else value = value.replace(/\s+#.*$/, '').trim();
      env[match[1]] = value;
    }
  }
  return { ...env, ...input };
}
export function httpsOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || /localhost|127\.0\.0\.1|example\.(com|org)|\.invalid$|\.test$/.test(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}
export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const safeJson = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
export function textContent(value) {
  return String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, v => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' })[v]).replace(/\s+/g, ' ').trim();
}
function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  return result;
}
export function getMeta(html, key) {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) { const attr = attributes(tag[0]); if (attr.name === key || attr.property === key) return textContent(attr.content || ''); }
  return '';
}
function setMeta(head, kind, key, value) {
  const pattern = /<meta\b[^>]*>/gi;
  head = head.replace(pattern, tag => attributes(tag)[kind] === key ? '' : tag);
  return value ? head + `\n<meta ${kind}="${key}" content="${escapeHtml(value)}"/>` : head;
}
export function publicPath(route, config) {
  return !route.split('/').some(segment => (config.excludedPathSegments || []).includes(segment.toLowerCase())) && !/\/(?:404|_not-found|_global-error|_error|test|fixtures|review|preview|demos)(?:\/|$)/.test(route);
}
export function routePatterns(config) {
  return [...new Set((config.routes || [{ path: '/' }]).filter(route => publicPath(route.path, config)).map(route => {
    const parts = route.path.split('/').filter(Boolean).map(part => part.startsWith('[') ? '[a-zA-Z0-9_-]{1,100}' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return '^/' + parts.join('/') + (parts.length ? '/?$' : '$');
  }))];
}
export function resolveConfig(config, env, modeOverride) {
  const siteUrl = httpsOrigin(env.SITE_URL || env.NEXT_PUBLIC_SITE_URL || env.VITE_SITE_URL || env.PUBLIC_SITE_URL) || httpsOrigin(config.siteUrl);
  const key = env.POSTHOG_KEY || env.NEXT_PUBLIC_POSTHOG_KEY || env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || env.VITE_POSTHOG_KEY || env.PUBLIC_POSTHOG_KEY || '';
  const posthogKey = /^phc_[a-zA-Z0-9_-]+$/.test(key) ? key : '';
  const posthogHost = httpsOrigin(env.POSTHOG_HOST || env.NEXT_PUBLIC_POSTHOG_HOST || env.VITE_POSTHOG_HOST || env.PUBLIC_POSTHOG_HOST);
  const mode = modeOverride || env.POSTHOG_MODE || env.NEXT_PUBLIC_POSTHOG_MODE || env.VITE_POSTHOG_MODE || env.PUBLIC_POSTHOG_MODE || 'production';
  if (!['production', 'local', 'off'].includes(mode)) throw new Error('POSTHOG_MODE must be production, local, or off');
  return { ...config, siteUrl, posthogKey, posthogHost, mode, enabled: Boolean(posthogKey && posthogHost && config.analyticsEnabled !== false), productionOrigins: siteUrl ? [siteUrl] : [], publicRoutePatterns: routePatterns(config), googleVerification: env.GOOGLE_SITE_VERIFICATION || env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || env.VITE_GOOGLE_SITE_VERIFICATION || env.PUBLIC_GOOGLE_SITE_VERIFICATION || '', testRunId: mode === 'local' ? env.NEXT_PUBLIC_POSTHOG_TEST_RUN || 'manual-local' : undefined };
}
export function enrichHtml(html, route, config) {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!match) return html;
  let head = match[1];
  const oldTitle = textContent(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const h1 = textContent(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const title = route !== '/' && h1 && [config.siteName, config.defaultTitle].includes(oldTitle)
    ? `${h1} | ${config.siteName}` : oldTitle || (h1 ? `${h1} | ${config.siteName}` : config.siteName);
  const description = getMeta(head, 'description') || config.description;
  head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '') + `\n<title>${escapeHtml(title)}</title>`;
  head = setMeta(head, 'name', 'description', description);
  const oldRobots = getMeta(head, 'robots');
  const indexable = config.indexing === 'public' && Boolean(config.siteUrl) && publicPath(route, config) && !/noindex/i.test(oldRobots);
  if (!indexable) head = setMeta(head, 'name', 'robots', 'noindex, follow');
  // Source canonicals are replaced with the confirmed origin and this actual output path.
  head = head.replace(/<link\b[^>]*>/gi, tag => attributes(tag).rel === 'canonical' ? '' : tag);
  const canonical = config.siteUrl ? config.siteUrl + route : null;
  if (canonical && publicPath(route, config)) head += `\n<link rel="canonical" href="${escapeHtml(canonical)}"/>`;
  for (const [key, value] of Object.entries({ 'og:title': title, 'og:description': description, 'og:type': getMeta(head, 'og:type') || 'website', 'og:site_name': config.siteName, 'og:url': canonical })) head = setMeta(head, 'property', key, value);
  const oldImage = getMeta(head, 'og:image');
  let image = oldImage;
  if (!image && config.siteUrl) image = config.siteUrl + (config.defaultOgImage || '/site-og.webp');
  if (image) {
    try { const url = new URL(image, config.siteUrl || 'https://unconfigured.invalid'); if (config.siteUrl && /localhost|127\.0\.0\.1|unconfigured\.invalid/.test(url.hostname)) image = config.siteUrl + url.pathname; else image = url.href; } catch { image = ''; }
  }
  if (image && !image.includes('unconfigured.invalid')) head = setMeta(head, 'property', 'og:image', image);
  for (const [key, value] of Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description, 'twitter:image': image || null })) head = setMeta(head, 'name', key, value);
  if (config.googleVerification) head = setMeta(head, 'name', 'google-site-verification', config.googleVerification);
  if (canonical && publicPath(route, config)) {
    const type = route === '/' ? 'WebSite' : 'WebPage';
    if (!new RegExp('"@type"\\s*:\\s*"' + type + '"').test(html)) head += `\n<script type="application/ld+json" data-site-foundation="schema">${safeJson({ '@context': 'https://schema.org', '@type': type, name: title, description, url: canonical, inLanguage: html.match(/<html\b[^>]*lang=["']([^"']+)/i)?.[1] || 'zh-CN' })}</script>`;
  }
  html = html.replace(match[0], match[0].replace(match[1], head));
  if (!html.includes('src="/site-foundation-config.js"')) html = html.replace(/<\/body>/i, '\n<script defer src="/site-foundation-config.js"></script>\n<script defer src="/site-foundation.js"></script>\n</body>');
  return html;
}
function walk(directory, suffix) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['_next', 'assets', 'vendor', 'node_modules'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file, suffix) : entry.name.endsWith(suffix) ? [file] : [];
  });
}
export function outputRoute(file, directory) {
  let route = '/' + path.relative(directory, file).replaceAll(path.sep, '/');
  if (route.endsWith('/index.html')) route = route.slice(0, -10);
  else if (route.endsWith('.html') && !['/project.html', '/creator.html', '/portfolio-privacy.html', '/404.html'].includes(route)) route = route.slice(0, -5);
  return route || '/';
}
export function sitemapXml(pages, config) {
  const urls = [...new Set(pages.filter(page => page.indexable && publicPath(page.path, config)).map(page => config.siteUrl + page.path))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `<url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
export function mergeSitemap(existing, pages, config) {
  if (!existing || !existing.includes('<urlset')) return sitemapXml(pages, config);
  const targets = new Set(pages.filter(page => page.indexable && publicPath(page.path, config)).map(page => config.siteUrl + page.path));
  const retained = [];
  for (const match of existing.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/g)) {
    const loc = match[0].match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    if (!loc) continue;
    try {
      const url = new URL(loc.replaceAll('&amp;', '&'));
      const canonical = config.siteUrl + url.pathname;
      if (!targets.has(canonical) || url.search || url.hash) continue;
      targets.delete(canonical);
      // Preserve valid native lastmod, alternate-language and image/video metadata.
      retained.push(match[0].replaceAll(url.origin, config.siteUrl));
    } catch { /* Invalid URLs are not published. */ }
  }
  retained.push(...[...targets].map(url => `<url><loc>${escapeHtml(url)}</loc></url>`));
  const open = existing.match(/<urlset\b[^>]*>/)?.[0] || '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  return `<?xml version="1.0" encoding="UTF-8"?>\n${open}\n${retained.join('\n')}\n</urlset>\n`;
}
export function robotsText(config) {
  if (!config.siteUrl || config.indexing !== 'public') return 'User-agent: *\nDisallow: /\n';
  const blocks = (config.excludedPathSegments || []).map(segment => `Disallow: /${segment}/`).join('\n');
  return `User-agent: *\nAllow: /\n${blocks}\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`;
}
function nativeAsset(root, name) {
  return ['app', 'src/app'].some(dir => existsSync(path.join(root, dir, name + '.ts')) || existsSync(path.join(root, dir, name === 'robots' ? 'robots.txt' : 'sitemap.xml')));
}
function write(root, relative, value) { const file = path.join(root, relative); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, value); }
function writeDiscovery(root, relative, value) {
  const file = path.join(root, relative), marker = '<!-- generated: website-foundation -->';
  if (existsSync(file) && !readFileSync(file, 'utf8').includes(marker)) return;
  write(root, relative, value + '\n\n' + marker + '\n');
}
function publicFiles(root, config, pages, destination, complete = false) {
  const prefix = destination ? destination + '/' : 'public/';
  if (complete || !nativeAsset(root, 'robots')) write(root, prefix + 'robots.txt', robotsText(config));
  if (config.siteUrl && (complete || !nativeAsset(root, 'sitemap'))) {
    const file = path.join(root, prefix + 'sitemap.xml');
    write(root, prefix + 'sitemap.xml', complete ? mergeSitemap(existsSync(file) ? readFileSync(file, 'utf8') : '', pages, config) : sitemapXml(pages, config));
  }
  // Only summaries of actual public HTML. Private notes and unapproved content are excluded.
  if (config.indexing !== 'public') return;
  const items = pages.filter(page => page.publishable !== false && publicPath(page.path, config));
  const origin = config.siteUrl || '';
  const links = items.map(page => `- [${page.title}](${origin}${page.path}): ${page.description}`);
  const discovery = `# ${config.siteName}\n\n> ${config.description}\n\n## Public pages\n\n${links.join('\n')}\n\n## Reading and sources\n\nThese entries describe the same public content as the website. Source links and editorial caveats on the pages remain authoritative.\n`;
  const nativeLlms = ['app', 'src/app'].some(dir => existsSync(path.join(root, dir, 'llms.txt/route.ts')));
  if (complete || !nativeLlms) writeDiscovery(root, prefix + 'llms.txt', discovery);
  writeDiscovery(root, prefix + 'llms-full.txt', `# ${config.siteName}\n\n${items.map(page => `## ${page.title}\n\nURL: ${origin}${page.path}\n\n${page.description}\n\n${page.excerpt || ''}`).join('\n\n')}`);
  write(root, prefix + 'site-content-index.json', JSON.stringify({ siteName: config.siteName, siteUrl: config.siteUrl, pages: items.map(({ path: route, title, description }) => ({ path: route, title, description })) }, null, 2) + '\n');
}
export function prepare(root, inputEnv = process.env, modeOverride) {
  const source = JSON.parse(readFileSync(path.join(root, 'site.foundation.json'), 'utf8'));
  const config = resolveConfig(source, loadEnvironment(root, inputEnv, modeOverride), modeOverride);
  write(root, 'public/site-foundation-config.js', 'window.__SITE_FOUNDATION_CONFIG__ = ' + safeJson(config) + ';\n');
  const pages = source.routes.filter(route => !route.path.includes('[')).map(route => ({ path: route.path === '/' ? '/' : route.path + (source.trailingSlash ? '/' : ''), title: source.siteName, description: source.description, indexable: source.indexing === 'public' && Boolean(config.siteUrl) }));
  publicFiles(root, config, pages);
  return config;
}
export function finalize(root, config) {
  const reports = [];
  const outputDirs = (config.buildOutputs || []).filter(directory => existsSync(path.join(root, directory)) && walk(path.join(root, directory), '.html').length);
  for (const directory of outputDirs) {
    const destination = path.join(root, directory), pages = [];
    for (const file of walk(destination, '.html')) {
      if ((config.excludedOutputFiles || []).includes(path.relative(destination, file).replaceAll(path.sep, '/'))) continue;
      const route = outputRoute(file, destination);
      const original = readFileSync(file, 'utf8');
      const html = enrichHtml(original, route, config);
      if (html !== original) writeFileSync(file, html);
      const excerpt = textContent(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || '').slice(0, 3000);
      pages.push({ path: route, title: textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || config.siteName), description: getMeta(html, 'description'), indexable: publicPath(route, config) && !/noindex/.test(getMeta(html, 'robots')) && config.indexing === 'public' && Boolean(config.siteUrl), publishable: publicPath(route, config) && config.indexing === 'public', excerpt });
    }
    config.publicRoutePatterns = [...new Set([...config.publicRoutePatterns, ...pages.filter(page => publicPath(page.path, config)).map(page => '^' + page.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')])];
    config.pageTitles = Object.fromEntries(pages.filter(page => publicPath(page.path, config)).flatMap(page => [[page.path, page.title], [page.path.replace(/\/$/, '') || '/', page.title]]));
    write(root, 'public/site-foundation-config.js', 'window.__SITE_FOUNDATION_CONFIG__ = ' + safeJson(config) + ';\n');
    for (const file of ['site-foundation-config.js', 'site-foundation.js', 'site-og.webp', 'vendor/posthog-1.435.9.js', 'vendor/posthog-LICENSE.txt']) {
      const from = path.join(root, 'public', file), to = path.join(destination, file);
      if (existsSync(from) && path.resolve(from) !== path.resolve(to)) { mkdirSync(path.dirname(to), { recursive: true }); copyFileSync(from, to); }
    }
    publicFiles(root, config, pages, directory, true);
    publicFiles(root, config, pages);
    reports.push({ directory, htmlPages: pages.length, indexedPages: pages.filter(page => page.indexable).length, emptyHtmlPages: pages.filter(page => !page.excerpt).map(page => page.path), verifiedDomain: Boolean(config.siteUrl) });
  }
  // SSR builds have no export directory. Use prerendered HTML and actual route manifests.
  if (!outputDirs.length && existsSync(path.join(root, '.next/server/app'))) {
    const directory = path.join(root, '.next/server/app'), pages = [];
    for (const file of walk(directory, '.html')) {
      const route = outputRoute(file, directory);
      const html = readFileSync(file, 'utf8');
      if (!publicPath(route, config) || /noindex/.test(getMeta(html, 'robots'))) continue;
      pages.push({ path: route, title: textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || config.siteName), description: getMeta(html, 'description') || config.description, indexable: config.indexing === 'public' && Boolean(config.siteUrl), excerpt: textContent(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '').slice(0, 3000) });
    }
    publicFiles(root, config, pages);
    reports.push({ directory: '.next/server/app', htmlPages: pages.length, indexedPages: pages.filter(page => page.indexable).length, verifiedDomain: Boolean(config.siteUrl), mode: 'SSR; root metadata and page metadata own head output' });
    config.pageTitles = Object.fromEntries(pages.map(page => [page.path, page.title]));
    write(root, 'public/site-foundation-config.js', 'window.__SITE_FOUNDATION_CONFIG__ = ' + safeJson(config) + ';\n');
  }
  const report = { siteId: config.siteId, siteUrl: config.siteUrl, posthogConfigured: Boolean(config.posthogKey && config.posthogHost), productionEnabled: config.mode === 'production' && Boolean(config.siteUrl && config.posthogKey && config.posthogHost), indexing: config.indexing, outputs: reports, deploymentPerformed: false };
  write(root, 'docs/foundation-validation.json', JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const mode = process.argv.find(arg => arg.startsWith('--mode='))?.slice(7);
  const config = prepare(root, process.env, mode);
  if (process.argv.includes('--finalize')) console.log(JSON.stringify(finalize(root, config)));
  else console.log(JSON.stringify({ siteId: config.siteId, domainConfigured: Boolean(config.siteUrl), posthogConfigured: Boolean(config.posthogKey && config.posthogHost), mode: config.mode, deploymentPerformed: false }));
}

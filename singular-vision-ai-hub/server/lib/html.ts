import { CATEGORY_LABELS } from '../config/sources';
import type { CategoryId, Digest } from '../types';

/**
 * Renders a digest as a self-contained HTML page — no JavaScript, no external
 * requests, no build step. This is what gets published to GitHub Pages so the
 * digest is readable by clicking a link rather than running a server.
 */

/**
 * Feed content is untrusted: titles and summaries come from third-party RSS.
 * Everything interpolated below goes through here.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only http(s) links are emitted, so a crafted feed cannot inject javascript:. */
function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '#';
    return escapeHtml(parsed.toString());
  } catch {
    return '#';
  }
}

const CATEGORY_COLORS: Record<CategoryId, string> = {
  tools: '#38bdf8',
  automation: '#a78bfa',
  marketing: '#34d399',
  pricing: '#fbbf24',
  rules: '#fb7185',
  strategy: '#94a3b8',
};

const STYLES = `
*,*::before,*::after{box-sizing:border-box}
:root{
  --bg:#12161f; --card:#1b2130; --line:#2a3244; --text:#e8e6e1;
  --muted:#9aa3b5; --dim:#6b7488; --accent:#d97757; --inset:#0e121a;
  color-scheme:dark;
}
@media (prefers-color-scheme:light){
  :root{
    --bg:#f7f5f0; --card:#ffffff; --line:#e2ddd3; --text:#1e232e;
    --muted:#5c6474; --dim:#8b93a3; --accent:#c2603f; --inset:#faf8f4;
    color-scheme:light;
  }
}
body{
  margin:0; background:var(--bg); color:var(--text);
  font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);background:var(--bg);padding:28px 0 22px}
h1{margin:0;font-size:23px;letter-spacing:-.01em;display:flex;align-items:center;gap:10px}
h1 .mark{color:var(--accent)}
.tag{margin:6px 0 0;color:var(--muted);font-size:14px}
.nav{margin-top:18px;display:flex;gap:14px;flex-wrap:wrap;font-size:14px}
.nav a{color:var(--muted);text-decoration:none}
.nav a:hover{color:var(--accent)}
.nav a[aria-current]{color:var(--text);font-weight:600}
main{padding:26px 0 60px}
.lede{font-size:17px;line-height:1.55;margin:0 0 26px}
.card{
  border:1px solid var(--line);background:var(--card);
  border-radius:12px;padding:20px;margin-bottom:16px;
}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;margin-bottom:10px}
.pill{
  border-radius:999px;padding:3px 10px;font-weight:600;
  border:1px solid currentColor;
}
.src{color:var(--muted)}
.score{margin-left:auto;color:var(--dim);font-variant-numeric:tabular-nums;font-size:12px}
h2{margin:0 0 8px;font-size:18.5px;line-height:1.35}
h2 a{color:var(--text);text-decoration:none}
h2 a:hover{color:var(--accent)}
.sum{margin:0 0 14px;color:var(--muted);font-size:14.5px}
.why{
  border-left:3px solid var(--accent);background:var(--inset);
  border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px;
}
.why b{
  display:block;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;
  color:var(--accent);margin-bottom:5px;
}
.why p{margin:0;font-size:14.5px}
ul.acts{margin:0 0 14px;padding-left:18px}
ul.acts li{margin-bottom:5px;font-size:14.5px}
ul.acts li::marker{color:var(--accent)}
.read{color:var(--accent);font-weight:600;text-decoration:none;font-size:14.5px}
.read:hover{text-decoration:underline}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.tags span{
  background:rgba(128,138,160,.14);color:var(--dim);
  border-radius:5px;padding:2px 7px;font-size:11.5px;
}
.empty{
  border:1px dashed var(--line);border-radius:12px;
  padding:48px 24px;text-align:center;color:var(--muted);
}
.archive{list-style:none;margin:0;padding:0}
.archive li{margin-bottom:8px}
.archive a{
  display:block;border:1px solid var(--line);background:var(--card);
  border-radius:9px;padding:14px 16px;color:var(--text);text-decoration:none;
}
.archive a:hover{border-color:var(--accent)}
.archive .n{color:var(--dim);font-size:13px}
footer{
  border-top:1px solid var(--line);margin-top:34px;padding-top:18px;
  color:var(--dim);font-size:12.5px;
}
footer p{margin:0 0 4px}
footer a{color:var(--dim)}
@media (max-width:520px){ .wrap{padding:0 15px} h1{font-size:20px} }
`;

function shell(title: string, body: string, description: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%E2%97%8E</text></svg>">
<style>${STYLES}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function header(current: 'today' | 'archive', prefix: string): string {
  return `<header><div class="wrap">
<h1><span class="mark" aria-hidden="true">&#9678;</span> Singular Vision AI Hub</h1>
<p class="tag">Today&rsquo;s AI news, filtered for what changes your week.</p>
<nav class="nav">
<a href="${prefix}index.html"${current === 'today' ? ' aria-current="page"' : ''}>Today</a>
<a href="${prefix}archive.html"${current === 'archive' ? ' aria-current="page"' : ''}>Past days</a>
</nav>
</div></header>`;
}

function card(item: Digest['items'][number]): string {
  const color = CATEGORY_COLORS[item.category] ?? '#94a3b8';
  const label = CATEGORY_LABELS[item.category] ?? item.category;
  const when = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '';

  const actions = item.actions
    .map((action) => `<li>${escapeHtml(action)}</li>`)
    .join('');

  const tags = item.tags
    .slice(0, 5)
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join('');

  return `<article class="card">
<div class="meta">
<span class="pill" style="color:${color}">${escapeHtml(label)}</span>
<span class="src">${escapeHtml(item.sourceName)}${when ? ` &middot; ${escapeHtml(when)}` : ''}</span>
<span class="score" title="How relevant this is to a small business, out of 100">${item.score}</span>
</div>
<h2><a href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h2>
<p class="sum">${escapeHtml(item.summary)}</p>
<div class="why"><b>Why it matters for you</b><p>${escapeHtml(item.whyItMatters)}</p></div>
${actions ? `<ul class="acts">${actions}</ul>` : ''}
<a class="read" href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">Read it &rarr;</a>
${tags ? `<div class="tags">${tags}</div>` : ''}
</article>`;
}

export function renderDigestPage(
  digest: Digest,
  options: { isIndex: boolean } = { isIndex: true },
): string {
  const prefix = options.isIndex ? '' : '../';
  const pretty = new Date(`${digest.date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const body = digest.items.length
    ? digest.items.map(card).join('\n')
    : `<div class="empty"><p>Nothing cleared the relevance bar today.</p>
<p>That is a real result, not a glitch &mdash; some days the AI news genuinely does not affect a small business.</p></div>`;

  const failed = digest.sources.filter((source) => !source.ok);

  const main = `${header(options.isIndex ? 'today' : 'archive', prefix)}
<main><div class="wrap">
<h2 style="font-size:14px;color:var(--dim);font-weight:600;margin:0 0 14px;letter-spacing:.03em">${escapeHtml(pretty)}</h2>
<p class="lede">${escapeHtml(digest.headline)}</p>
${body}
<footer>
<p>Scanned ${digest.stats.fetched} stories from ${digest.sources.length} sources &middot; kept ${digest.stats.published}.</p>
<p>Built ${escapeHtml(new Date(digest.generatedAt).toUTCString())}${digest.stats.enriched ? ' &middot; notes written by Claude' : ''}.</p>
${failed.length ? `<p>Unavailable this run: ${escapeHtml(failed.map((s) => s.sourceName).join(', '))}.</p>` : ''}
<p><a href="https://github.com/virgelderek-dot/QuietMind/tree/main/singular-vision-ai-hub">Source and scoring rules</a></p>
</footer>
</div></main>`;

  return shell(
    `Singular Vision AI Hub — ${digest.date}`,
    main,
    digest.headline,
  );
}

export function renderArchivePage(
  entries: { date: string; count: number }[],
): string {
  const list = entries.length
    ? `<ul class="archive">${entries
        .map(
          (entry) =>
            `<li><a href="d/${escapeHtml(entry.date)}.html">${escapeHtml(entry.date)} <span class="n">&middot; ${entry.count} ${entry.count === 1 ? 'story' : 'stories'}</span></a></li>`,
        )
        .join('')}</ul>`
    : `<div class="empty">No past digests yet &mdash; they build up one per day.</div>`;

  const main = `${header('archive', '')}
<main><div class="wrap">
<p class="lede">Every digest published so far, newest first.</p>
${list}
</div></main>`;

  return shell(
    'Singular Vision AI Hub — Past days',
    main,
    'Archive of past daily AI digests for solopreneurs and small business owners.',
  );
}

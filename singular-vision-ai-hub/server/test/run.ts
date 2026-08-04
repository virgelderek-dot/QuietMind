import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SOURCES } from '../config/sources';
import { buildDigest, dedupe, localDateString } from '../lib/digest';
import { parseFeed } from '../lib/feeds';
import {
  renderArchivePage,
  renderDigestPage,
  renderSavedPage,
} from '../lib/html';
import { assess, freshnessPoints, isAiTopic } from '../lib/relevance';
import { renderMarkdown } from '../lib/render';
import type { FeedSource, RawItem } from '../types';

/**
 * Offline test suite. Feeds are read from fixtures, never over the network,
 * so this runs in CI and in restricted sandboxes.
 */

const FIXTURES = path.join(process.cwd(), 'fixtures');
const NOW = new Date('2026-07-29T12:00:00Z');

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    })
    .catch((error: unknown) => {
      failures.push(name);
      console.log(`FAIL  ${name}`);
      console.log(`      ${error instanceof Error ? error.message : error}`);
    });
}

const rssSource: FeedSource = {
  id: 'fixture-rss',
  name: 'Fixture RSS',
  url: 'fixture://rss',
  angle: 'test',
  weight: 1,
};

const atomSource: FeedSource = {
  id: 'fixture-atom',
  name: 'Fixture Atom',
  url: 'fixture://atom',
  angle: 'test',
  weight: 1,
};

const rssXml = readFileSync(path.join(FIXTURES, 'sample-rss.xml'), 'utf8');
const atomXml = readFileSync(path.join(FIXTURES, 'sample-atom.xml'), 'utf8');

async function main() {
  console.log('\nSingular Vision AI Hub — offline suite\n');

  // ---- parsing -----------------------------------------------------------

  await test('parses RSS 2.0 items', () => {
    const items = parseFeed(rssXml, rssSource);
    assert.equal(items.length, 6);
    assert.equal(
      items[0]!.title,
      'Zapier launches a free AI tier that automates invoicing for small businesses',
    );
    assert.equal(items[0]!.publishedAt, '2026-07-29T09:00:00.000Z');
  });

  await test('strips HTML and decodes entities from descriptions', () => {
    const items = parseFeed(rssXml, rssSource);
    const description = items[0]!.description;
    assert.ok(!description.includes('<'), 'markup should be gone');
    assert.ok(description.includes('freelancers'));
  });

  await test('parses Atom entries and reads href from link attributes', () => {
    const items = parseFeed(atomXml, atomSource);
    assert.equal(items.length, 3);
    assert.equal(items[0]!.link, 'https://vendor.example.com/price-cut');
    assert.equal(items[0]!.publishedAt, '2026-07-29T10:00:00.000Z');
  });

  await test('tolerates malformed feeds without throwing', () => {
    assert.doesNotThrow(() => parseFeed('<rss><channel>', rssSource));
    assert.deepEqual(parseFeed('not xml at all', rssSource), []);
  });

  // ---- relevance ---------------------------------------------------------

  const item = (title: string, description = ''): RawItem => ({
    title,
    description,
    link: `https://example.com/${encodeURIComponent(title.slice(0, 20))}`,
    publishedAt: NOW.toISOString(),
    sourceId: 'fixture-rss',
    sourceName: 'Fixture RSS',
  });

  await test('ranks a small-business tool above a funding round', () => {
    const useful = assess(
      item(
        'New no-code tool automates invoicing for small businesses',
        'Free tier available for freelancers.',
      ),
      1,
      NOW,
    );
    const noise = assess(
      item(
        'Nebula AI raises $400M Series C at a $6B valuation',
        'The funding round will pay for GPU clusters and datacenters.',
      ),
      1,
      NOW,
    );

    assert.ok(
      useful.score > noise.score + 30,
      `expected a wide gap, got ${useful.score} vs ${noise.score}`,
    );
    assert.equal(noise.score, 0, 'pure funding news should score zero');
  });

  await test('penalises research and benchmark stories', () => {
    const result = assess(
      item(
        'Researchers propose a new benchmark for long-context evals',
        'The arxiv paper claims SOTA results on a new leaderboard.',
      ),
      1,
      NOW,
    );
    assert.ok(result.score < 22, `expected below threshold, got ${result.score}`);
  });

  await test('assigns categories from the dominant signal', () => {
    assert.equal(
      assess(item('Google cuts Gemini API prices and raises the free tier'), 1, NOW)
        .category,
      'pricing',
    );
    assert.equal(
      assess(item('EU AI Act disclosure rules take effect', 'New compliance obligations and copyright guidance.'), 1, NOW)
        .category,
      'rules',
    );
    assert.equal(
      assess(item('How to use AI for SEO and content marketing'), 1, NOW).category,
      'marketing',
    );
    assert.equal(
      assess(item('Zapier workflow automates your customer support inbox'), 1, NOW)
        .category,
      'automation',
    );
  });

  await test('weighs the title more heavily than the body', () => {
    const inTitle = assess(item('A free tier for small businesses', 'Generic body.'), 1, NOW);
    const inBody = assess(item('Generic headline', 'A free tier for small businesses.'), 1, NOW);
    assert.ok(
      inTitle.score > inBody.score,
      `title ${inTitle.score} should beat body ${inBody.score}`,
    );
  });

  await test('freshness decays with age', () => {
    const now = freshnessPoints(NOW.toISOString(), NOW);
    const day = freshnessPoints(new Date(NOW.getTime() - 24 * 3_600_000).toISOString(), NOW);
    const week = freshnessPoints(new Date(NOW.getTime() - 168 * 3_600_000).toISOString(), NOW);
    assert.ok(now > day && day > week, 'points must decrease with age');
    assert.ok(week < 1, 'a week-old story should contribute almost nothing');
  });

  await test('applies source weight', () => {
    const headline = 'New no-code tool automates invoicing for small businesses';
    const light = assess(item(headline), 0.8, NOW).score;
    const heavy = assess(item(headline), 1.2, NOW).score;
    assert.ok(heavy > light, `${heavy} should exceed ${light}`);
  });

  await test('keeps discriminating at the top instead of saturating at 100', () => {
    // A linear scale pegged every strong story at 100 and made the ordering
    // among the day's best items arbitrary. Stacking more signals must keep
    // raising the score without ever reaching the ceiling.
    const good = assess(
      item('New tool automates invoicing for small businesses', 'Free tier available.'),
      1,
      NOW,
    );
    const better = assess(
      item(
        'New no-code tool automates invoicing and scheduling for small businesses',
        'Free tier for freelancers and solopreneurs, with open source templates and a Zapier integration.',
      ),
      1,
      NOW,
    );

    assert.ok(better.score > good.score, `${better.score} should exceed ${good.score}`);
    assert.ok(better.score < 100, 'the scale must never peg at 100');
  });

  await test('clamps scores into 0-100', () => {
    const extreme = assess(
      item(
        'Free no-code automation for solopreneurs, freelancers and small businesses',
        'How to automate invoicing, scheduling, customer support, SEO, email marketing and bookkeeping with open source templates on a free tier.',
      ),
      1.2,
      NOW,
    );
    assert.ok(extreme.score <= 100 && extreme.score >= 0);
  });

  // ---- topicality gate ---------------------------------------------------
  //
  // Headlines below are taken verbatim from the first live run, which filled
  // the digest with genuinely useful but entirely non-AI small-business
  // writing because relevance was scored without checking topicality.

  await test('recognises AI stories across the vocabulary', () => {
    for (const headline of [
      'OpenAI Cuts Model Prices Amid Enterprises’ Concerns About AI Spend',
      'LinkedIn adds a button to report AI-generated ‘slop’',
      'Oracle Brings Google Gemini Models to Enterprise Customers',
      'A new chatbot handles your customer support inbox',
      'Anthropic ships a smaller Claude for cheap batch work',
      'Text-to-video generation lands in the editor',
    ]) {
      assert.ok(isAiTopic(headline, ''), `should be AI: ${headline}`);
    }
  });

  await test('rejects small-business writing with no AI in it', () => {
    for (const headline of [
      'US-Canada Energy Trade Dips 11% Amid Lower Oil Prices and Tariffs',
      'What Is Simple Bookkeeping and How Can It Benefit You?',
      '7 Tips to Help You Prioritize Your Time and Tasks Effectively',
      'Understanding Company Structure in Business: A Step-by-Step Guide',
      'Gas Prices Hold Steady at $4.09 as Crude Oil Costs Remain High',
      'Start Selling Crafts Online: A Step-by-Step Guide',
    ]) {
      assert.ok(!isAiTopic(headline, ''), `should not be AI: ${headline}`);
    }
  });

  await test('reads AI topicality from the body when the headline hides it', () => {
    assert.ok(
      isAiTopic(
        'Leveraging Ecommerce Data for Better Sales Strategies',
        'How machine learning models can forecast inventory for a small shop.',
      ),
    );
  });

  await test('does not treat commodity price reporting as a vendor price cut', () => {
    const commodity = assess(
      item(
        'Energy Trade Dips Amid Lower Oil Prices and Tariffs',
        'Gas prices hold steady as crude oil costs remain high.',
      ),
      1.2,
      NOW,
    );
    const vendor = assess(
      item('OpenAI cuts model prices for developers', 'The price cut applies to all plans.'),
      1,
      NOW,
    );

    assert.ok(!commodity.tags.includes('price cut'), 'commodity news is not a price cut');
    assert.ok(vendor.tags.includes('price cut'), 'a real price cut must still register');
    assert.ok(
      vendor.score > commodity.score,
      `vendor ${vendor.score} should beat commodity ${commodity.score}`,
    );
  });

  // ---- dedupe ------------------------------------------------------------

  await test('deduplicates by canonical URL, ignoring tracking params', () => {
    const result = dedupe([
      item('Story one'),
      { ...item('Story one'), link: 'https://example.com/a?utm_source=rss' },
      { ...item('Story two'), link: 'https://example.com/a' },
    ]);
    assert.equal(result.length, 2);
  });

  await test('deduplicates the same headline from two outlets', () => {
    const headline = 'Zapier launches a free AI tier that automates invoicing for small businesses';
    const result = dedupe([
      { ...item(headline), link: 'https://a.example.com/x' },
      { ...item(headline), link: 'https://b.example.com/y' },
    ]);
    assert.equal(result.length, 1);
  });

  await test('merges the same story reworded by a second outlet', () => {
    // Both of these were published in the first live run.
    const result = dedupe([
      { ...item("LinkedIn actually adds a 'seems like AI slop' button"), link: 'https://a.example.com/1' },
      { ...item("LinkedIn adds a button to report AI-generated 'slop'"), link: 'https://b.example.com/2' },
    ]);
    assert.equal(result.length, 1);
  });

  await test('does not merge genuinely different headlines', () => {
    const result = dedupe([
      { ...item('Google cuts Gemini API prices for developers'), link: 'https://a.example.com/1' },
      { ...item('Shopify adds an AI product description writer'), link: 'https://b.example.com/2' },
    ]);
    assert.equal(result.length, 2);
  });

  // ---- digest ------------------------------------------------------------

  const fakeFetcher = async () => [
    {
      items: parseFeed(rssXml, rssSource).map((i) => ({ ...i, sourceId: SOURCES[0]!.id, sourceName: SOURCES[0]!.name })),
      report: { sourceId: SOURCES[0]!.id, sourceName: SOURCES[0]!.name, ok: true, itemCount: 6 },
    },
    {
      items: parseFeed(atomXml, atomSource).map((i) => ({ ...i, sourceId: SOURCES[1]!.id, sourceName: SOURCES[1]!.name })),
      report: { sourceId: SOURCES[1]!.id, sourceName: SOURCES[1]!.name, ok: true, itemCount: 3 },
    },
    {
      items: [],
      report: {
        sourceId: SOURCES[2]!.id,
        sourceName: SOURCES[2]!.name,
        ok: false,
        itemCount: 0,
        error: 'HTTP 503',
      },
    },
  ];

  const digest = await buildDigest({
    now: NOW,
    timeZone: 'UTC',
    skipEnrichment: true,
    fetcher: fakeFetcher,
  });

  await test('builds a digest from mixed RSS and Atom sources', () => {
    assert.equal(digest.date, '2026-07-29');
    assert.ok(digest.items.length > 0, 'expected published items');
    assert.equal(digest.stats.fetched, 9);
  });

  await test('drops noise and stale stories from the published set', () => {
    const titles = digest.items.map((i) => i.title);
    assert.ok(!titles.some((t) => t.includes('Series C')), 'funding story survived');
    assert.ok(!titles.some((t) => t.includes('benchmark')), 'benchmark story survived');
    assert.ok(!titles.some((t) => t.includes('too old')), 'stale story survived');
  });

  await test('deduplicates cross-outlet coverage inside the digest', () => {
    const zapier = digest.items.filter((i) => i.title.includes('Zapier launches'));
    assert.equal(zapier.length, 1);
  });

  await test('sorts published items by descending score', () => {
    const scores = digest.items.map((i) => i.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  });

  await test('keeps rank order after back-filling from the overflow', async () => {
    // The first live run ended on scores 23, 22, 40, 37 — the per-source cap
    // pushed items into an overflow list that was appended without re-sorting.
    const noisy = Array.from({ length: 14 }, (_, index) => ({
      ...item(
        `AI tool number ${index} automates invoicing for small businesses`,
        index % 2 ? 'Free tier for freelancers.' : 'A workflow integration.',
      ),
      link: `https://loud.example.com/${index}`,
    }));

    const packed = await buildDigest({
      now: NOW,
      timeZone: 'UTC',
      skipEnrichment: true,
      fetcher: async () => [
        {
          items: noisy.map((i) => ({ ...i, sourceId: SOURCES[0]!.id, sourceName: SOURCES[0]!.name })),
          report: { sourceId: SOURCES[0]!.id, sourceName: SOURCES[0]!.name, ok: true, itemCount: noisy.length },
        },
      ],
    });

    const scores = packed.items.map((i) => i.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'must stay ranked');
    assert.ok(
      packed.items.length <= 8,
      `one source must not fill the digest, got ${packed.items.length}`,
    );
  });

  await test('gives every item a why-it-matters note and at least one action', () => {
    for (const entry of digest.items) {
      assert.ok(entry.whyItMatters.length > 20, `thin note on "${entry.title}"`);
      assert.ok(entry.actions.length >= 1, `no actions on "${entry.title}"`);
      assert.ok(entry.actions.every((a) => a.trim().length > 0));
    }
  });

  await test('reports failed sources without failing the run', () => {
    const failed = digest.sources.filter((s) => !s.ok);
    assert.equal(failed.length, 1);
    assert.equal(failed[0]!.error, 'HTTP 503');
    assert.ok(digest.items.length > 0, 'a dead source must not empty the digest');
  });

  await test('produces a headline that names the lead story', () => {
    assert.ok(digest.headline.includes(digest.items[0]!.title));
  });

  await test('handles a day where every source is empty', async () => {
    const empty = await buildDigest({
      now: NOW,
      timeZone: 'UTC',
      skipEnrichment: true,
      fetcher: async () =>
        SOURCES.map((source) => ({
          items: [],
          report: { sourceId: source.id, sourceName: source.name, ok: true, itemCount: 0 },
        })),
    });
    assert.equal(empty.items.length, 0);
    assert.ok(empty.headline.includes('Nothing today'));
  });

  // ---- render ------------------------------------------------------------

  await test('renders markdown with sections, actions and links', () => {
    const markdown = renderMarkdown(digest);
    assert.ok(markdown.startsWith('# Singular Vision AI Hub — 2026-07-29'));
    assert.ok(markdown.includes('**Why it matters for you:**'));
    assert.ok(markdown.includes(`[Read it](${digest.items[0]!.url})`));
    assert.ok(markdown.includes('Sources unavailable this run'));
  });

  // ---- saving ------------------------------------------------------------

  // The page ships an inline script that itself contains save-button markup,
  // so assertions about the rendered cards must look at the document body
  // only — otherwise the script's own string literals are counted as cards.
  const bodyOf = (html: string) => html.split('<script>')[0]!;

  const decodeEntities = (value: string) =>
    value
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

  await test('gives every story a save button carrying its full payload', () => {
    const body = bodyOf(renderDigestPage(digest, { isIndex: true }));
    const buttons = [...body.matchAll(/<button class="save" data-item="([^"]*)"/g)];
    assert.equal(buttons.length, digest.items.length);

    // The button must carry the whole story, not just an id — a saved item has
    // to keep working after it drops out of the digest.
    const payload = JSON.parse(decodeEntities(buttons[0]![1]!));
    assert.equal(payload.id, digest.items[0]!.id);
    assert.equal(payload.title, digest.items[0]!.title);
    assert.equal(payload.url, digest.items[0]!.url);
    assert.ok(payload.why.length > 0, 'why-it-matters must travel with the save');
  });

  await test('escapes a hostile headline inside the save payload', () => {
    // A feed controls the headline, and it lands inside an HTML attribute as
    // JSON — two nested escaping contexts, so it is worth pinning down.
    const title = 'Bad " onmouseover=alert(1) x="';
    const nasty = {
      ...digest,
      items: [{ ...digest.items[0]!, title, summary: '<script>alert(2)</script>' }],
    };
    const body = bodyOf(renderDigestPage(nasty, { isIndex: true }));

    // The quote must never appear raw, which is what would end the attribute
    // early and turn the rest into markup.
    assert.ok(!body.includes('" onmouseover'), 'attribute must not break out');
    assert.ok(!body.includes('<script>alert(2)'), 'summary must not inject a tag');

    // And the payload must still be intact once decoded.
    const match = /<button class="save" data-item="([^"]*)"/.exec(body);
    assert.ok(match, 'save button should still render');
    assert.equal(JSON.parse(decodeEntities(match![1]!)).title, title);
  });

  await test('renders a saved page with its controls', () => {
    const html = renderSavedPage();
    assert.ok(html.includes('id="saved-list"'), 'needs the list container');
    assert.ok(html.includes('id="copy-saved"'), 'needs the copy-out button');
    assert.ok(html.includes('id="clear-saved"'), 'needs the clear button');
    assert.ok(
      html.includes('lives in this browser only'),
      'must state the per-browser limitation',
    );
  });

  await test('links Saved from every page', () => {
    for (const [name, html] of [
      ['index', renderDigestPage(digest, { isIndex: true })],
      ['day', renderDigestPage(digest, { isIndex: false })],
      ['archive', renderArchivePage([{ date: '2026-07-29', count: 5 }])],
      ['saved', renderSavedPage()],
    ] as const) {
      assert.ok(html.includes('saved.html'), `${name} page must link Saved`);
    }
    // Day pages sit one directory down and need the relative hop.
    assert.ok(renderDigestPage(digest, { isIndex: false }).includes('../saved.html'));
  });

  // ---- store -------------------------------------------------------------

  await test('round-trips a digest through the store', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'svai-'));
    process.env.SVAI_DATA_DIR = dir;

    // Imported late so the module picks up the temp directory.
    const store = await import(`../lib/store?t=${Date.now()}`);
    await store.saveDigest(digest);

    const loaded = await store.loadDigest('2026-07-29');
    assert.equal(loaded?.date, digest.date);
    assert.equal(loaded?.items.length, digest.items.length);
    assert.deepEqual(await store.listDates(), ['2026-07-29']);
    assert.equal(await store.loadDigest('2020-01-01'), null);
    await assert.rejects(async () => store.loadDigest('../../etc/passwd'));

    await rm(dir, { recursive: true, force: true });
    delete process.env.SVAI_DATA_DIR;
  });

  await test('formats the local date in the configured timezone', () => {
    const midnightUtc = new Date('2026-07-29T02:00:00Z');
    assert.equal(localDateString(midnightUtc, 'UTC'), '2026-07-29');
    assert.equal(localDateString(midnightUtc, 'America/Los_Angeles'), '2026-07-28');
  });

  // ---- summary -----------------------------------------------------------

  console.log(
    `\n${passed} passed, ${failures.length} failed` +
      (failures.length ? `\nFailing: ${failures.join(', ')}` : ''),
  );
  console.log('');

  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { createHash } from 'node:crypto';
import { CATEGORY_LABELS, SOURCES } from '../config/sources';
import type { Digest, DigestItem, RawItem, SourceReport } from '../types';
import { deriveActions, deriveSummary, deriveWhyItMatters } from './angle';
import { enrichItems, enrichmentAvailable } from './enrich';
import { fetchAll } from './feeds';
import { SCORE_THRESHOLD, assess } from './relevance';

/** Stories older than this are stale for a *daily* digest. */
const MAX_AGE_HOURS = 48;
const MAX_ITEMS = 18;
/** No single outlet should be able to dominate a day's digest. */
const MAX_PER_SOURCE = 4;
/** How many top items get the (paid) Claude enrichment pass. */
const ENRICH_LIMIT = 12;

function itemId(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 12);
}

/** Strip tracking params and trailing slashes so the same story matches. */
function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|ref|source|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = '';
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`;
  } catch {
    return url;
  }
}

function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(the|a|an|is|are|to|for|of|and|in|on|with|new|now)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 8)
    .join(' ');
}

/**
 * Two outlets covering the same launch is one story, not two. Keeps the
 * first occurrence, which after sorting is the higher-scoring one.
 */
export function dedupe(items: RawItem[]): RawItem[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const kept: RawItem[] = [];

  for (const item of items) {
    const url = canonicalUrl(item.link);
    const title = titleKey(item.title);
    if (seenUrls.has(url) || (title.length > 12 && seenTitles.has(title))) {
      continue;
    }
    seenUrls.add(url);
    if (title.length > 12) seenTitles.add(title);
    kept.push({ ...item, link: url });
  }

  return kept;
}

function withinWindow(item: RawItem, now: Date): boolean {
  if (!item.publishedAt) return true;
  const published = new Date(item.publishedAt).getTime();
  if (Number.isNaN(published)) return true;
  const ageHours = (now.getTime() - published) / 3_600_000;
  // Allow a little slack for feeds with clocks set ahead.
  return ageHours <= MAX_AGE_HOURS && ageHours >= -6;
}

/** Cap per-source representation while preserving overall rank order. */
function balanceSources(items: DigestItem[], limit: number): DigestItem[] {
  const counts = new Map<string, number>();
  const kept: DigestItem[] = [];
  const overflow: DigestItem[] = [];

  for (const item of items) {
    const count = counts.get(item.sourceId) ?? 0;
    if (count < MAX_PER_SOURCE) {
      counts.set(item.sourceId, count + 1);
      kept.push(item);
    } else {
      overflow.push(item);
    }
  }

  // If balancing left us short of a full digest, backfill from the overflow.
  if (kept.length < limit) kept.push(...overflow.slice(0, limit - kept.length));
  return kept.slice(0, limit);
}

function buildHeadline(items: DigestItem[]): string {
  if (items.length === 0) {
    return 'Nothing today cleared the bar. That is a legitimate result — no busywork.';
  }

  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  const [topCategory] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]!;
  const label = (CATEGORY_LABELS[topCategory] ?? 'Strategy & Trends').toLowerCase();
  const lead = items[0]!;

  return `${items.length} ${items.length === 1 ? 'story' : 'stories'} worth your time — mostly ${label}. Start with: ${lead.title}`;
}

export function localDateString(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export interface BuildOptions {
  now?: Date;
  timeZone?: string;
  /** Skip the Claude pass even when a key is present (used by tests). */
  skipEnrichment?: boolean;
  /** Injected by tests to avoid network access. */
  fetcher?: typeof fetchAll;
}

export async function buildDigest(options: BuildOptions = {}): Promise<Digest> {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? process.env.SVAI_TIMEZONE ?? 'UTC';
  const fetcher = options.fetcher ?? fetchAll;

  const results = await fetcher(SOURCES);
  const reports: SourceReport[] = results.map((result) => result.report);
  const raw = results.flatMap((result) => result.items);

  const fresh = raw.filter((item) => withinWindow(item, now));
  const unique = dedupe(fresh);

  const weights = new Map(SOURCES.map((source) => [source.id, source.weight]));

  const scored: DigestItem[] = unique
    .map((item) => {
      const assessment = assess(item, weights.get(item.sourceId) ?? 1, now);
      return {
        id: itemId(item.link),
        title: item.title,
        url: item.link,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        publishedAt: item.publishedAt,
        summary: deriveSummary(item),
        whyItMatters: deriveWhyItMatters(assessment.tags, assessment.category),
        actions: deriveActions(assessment.tags, assessment.category),
        category: assessment.category,
        tags: assessment.tags,
        score: assessment.score,
        breakdown: assessment.breakdown,
        enriched: false,
      } satisfies DigestItem;
    })
    .filter((item) => item.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  let published = balanceSources(scored, MAX_ITEMS);

  const shouldEnrich = !options.skipEnrichment && enrichmentAvailable();
  if (shouldEnrich) {
    const head = await enrichItems(published.slice(0, ENRICH_LIMIT));
    published = [...head, ...published.slice(ENRICH_LIMIT)];
  }

  return {
    date: localDateString(now, timeZone),
    generatedAt: now.toISOString(),
    headline: buildHeadline(published),
    items: published,
    sources: reports,
    stats: {
      fetched: raw.length,
      deduped: unique.length,
      scored: scored.length,
      published: published.length,
      enriched: published.some((item) => item.enriched),
    },
  };
}

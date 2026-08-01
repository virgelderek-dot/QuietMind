import { XMLParser } from 'fast-xml-parser';
import type { FeedSource, RawItem, SourceReport } from '../types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  // Feeds are wildly inconsistent about whether a field appears once or
  // many times; normalising to arrays at read time is simpler than guarding
  // every access site.
  isArray: (name) => ['item', 'entry', 'link', 'category'].includes(name),
});

const USER_AGENT =
  'SingularVisionAIHub/1.0 (+daily AI digest for small businesses)';

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return stripHtml(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return text(record['#text'] ?? record['@_href'] ?? '');
  }
  return '';
}

/** Atom puts the URL on an attribute; RSS puts it in the element body. */
function extractLink(entry: Record<string, unknown>): string {
  const link = entry['link'];

  if (Array.isArray(link)) {
    const alternate = link.find((candidate) => {
      if (typeof candidate !== 'object' || candidate === null) return false;
      const rel = (candidate as Record<string, unknown>)['@_rel'];
      return rel === undefined || rel === 'alternate';
    });
    const chosen = alternate ?? link[0];
    if (typeof chosen === 'string') return chosen.trim();
    if (typeof chosen === 'object' && chosen !== null) {
      const record = chosen as Record<string, unknown>;
      const href = record['@_href'] ?? record['#text'];
      if (typeof href === 'string') return href.trim();
    }
  }

  if (typeof link === 'string') return link.trim();

  const guid = entry['guid'];
  const guidText = text(guid);
  return guidText.startsWith('http') ? guidText : '';
}

function extractDate(entry: Record<string, unknown>): string | null {
  const candidates = [
    entry['pubDate'],
    entry['published'],
    entry['updated'],
    entry['dc:date'],
    entry['date'],
  ];

  for (const candidate of candidates) {
    const raw = text(candidate);
    if (!raw) continue;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null;
}

/** Parse RSS 2.0 / RDF / Atom into a common shape. */
export function parseFeed(xml: string, source: FeedSource): RawItem[] {
  const doc = parser.parse(xml) as Record<string, any>;
  const channel = doc?.rss?.channel ?? doc?.['rdf:RDF'] ?? doc?.feed ?? doc;
  const entries: Record<string, unknown>[] =
    channel?.item ?? channel?.entry ?? doc?.item ?? doc?.entry ?? [];

  const items: RawItem[] = [];

  for (const entry of entries) {
    const title = text(entry['title']);
    const link = extractLink(entry);
    if (!title || !link) continue;

    const description = text(
      entry['description'] ??
        entry['summary'] ??
        entry['content'] ??
        entry['content:encoded'] ??
        '',
    ).slice(0, 2000);

    items.push({
      title,
      link,
      description,
      publishedAt: extractDate(entry),
      sourceId: source.id,
      sourceName: source.name,
    });
  }

  return items;
}

export interface FetchResult {
  items: RawItem[];
  report: SourceReport;
}

export async function fetchSource(
  source: FeedSource,
  timeoutMs = 15_000,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseFeed(xml, source);

    return {
      items,
      report: {
        sourceId: source.id,
        sourceName: source.name,
        ok: true,
        itemCount: items.length,
      },
    };
  } catch (error) {
    // A dead feed must never take the whole digest down — the day's other
    // dozen sources are still worth publishing.
    return {
      items: [],
      report: {
        sourceId: source.id,
        sourceName: source.name,
        ok: false,
        itemCount: 0,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAll(sources: FeedSource[]): Promise<FetchResult[]> {
  return Promise.all(sources.map((source) => fetchSource(source)));
}

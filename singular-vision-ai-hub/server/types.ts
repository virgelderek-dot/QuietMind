export type CategoryId =
  | 'tools'
  | 'automation'
  | 'marketing'
  | 'pricing'
  | 'rules'
  | 'strategy';

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export interface FeedSource {
  /** Stable slug used in stored digests. */
  id: string;
  name: string;
  url: string;
  /** Editorial note on why a solo operator should care about this outlet. */
  angle: string;
  /** Multiplier applied to every item from this source (1.0 = neutral). */
  weight: number;
}

/** A raw entry as parsed out of an RSS/Atom feed, before scoring. */
export interface RawItem {
  title: string;
  link: string;
  description: string;
  publishedAt: string | null;
  sourceId: string;
  sourceName: string;
}

export interface ScoreBreakdown {
  /** Points from solopreneur/SMB relevance signals. */
  relevance: number;
  /** Points from actionability signals (ship-today language). */
  actionability: number;
  /** Negative points from enterprise/industry-noise signals. */
  noise: number;
  /** Points from recency decay. */
  freshness: number;
  /** Source weight multiplier that was applied. */
  sourceWeight: number;
}

export interface DigestItem {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string | null;
  summary: string;
  whyItMatters: string;
  actions: string[];
  category: CategoryId;
  tags: string[];
  /** 0-100. */
  score: number;
  breakdown: ScoreBreakdown;
  /** True when whyItMatters/actions came from the Claude enrichment pass. */
  enriched: boolean;
}

export interface SourceReport {
  sourceId: string;
  sourceName: string;
  ok: boolean;
  itemCount: number;
  error?: string;
}

export interface Digest {
  /** YYYY-MM-DD in the configured timezone. */
  date: string;
  generatedAt: string;
  headline: string;
  items: DigestItem[];
  sources: SourceReport[];
  stats: {
    fetched: number;
    deduped: number;
    scored: number;
    published: number;
    enriched: boolean;
  };
}

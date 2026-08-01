export type CategoryId =
  | 'tools'
  | 'automation'
  | 'marketing'
  | 'pricing'
  | 'rules'
  | 'strategy';

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
  score: number;
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

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export interface Meta {
  categories: Category[];
  sources: { id: string; name: string; angle: string }[];
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}) as { error?: string });
    throw new Error(detail.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  today: () => get<Digest>('/api/digest/today'),
  byDate: (date: string) => get<Digest>(`/api/digest/${date}`),
  dates: () => get<{ dates: string[] }>('/api/digests'),
  meta: () => get<Meta>('/api/meta'),
  markdown: async (date: string) => {
    const response = await fetch(`/api/digest/${date}/markdown`);
    if (!response.ok) throw new Error('Could not render markdown');
    return response.text();
  },
  refresh: async () => {
    const response = await fetch('/api/refresh', { method: 'POST' });
    if (!response.ok) throw new Error('Refresh failed');
    return response.json() as Promise<Digest>;
  },
};

const SAVED_KEY = 'svai.saved.v1';

export function loadSaved(): Record<string, DigestItem> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function persistSaved(saved: Record<string, DigestItem>): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {
    // Private browsing or a full quota — saving is a convenience, not core.
  }
}

export function timeAgo(iso: string | null): string {
  if (!iso) return 'undated';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

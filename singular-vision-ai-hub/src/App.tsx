import {
  AlertTriangle,
  Bookmark,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import StoryCard from './components/StoryCard';
import {
  api,
  loadSaved,
  persistSaved,
  type Category,
  type Digest,
  type DigestItem,
  type Meta,
} from './lib/api';

type Tab = 'today' | 'saved' | 'archive';

export default function App() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('today');
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<Record<string, DigestItem>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [todayDigest, metadata, archive] = await Promise.all([
          api.today(),
          api.meta(),
          api.dates(),
        ]);
        if (cancelled) return;
        setDigest(todayDigest);
        setMeta(metadata);
        setDates(archive.dates);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Could not load digest');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = useCallback((item: DigestItem) => {
    setSaved((current) => {
      const next = { ...current };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      persistSaved(next);
      return next;
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      setDigest(await api.refresh());
      setDates((await api.dates()).dates);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenDate = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      setDigest(await api.byDate(date));
      setTab('today');
      setCategory('all');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load that day');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(await api.markdown(digest.date));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const entry of meta?.categories ?? []) labels[entry.id] = entry.label;
    return labels;
  }, [meta]);

  const pool = tab === 'saved' ? Object.values(saved) : (digest?.items ?? []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pool.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.summary.toLowerCase().includes(needle) ||
        item.sourceName.toLowerCase().includes(needle) ||
        item.tags.some((tag) => tag.includes(needle))
      );
    });
  }, [pool, category, query]);

  const activeCategories = useMemo(() => {
    const present = new Set(pool.map((item) => item.category));
    return (meta?.categories ?? []).filter((entry) => present.has(entry.id));
  }, [pool, meta]);

  const failedSources = digest?.sources.filter((source) => !source.ok) ?? [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a3244] bg-[#12161f]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-5 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-neutral-100">
                <span aria-hidden className="text-[#d97757]">◎</span>
                Singular Vision AI Hub
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Today&rsquo;s AI news, filtered for what changes your week.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!digest}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a3244] px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-[#3d4761] hover:text-neutral-100 disabled:opacity-40"
              >
                {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                {copied ? 'Copied' : 'Copy digest'}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d97757] px-3 py-1.5 text-sm font-medium text-[#12161f] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  aria-hidden
                  className={refreshing ? 'animate-spin' : undefined}
                />
                {refreshing ? 'Rebuilding' : 'Refresh'}
              </button>
            </div>
          </div>

          <nav className="mt-5 flex gap-1" aria-label="Views">
            {(
              [
                ['today', digest ? `Digest · ${digest.date}` : 'Digest'],
                ['saved', `Saved (${Object.keys(saved).length})`],
                ['archive', 'Archive'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  tab === id
                    ? 'bg-[#1b2130] font-medium text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-6">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-neutral-500">
            <Loader2 size={18} className="animate-spin" aria-hidden />
            Gathering today&rsquo;s stories…
          </div>
        ) : tab === 'archive' ? (
          <section>
            <h2 className="mb-3 text-sm font-medium text-neutral-400">
              Past digests
            </h2>
            {dates.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No archived digests yet — they accumulate one per day.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {dates.map((date) => (
                  <li key={date}>
                    <button
                      type="button"
                      onClick={() => handleOpenDate(date)}
                      className="w-full rounded-lg border border-[#2a3244] bg-[#1b2130] px-4 py-3 text-left text-sm text-neutral-300 transition-colors hover:border-[#3d4761] hover:text-neutral-100"
                    >
                      {date}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            {tab === 'today' && digest && (
              <p className="mb-5 text-[15px] leading-relaxed text-neutral-300">
                {digest.headline}
              </p>
            )}

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:min-w-[240px]">
                <Search
                  size={15}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-600"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search stories, sources, tags…"
                  aria-label="Search stories"
                  className="w-full rounded-lg border border-[#2a3244] bg-[#1b2130] py-2 pr-3 pl-9 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-[#d97757] focus:outline-none"
                />
              </div>
            </div>

            {activeCategories.length > 0 && (
              <div
                className="mb-5 flex flex-wrap gap-1.5"
                role="group"
                aria-label="Filter by category"
              >
                <FilterChip
                  active={category === 'all'}
                  onClick={() => setCategory('all')}
                  label={`Everything (${pool.length})`}
                />
                {activeCategories.map((entry: Category) => (
                  <FilterChip
                    key={entry.id}
                    active={category === entry.id}
                    onClick={() => setCategory(entry.id)}
                    label={`${entry.label} (${pool.filter((i) => i.category === entry.id).length})`}
                    title={entry.blurb}
                  />
                ))}
              </div>
            )}

            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2a3244] px-6 py-16 text-center">
                {tab === 'saved' ? (
                  <p className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                    <Bookmark size={15} aria-hidden />
                    Nothing saved yet — use the bookmark on any story.
                  </p>
                ) : (
                  <p className="text-sm text-neutral-500">
                    {pool.length === 0
                      ? 'Nothing cleared the relevance bar today. That is a real result, not an error.'
                      : 'No stories match that filter.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visible.map((item) => (
                  <StoryCard
                    key={item.id}
                    item={item}
                    categoryLabel={categoryLabels[item.category] ?? item.category}
                    saved={Boolean(saved[item.id])}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )}

            {tab === 'today' && digest && (
              <footer className="mt-10 border-t border-[#2a3244] pt-5 text-xs leading-relaxed text-neutral-600">
                <p>
                  Scanned {digest.stats.fetched} stories from{' '}
                  {digest.sources.length} sources · kept {digest.stats.published} ·
                  built {new Date(digest.generatedAt).toLocaleString()}
                  {digest.stats.enriched && ' · notes written by Claude'}
                </p>
                {failedSources.length > 0 && (
                  <p className="mt-1">
                    Unavailable this run:{' '}
                    {failedSources.map((source) => source.sourceName).join(', ')}
                  </p>
                )}
              </footer>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'bg-[#d97757] font-medium text-[#12161f]'
          : 'border border-[#2a3244] text-neutral-400 hover:border-[#3d4761] hover:text-neutral-200'
      }`}
    >
      {label}
    </button>
  );
}

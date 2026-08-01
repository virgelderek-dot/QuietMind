import { ArrowUpRight, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { timeAgo, type CategoryId, type DigestItem } from '../lib/api';

const CATEGORY_STYLES: Record<CategoryId, string> = {
  tools: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  automation: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  marketing: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  pricing: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  rules: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  strategy: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
};

interface Props {
  item: DigestItem;
  categoryLabel: string;
  saved: boolean;
  onToggleSave: (item: DigestItem) => void;
}

export default function StoryCard({
  item,
  categoryLabel,
  saved,
  onToggleSave,
}: Props) {
  return (
    <article className="group rounded-xl border border-[#2a3244] bg-[#1b2130] p-5 transition-colors hover:border-[#3d4761]">
      <header className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${CATEGORY_STYLES[item.category]}`}
        >
          {categoryLabel}
        </span>
        <span className="text-neutral-400">{item.sourceName}</span>
        <span className="text-neutral-600">·</span>
        <span className="text-neutral-500">{timeAgo(item.publishedAt)}</span>

        <span className="ml-auto flex items-center gap-2">
          {item.enriched && (
            <span
              title="Note written by Claude for this story"
              className="flex items-center gap-1 text-[#f0b49b]"
            >
              <Sparkles size={12} aria-hidden />
            </span>
          )}
          <span
            title={`Relevance to a small business: ${item.score}/100`}
            className="font-mono text-neutral-400"
          >
            {item.score}
          </span>
          <button
            type="button"
            onClick={() => onToggleSave(item)}
            aria-label={saved ? 'Remove from saved' : 'Save for later'}
            aria-pressed={saved}
            className="rounded p-1 text-neutral-500 transition-colors hover:bg-white/5 hover:text-[#d97757]"
          >
            {saved ? (
              <BookmarkCheck size={15} className="text-[#d97757]" aria-hidden />
            ) : (
              <Bookmark size={15} aria-hidden />
            )}
          </button>
        </span>
      </header>

      <h3 className="mb-2 text-lg leading-snug font-semibold text-neutral-100">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#f0b49b]"
        >
          {item.title}
        </a>
      </h3>

      <p className="mb-4 text-sm leading-relaxed text-neutral-400">{item.summary}</p>

      <div className="mb-4 rounded-lg border-l-2 border-[#d97757] bg-[#12161f] px-4 py-3">
        <p className="mb-1 text-[11px] font-semibold tracking-wide text-[#d97757] uppercase">
          Why it matters for you
        </p>
        <p className="text-sm leading-relaxed text-neutral-300">
          {item.whyItMatters}
        </p>
      </div>

      {item.actions.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {item.actions.map((action) => (
            <li
              key={action}
              className="flex gap-2 text-sm leading-relaxed text-neutral-300"
            >
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#d97757]" />
              {action}
            </li>
          ))}
        </ul>
      )}

      <footer className="flex flex-wrap items-center gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#d97757] hover:underline"
        >
          Read it <ArrowUpRight size={14} aria-hidden />
        </a>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </span>
      </footer>
    </article>
  );
}

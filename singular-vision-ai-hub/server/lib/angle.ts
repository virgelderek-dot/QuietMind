import type { CategoryId, RawItem } from '../types';

/**
 * Deterministic "why it matters" + suggested actions.
 *
 * This runs for every item with no API key and no network call, so the digest
 * is always useful on its own. When ANTHROPIC_API_KEY is set, the enrichment
 * pass in `enrich.ts` replaces these for the top-ranked items with something
 * specific to the story.
 */

const CATEGORY_FRAMING: Record<CategoryId, string> = {
  tools:
    'A tool you could evaluate without a procurement process — the question is whether it removes a task you currently do by hand.',
  automation:
    'This is back-office time. Anything here competes directly with hours you are personally spending on admin.',
  marketing:
    'Distribution work. Judge it by whether it gets you in front of more of the right people for the same effort.',
  pricing:
    'This moves your cost base. Even small per-seat changes compound when you are paying out of revenue rather than a budget line.',
  rules:
    'An obligation, not an opportunity. Small businesses get caught out here because nobody is watching the rules full time.',
  strategy:
    'Context rather than a task. Useful for deciding what to commit to next quarter and what to ignore.',
};

interface ActionRule {
  tags: string[];
  action: string;
}

const ACTION_RULES: ActionRule[] = [
  { tags: ['free tier', 'free'], action: 'Check whether the free tier covers your actual volume before paying for the equivalent elsewhere.' },
  { tags: ['price cut', 'pricing'], action: 'Compare against what you currently pay for the same job and reprice if the gap is material.' },
  { tags: ['limits'], action: 'Re-check your usage against the new limits so a cap does not surprise you mid-month.' },
  { tags: ['automation', 'workflow', 'automation stack'], action: 'Pick the single most repetitive task in your week and see whether this covers it end to end.' },
  { tags: ['finance ops'], action: 'Trial it against one month of real invoices before trusting it with the books.' },
  { tags: ['support'], action: 'Draft answers for your ten most common customer questions and test the quality on those.' },
  { tags: ['scheduling'], action: 'Worth an hour to set up if you are still coordinating bookings by email.' },
  { tags: ['seo'], action: 'Audit how your site currently surfaces in AI-generated answers, not just in blue links.' },
  { tags: ['content', 'social', 'email'], action: 'Use it to increase output on a channel that already converts — not to open a new one.' },
  { tags: ['generative media', 'creative'], action: 'Cheapest test: regenerate an asset you already paid for and compare quality honestly.' },
  { tags: ['ecommerce'], action: 'Check whether your storefront platform supports this natively before adding another subscription.' },
  { tags: ['no-code'], action: 'No developer needed — this is buildable in an afternoon if it fits.' },
  { tags: ['open source', 'self-host'], action: 'Free to run, but budget the setup time honestly before committing.' },
  { tags: ['integration'], action: 'Confirm it connects to the tools you already run; an unconnected tool becomes shelfware.' },
  { tags: ['copyright', 'disclosure'], action: 'Review anything you have already published that this would now cover.' },
  { tags: ['regulation'], action: 'Note the compliance date and check whether your business size is in scope.' },
  { tags: ['privacy'], action: 'Check what customer data you are currently passing to AI tools, and under what terms.' },
  { tags: ['fraud risk'], action: 'Brief anyone who can authorise a payment or a password reset on your behalf.' },
  { tags: ['how-to', 'playbook'], action: 'Practical walkthrough — read it once and decide, rather than bookmarking it.' },
  { tags: ['availability'], action: 'Now generally available, so you can test it today rather than joining a waitlist.' },
];

const DEFAULT_ACTION =
  'Skim it, then decide in one minute whether it changes anything you do this week.';

export function deriveActions(tags: string[], category: CategoryId): string[] {
  const tagSet = new Set(tags);
  const actions: string[] = [];

  for (const rule of ACTION_RULES) {
    if (rule.tags.some((tag) => tagSet.has(tag))) {
      actions.push(rule.action);
    }
    if (actions.length === 3) break;
  }

  if (actions.length === 0) {
    actions.push(
      category === 'strategy'
        ? 'Background reading — no action needed today, but worth knowing.'
        : DEFAULT_ACTION,
    );
  }

  return actions;
}

export function deriveWhyItMatters(
  tags: string[],
  category: CategoryId,
): string {
  const framing = CATEGORY_FRAMING[category];
  const audienceTags = tags.filter((tag) =>
    ['solopreneur', 'small business', 'smb', 'freelance', 'indie', 'solo', 'side hustle'].includes(tag),
  );

  if (audienceTags.length > 0) {
    return `Written for your side of the market rather than for enterprise buyers. ${framing}`;
  }

  return framing;
}

/** First couple of sentences, trimmed to something readable in a card. */
export function deriveSummary(item: RawItem, limit = 260): string {
  const source = item.description?.trim() || item.title;
  if (source.length <= limit) return source;

  const truncated = source.slice(0, limit);
  const lastBreak = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
  );

  if (lastBreak > limit * 0.5) return truncated.slice(0, lastBreak + 1);
  return `${truncated.replace(/\s+\S*$/, '')}…`;
}

import Anthropic from '@anthropic-ai/sdk';
import type { DigestItem } from '../types';

/**
 * Optional pass: rewrite "why it matters" and the suggested actions for the
 * top-ranked stories so they speak to the specific story rather than to its
 * category. Skipped entirely when ANTHROPIC_API_KEY is absent — the digest is
 * designed to be useful without it.
 */

const MODEL = 'claude-opus-5';

/**
 * Routine extraction over short inputs. `high` is the API default; `medium`
 * is the cost lever if a daily run over many items gets expensive.
 */
const EFFORT = (process.env.SVAI_EFFORT ?? 'medium') as
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max';

const SYSTEM_PROMPT = `You write the editorial notes for Singular Vision AI Hub, a daily AI news digest read by solopreneurs and owners of businesses with fewer than about twenty staff.

Your reader has no IT department, no procurement process, and no budget line for experiments. They pay for tools out of revenue. Their scarcest resource is their own working hours.

For each story you are given, write:

1. "whyItMatters" — two sentences at most, addressed to that reader, explaining what changes for them specifically. Name the concrete thing: a task that gets cheaper, a cost that moves, an obligation that now applies. If the honest answer is that nothing changes for a business their size, say so plainly — that is a useful and welcome answer, not a failure.

2. "actions" — one to three short imperative lines. Each must be something the reader could start within a week using tools they plausibly already have. No line may be filler such as "keep an eye on this" or "consider the implications".

Write plainly. No hype, no marketing register, no exclamation marks. Do not invent capabilities, prices, or dates that are not present in the story you were given; if a detail is not there, write around it rather than guessing.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          whyItMatters: { type: 'string' },
          actions: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'whyItMatters', 'actions'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const;

interface EnrichedNote {
  id: string;
  whyItMatters: string;
  actions: string[];
}

export function enrichmentAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Returns items with `whyItMatters`/`actions` replaced where the model
 * produced a note. Failure is non-fatal: the deterministic notes stay.
 */
export async function enrichItems(items: DigestItem[]): Promise<DigestItem[]> {
  if (!enrichmentAvailable() || items.length === 0) return items;

  const client = new Anthropic();

  const payload = items.map((item) => ({
    id: item.id,
    title: item.title,
    source: item.sourceName,
    category: item.category,
    summary: item.summary,
  }));

  try {
    // Streaming keeps a large max_tokens from hitting the SDK's HTTP timeout.
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: EFFORT,
        format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: `Write notes for each of these ${payload.length} stories. Return one entry per story, keyed by the same id.\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      console.warn('[enrich] model declined; keeping deterministic notes');
      return items;
    }

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const parsed = JSON.parse(text) as { items?: EnrichedNote[] };
    const notes = new Map(
      (parsed.items ?? []).map((note) => [note.id, note] as const),
    );

    return items.map((item) => {
      const note = notes.get(item.id);
      if (!note?.whyItMatters) return item;

      const actions = (note.actions ?? [])
        .map((action) => action.trim())
        .filter(Boolean)
        .slice(0, 3);

      return {
        ...item,
        whyItMatters: note.whyItMatters.trim(),
        actions: actions.length > 0 ? actions : item.actions,
        enriched: true,
      };
    });
  } catch (error) {
    console.warn(
      '[enrich] enrichment failed, keeping deterministic notes:',
      error instanceof Error ? error.message : error,
    );
    return items;
  }
}

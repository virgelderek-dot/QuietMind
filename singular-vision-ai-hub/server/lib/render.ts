import { CATEGORY_LABELS } from '../config/sources';
import type { Digest } from '../types';

/** Email/Slack-ready plain markdown for the "copy digest" button and the CLI. */
export function renderMarkdown(digest: Digest): string {
  const lines: string[] = [
    `# Singular Vision AI Hub — ${digest.date}`,
    '',
    digest.headline,
    '',
  ];

  if (digest.items.length === 0) {
    lines.push(
      '_No stories cleared the relevance bar today. Nothing to action._',
      '',
    );
  }

  const byCategory = new Map<string, typeof digest.items>();
  for (const item of digest.items) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }

  for (const [category, items] of byCategory) {
    lines.push(`## ${CATEGORY_LABELS[category] ?? category}`, '');

    for (const item of items) {
      lines.push(`### ${item.title}`);
      lines.push(`_${item.sourceName} · relevance ${item.score}/100_`);
      lines.push('');
      lines.push(item.summary);
      lines.push('');
      lines.push(`**Why it matters for you:** ${item.whyItMatters}`);
      lines.push('');
      for (const action of item.actions) lines.push(`- ${action}`);
      lines.push('');
      lines.push(`[Read it](${item.url})`);
      lines.push('');
    }
  }

  const failed = digest.sources.filter((source) => !source.ok);
  if (failed.length > 0) {
    lines.push(
      '---',
      '',
      `_Sources unavailable this run: ${failed.map((s) => s.sourceName).join(', ')}_`,
      '',
    );
  }

  return lines.join('\n');
}

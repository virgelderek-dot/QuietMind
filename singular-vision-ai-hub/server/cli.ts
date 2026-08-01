import 'dotenv/config';
import { renderMarkdown } from './lib/render';
import { refresh } from './lib/schedule';

/**
 * `npm run digest` — build today's digest and print it as markdown.
 * Useful for cron, or for piping into an email/Slack send.
 *
 *   npm run digest            build (or reuse) today's digest
 *   npm run digest -- --force rebuild even if today's is cached
 *   npm run digest -- --json  emit raw JSON instead of markdown
 */
async function main() {
  const args = process.argv.slice(2);
  const digest = await refresh(args.includes('--force'));

  if (args.includes('--json')) {
    console.log(JSON.stringify(digest, null, 2));
  } else {
    console.log(renderMarkdown(digest));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

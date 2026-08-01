import 'dotenv/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderArchivePage, renderDigestPage } from './lib/html';
import { refresh } from './lib/schedule';
import { listDates, loadDigest } from './lib/store';

/**
 * `npm run site` — build today's digest, then render every stored digest into
 * a static site under `site/`. This is what GitHub Actions publishes to Pages,
 * so the digest is readable by clicking a link with nothing installed.
 */

const OUT = path.join(process.cwd(), 'site');

async function main() {
  const today = await refresh(process.argv.includes('--force'));
  console.log(`today: ${today.date} (${today.items.length} items)`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'd'), { recursive: true });

  await writeFile(
    path.join(OUT, 'index.html'),
    renderDigestPage(today, { isIndex: true }),
    'utf8',
  );

  const dates = await listDates();
  const entries: { date: string; count: number }[] = [];

  for (const date of dates) {
    const digest = await loadDigest(date);
    if (!digest) continue;
    await writeFile(
      path.join(OUT, 'd', `${date}.html`),
      renderDigestPage(digest, { isIndex: false }),
      'utf8',
    );
    entries.push({ date, count: digest.items.length });
  }

  await writeFile(
    path.join(OUT, 'archive.html'),
    renderArchivePage(entries),
    'utf8',
  );

  // Pages would otherwise run the output through Jekyll, which strips
  // directories beginning with an underscore and slows every build.
  await writeFile(path.join(OUT, '.nojekyll'), '', 'utf8');

  console.log(`site/: index + archive + ${entries.length} day page(s)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, SOURCES } from './config/sources';
import { localDateString } from './lib/digest';
import { enrichmentAvailable } from './lib/enrich';
import { renderMarkdown } from './lib/render';
import { refresh, startScheduler } from './lib/schedule';
import { listDates, loadDigest } from './lib/store';

const PORT = Number(process.env.PORT ?? 3100);
const TIMEZONE = process.env.SVAI_TIMEZONE ?? 'UTC';

async function start() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timezone: TIMEZONE,
      sourceCount: SOURCES.length,
      enrichment: enrichmentAvailable() ? 'enabled' : 'disabled',
    });
  });

  app.get('/api/meta', (_req, res) => {
    res.json({
      categories: CATEGORIES,
      sources: SOURCES.map(({ id, name, angle }) => ({ id, name, angle })),
    });
  });

  app.get('/api/digest/today', async (_req, res) => {
    try {
      res.json(await refresh());
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to build digest',
      });
    }
  });

  app.get('/api/digest/:date', async (req, res) => {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
    }

    const digest = await loadDigest(date);
    if (!digest) return res.status(404).json({ error: 'No digest for that date' });
    res.json(digest);
  });

  app.get('/api/digests', async (_req, res) => {
    res.json({ dates: await listDates() });
  });

  app.get('/api/digest/:date/markdown', async (req, res) => {
    const digest =
      req.params.date === 'today'
        ? await refresh()
        : await loadDigest(req.params.date);

    if (!digest) return res.status(404).json({ error: 'No digest for that date' });
    res.type('text/markdown').send(renderMarkdown(digest));
  });

  app.post('/api/refresh', async (_req, res) => {
    try {
      res.json(await refresh(true));
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Refresh failed',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('[server] dist/ not found — run `npm run build` first');
    }
  }

  startScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Singular Vision AI Hub API on http://localhost:${PORT}`);
    console.log(
      `  timezone: ${TIMEZONE} · today: ${localDateString(new Date(), TIMEZONE)}`,
    );
    console.log(
      `  enrichment: ${enrichmentAvailable() ? 'on (ANTHROPIC_API_KEY set)' : 'off'}`,
    );
    if (process.env.NODE_ENV !== 'production') {
      console.log('  UI: run `npm run build && npm start`, or `npx vite` for HMR');
    }
  });
}

start().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});

import { buildDigest, localDateString } from './digest';
import { loadDigest, saveDigest } from './store';
import type { Digest } from '../types';

const HOUR = 3_600_000;

/** Guards against two refreshes overlapping (scheduler + manual trigger). */
let inFlight: Promise<Digest> | null = null;

export async function refresh(force = false): Promise<Digest> {
  if (inFlight) return inFlight;

  const timeZone = process.env.SVAI_TIMEZONE ?? 'UTC';
  const today = localDateString(new Date(), timeZone);

  if (!force) {
    const existing = await loadDigest(today);
    if (existing) return existing;
  }

  inFlight = (async () => {
    const started = Date.now();
    const digest = await buildDigest({ timeZone });
    await saveDigest(digest);
    console.log(
      `[digest] ${digest.date}: ${digest.stats.published} published from ` +
        `${digest.stats.fetched} fetched in ${Date.now() - started}ms` +
        `${digest.stats.enriched ? ' (enriched)' : ''}`,
    );
    return digest;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/**
 * Runs the digest once at boot, then hourly. The hourly tick is a cheap way to
 * get "a fresh digest each morning" without a cron dependency: `refresh()`
 * no-ops when today's digest already exists, and the first tick after local
 * midnight is the one that does real work.
 */
export function startScheduler(): () => void {
  void refresh().catch((error) => {
    console.error('[digest] initial build failed:', error);
  });

  const timer = setInterval(() => {
    void refresh().catch((error) => {
      console.error('[digest] scheduled build failed:', error);
    });
  }, HOUR);

  // Do not hold the process open purely for the scheduler.
  timer.unref?.();

  return () => clearInterval(timer);
}

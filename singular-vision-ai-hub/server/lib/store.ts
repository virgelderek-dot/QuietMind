import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Digest } from '../types';

const DATA_DIR =
  process.env.SVAI_DATA_DIR ?? path.join(process.cwd(), 'data', 'digests');

const DATE_FILE = /^(\d{4}-\d{2}-\d{2})\.json$/;

async function ensureDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * The date is the only caller-controlled part of the path, and it reaches here
 * straight from an HTTP route — so it is validated rather than sanitised.
 */
function fileFor(date: string): string {
  if (!isValidDate(date)) throw new Error(`Invalid digest date: ${date}`);
  return path.join(DATA_DIR, `${date}.json`);
}

export async function saveDigest(digest: Digest): Promise<void> {
  await ensureDir();
  const target = fileFor(digest.date);
  // Write-then-rename so a reader never sees a half-written digest.
  const temp = `${target}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(digest, null, 2), 'utf8');
  await rename(temp, target);
}

export async function loadDigest(date: string): Promise<Digest | null> {
  // Reject traversal attempts loudly instead of letting the catch below turn
  // them into an indistinguishable "no digest found".
  if (!isValidDate(date)) throw new Error(`Invalid digest date: ${date}`);

  try {
    const contents = await readFile(fileFor(date), 'utf8');
    return JSON.parse(contents) as Digest;
  } catch {
    return null;
  }
}

/** Available digest dates, newest first. */
export async function listDates(): Promise<string[]> {
  await ensureDir();
  const entries = await readdir(DATA_DIR);
  return entries
    .map((entry) => DATE_FILE.exec(entry)?.[1])
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => b.localeCompare(a));
}

export async function latestDigest(): Promise<Digest | null> {
  const [newest] = await listDates();
  return newest ? loadDigest(newest) : null;
}

# Singular Vision AI Hub

A daily digest of AI news, filtered down to the stories that actually change
the week for a solopreneur or a small business owner.

Most AI coverage is written for investors and enterprise buyers. Funding
rounds, datacenter buildouts, and benchmark scores dominate the headlines and
change nothing for a one-person business on Monday morning. This app inverts
that: it reads a set of public feeds every day, scores each story on whether
someone running a small business could *do* something with it, and publishes
the handful that clear the bar — each with a plain-language note on why it
matters to you and one to three things you could act on.

No API keys are required to run it.

## Read it as a web page (nothing to install)

A GitHub Action builds the digest every morning and publishes it to GitHub
Pages, so you can just open a link. One-time setup, all in the browser:

1. Merge this branch into `main`.
2. Go to **Settings → Pages**, and under *Source* choose **GitHub Actions**.
3. Go to the **Actions** tab, pick *Daily AI digest*, and click **Run
   workflow** to build the first one immediately.

It then lands at **https://virgelderek-dot.github.io/QuietMind/** and refreshes
itself twice a day — 07:00 and 16:00 in Cape Town (05:00 and 14:00 UTC). Change
that by editing the `cron` line in `.github/workflows/daily-digest.yml`; cron is
always evaluated in UTC.

Both runs rebuild the same day's digest, so the page shows the day's news as of
the most recent run rather than accumulating two entries.

Two optional extras, both under **Settings**:

- *Secrets and variables → Actions → Variables*: `SVAI_TIMEZONE` decides when
  "today" rolls over. It defaults to `Africa/Johannesburg`; set the variable to
  another IANA zone if you move.
- *Secrets and variables → Actions → Secrets*: add `ANTHROPIC_API_KEY` to get
  per-story notes written by Claude.

Each day's digest is committed back into `data/digests/`, so the archive builds
up on its own.

## Quick start (running it yourself)

```bash
npm install
cp .env.example .env      # optional — set your timezone
npm run build             # build the UI
npm start                 # serve UI + API on http://localhost:3100
```

The first digest builds on boot. After that it rebuilds once a day.

For UI development with hot reload, run the API and Vite separately:

```bash
npm run dev               # API on :3100, restarts on change
npx vite                  # UI on :5173, proxies /api to :3100
```

## Getting the digest without opening a browser

```bash
npm run digest              # print today's digest as markdown
npm run digest -- --force   # rebuild even if today's is already cached
npm run digest -- --json    # raw JSON
npm run site                # render today + the archive into ./site as HTML
```

That makes it easy to mail to yourself with cron:

```cron
0 7 * * *  cd /path/to/singular-vision-ai-hub && npm run digest | mail -s "AI digest" you@example.com
```

## How a story earns its place

First, a **topicality gate**: the story must actually be about AI. This is a
separate test from usefulness, and skipping it was a real failure in the first
version — a general small-business feed filled the digest with bookkeeping
explainers and fuel-price updates, all perfectly useful and none of it AI news.

Whatever survives is then scored out of 100 from four components, defined in
`server/lib/relevance.ts`:

| Component | What it rewards |
|---|---|
| **Relevance** | Signals that a small operator is the beneficiary — explicit audience terms (solopreneur, freelancer, SMB), back-office relief (invoicing, scheduling, support), getting-found work (SEO, content, email), cost-base changes (free tiers, price cuts), and obligations (disclosure, copyright). |
| **Actionability** | Language that means "you could do this today": how-to, now available, launches, free. |
| **Noise** | A **penalty**, not just an absence of reward. Funding rounds, valuations, chips and datacenters, earnings, benchmarks, arxiv papers, executive hires, AGI speculation, and macro commodity reporting all subtract points. |
| **Freshness** | Exponential decay with a 30-hour half-life, so yesterday's story cannot outrank this morning's. |

Terms in the headline count 1.6× what they count in the body — a word in the
title is what the piece is *about*; the same word in paragraph four is an
aside.

The positive components are then passed through a saturating curve rather than
a linear one. A linear scale pegged every strong story at 100 and made the
ordering among the day's best items arbitrary; the exponential curve keeps
stories distinguishable all the way up. Anything below 22 is dropped.

A pure funding announcement scores 0. A no-code tool that automates invoicing
for small businesses on a free tier scores in the mid-90s.

Two further passes run before publishing:

- **Deduplication.** Tracking parameters are stripped and headlines are
  normalised, so the same launch covered by three outlets appears once.
- **Source balancing.** No single outlet may supply more than four of the
  day's items, so a prolific feed can't crowd out the rest.

## Tuning it to your business

The scoring tables are plain data — edit them, and the digest changes.

- **`server/lib/relevance.ts`** — add a signal for your niche. If you run an
  e-commerce shop, raising the `ecommerce` and `seo` weights and adding
  patterns for your platform will pull those stories up.
- **`server/config/sources.ts`** — add or remove feeds. Each source has a
  `weight` multiplier; drop it below 1.0 for outlets you find noisy.
- **`server/lib/angle.ts`** — the built-in "why it matters" framing and the
  action suggestions, keyed by category and tag.

After editing, `npm test` checks the pipeline still behaves.

## Optional: better notes from Claude

Set `ANTHROPIC_API_KEY` and the top twelve stories get their "why it matters"
note and actions written for that specific story rather than assembled from
its category. Everything else is unchanged, and the app is designed to be
useful without it — if the key is missing, the call fails, or the model
declines, the built-in notes are kept and the digest still publishes.

Uses `claude-opus-5` with structured outputs. `SVAI_EFFORT` controls the
cost/quality trade-off (default `medium`, which suits routine summarisation).

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/digest/today` | Today's digest, building it if needed |
| `GET /api/digest/:date` | An archived digest (`YYYY-MM-DD`) |
| `GET /api/digest/:date/markdown` | Same, as markdown; `:date` may be `today` |
| `GET /api/digests` | Available dates, newest first |
| `GET /api/meta` | Category and source definitions |
| `POST /api/refresh` | Force a rebuild |
| `GET /api/health` | Status, timezone, whether enrichment is on |

Digests are stored as one JSON file per day under `data/digests/`, written
atomically so a reader never sees a partial file.

## Tests

```bash
npm test     # 32 offline tests — no network access required
npm run lint # tsc --noEmit
```

The suite runs against XML fixtures in `fixtures/`, covering RSS and Atom
parsing, malformed feeds, the scoring and ranking rules, deduplication,
digest assembly, markdown rendering, and the store's path handling.

## Notes

- **A dead feed never takes the digest down.** Fetch failures are caught per
  source, reported in the response, and shown in the UI footer.
- **An empty day is a legitimate result.** If nothing clears the bar, the app
  says so rather than padding the list.
- **The feed list is empirical.** Every URL has been confirmed to fetch and
  parse in a real run. Three were removed after the first one rather than left
  failing: Anthropic (404), Microsoft AI (410 Gone), and Indie Hackers (its
  feed exceeds the XML parser's nesting limit). Adding a source back is worth
  doing only once a run confirms the URL.

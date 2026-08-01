import type { CategoryId, RawItem, ScoreBreakdown } from '../types';

/**
 * The editorial thesis, encoded.
 *
 * A story earns its place in the digest when a one-person or ten-person
 * business could do something differently because of it. Model benchmarks,
 * funding rounds, and datacenter buildouts fail that test even though they
 * dominate AI headlines — so they are penalised, not merely unrewarded.
 */

interface Signal {
  /** Matched case-insensitively against title + description. */
  pattern: RegExp;
  points: number;
  tag: string;
  category?: CategoryId;
}

/**
 * The digest is AI news *for* small businesses, and the two halves are
 * independent tests. Scoring only the second half let a general small-business
 * feed fill the digest with bookkeeping explainers and fuel-price updates, so
 * topicality is now a gate: no AI, no entry, however useful the story is.
 */
const AI_TOPIC =
  /\bA\.?I\.?\b|artificial intelligence|machine learning|\bML\b|\bLLMs?\b|large language model|generative|gen ?AI|chat ?bots?|ChatGPT|OpenAI|Anthropic|Claude|Gemini|Copilot|Llama|Mistral|Perplexity|Midjourney|Stable Diffusion|Sora|DALL.E|neural network|transformer model|deep learning|prompt(ing|s)?\b|agentic|AI agents?|deepfakes?|text.to.(image|video|speech)|image generation|video generation/i;

export function isAiTopic(title: string, description: string): boolean {
  return AI_TOPIC.test(title) || AI_TOPIC.test(description);
}

/** Signals that a solo operator or small team is the intended beneficiary. */
const RELEVANCE_SIGNALS: Signal[] = [
  // Explicit audience match — the strongest signal available.
  { pattern: /\bsolopreneur/i, points: 26, tag: 'solopreneur', category: 'strategy' },
  { pattern: /\bsmall business(es)?\b/i, points: 24, tag: 'small business', category: 'strategy' },
  { pattern: /\bsmall.and.medium|SMBs?\b|\bSMEs?\b/i, points: 20, tag: 'smb', category: 'strategy' },
  { pattern: /\bfreelancer?s?\b|\bself.employed\b/i, points: 20, tag: 'freelance', category: 'strategy' },
  { pattern: /\bindie (hacker|founder|dev)/i, points: 18, tag: 'indie', category: 'strategy' },
  { pattern: /\bone.person (business|company)|\bsolo founder/i, points: 22, tag: 'solo', category: 'strategy' },
  { pattern: /\bside (hustle|project)\b/i, points: 14, tag: 'side hustle', category: 'strategy' },
  { pattern: /\bcreators?\b|\bconsultants?\b|\bagenc(y|ies)\b/i, points: 10, tag: 'service business' },

  // Tooling you could adopt.
  { pattern: /\bno.code\b|\blow.code\b/i, points: 18, tag: 'no-code', category: 'tools' },
  { pattern: /\btemplates?\b|\bpresets?\b|\bstarter kit\b/i, points: 10, tag: 'templates', category: 'tools' },
  { pattern: /\bopen.source\b|\bopen weights?\b/i, points: 14, tag: 'open source', category: 'tools' },
  { pattern: /\bself.host(ed|ing)?\b|\bruns? locally\b|\bon.device\b/i, points: 12, tag: 'self-host', category: 'tools' },
  { pattern: /\bintegrat(es?|ion)\b|\bplug.?in\b|\bconnector\b/i, points: 11, tag: 'integration', category: 'automation' },
  { pattern: /\bbrowser extension\b|\bmobile app\b|\bdesktop app\b/i, points: 9, tag: 'app', category: 'tools' },

  // Automation and back-office relief.
  { pattern: /\bautomat(e|es|ed|ing|ion)\b/i, points: 16, tag: 'automation', category: 'automation' },
  { pattern: /\bworkflows?\b/i, points: 13, tag: 'workflow', category: 'automation' },
  { pattern: /\bAI agents?\b|\bagentic\b/i, points: 12, tag: 'agents', category: 'automation' },
  { pattern: /\bzapier\b|\bmake\.com\b|\bn8n\b|\bairtable\b|\bnotion\b/i, points: 15, tag: 'automation stack', category: 'automation' },
  { pattern: /\binvoic(e|ing)\b|\bbookkeep(ing)?\b|\baccounting\b|\bexpenses?\b/i, points: 18, tag: 'finance ops', category: 'automation' },
  { pattern: /\bschedul(e|ing)\b|\bcalendar\b|\bbooking\b/i, points: 12, tag: 'scheduling', category: 'automation' },
  { pattern: /\bcustomer (support|service)\b|\bhelp ?desk\b|\bchatbot\b/i, points: 16, tag: 'support', category: 'automation' },
  { pattern: /\bCRM\b|\blead (gen|generation|scoring)\b/i, points: 14, tag: 'crm', category: 'automation' },
  { pattern: /\bspreadsheets?\b|\bexcel\b|\bgoogle sheets\b/i, points: 12, tag: 'spreadsheets', category: 'automation' },
  { pattern: /\bmeeting notes\b|\btranscri(be|ption)\b|\bsummari[sz]e\b/i, points: 12, tag: 'notes', category: 'automation' },

  // Getting found and selling.
  { pattern: /\bSEO\b|\bsearch ranking\b|\bAI overviews?\b/i, points: 18, tag: 'seo', category: 'marketing' },
  { pattern: /\bcontent (creation|marketing|strategy)\b|\bcopywriting\b/i, points: 15, tag: 'content', category: 'marketing' },
  { pattern: /\bsocial media\b|\binstagram\b|\btiktok\b|\blinkedin\b|\byoutube\b/i, points: 12, tag: 'social', category: 'marketing' },
  { pattern: /\bemail marketing\b|\bnewsletters?\b/i, points: 13, tag: 'email', category: 'marketing' },
  { pattern: /\bads?\b|\badvertising\b|\bcampaigns?\b/i, points: 10, tag: 'ads', category: 'marketing' },
  { pattern: /\bimage generation\b|\bvideo generation\b|\btext.to.(image|video|speech)\b/i, points: 13, tag: 'generative media', category: 'marketing' },
  { pattern: /\bproduct photos?\b|\bthumbnails?\b|\bbrand(ing)?\b/i, points: 11, tag: 'creative', category: 'marketing' },
  { pattern: /\be.?commerce\b|\bshopify\b|\betsy\b|\bstorefront\b/i, points: 14, tag: 'ecommerce', category: 'marketing' },

  // Cost base.
  { pattern: /\bfree tier\b|\bfree plan\b|\bfree for\b|\bno cost\b/i, points: 22, tag: 'free tier', category: 'pricing' },
  // Loose about what sits between the verb and "prices" — headlines say
  // "cuts API prices by 40%", not "cuts prices". `lower` is deliberately
  // absent: as an adjective it matched commodity reporting ("Lower Oil
  // Prices"), which is not a vendor cutting what it charges you.
  { pattern: /\bprice cut\b|\bcheaper\b|\b(cuts?|slashe?s?|drops?|reduces?|lowered) (the )?(\w+ ){0,2}prices?\b|\bprice drop\b/i, points: 20, tag: 'price cut', category: 'pricing' },
  { pattern: /\bpric(ing|es?)\b|\bper (month|seat|user)\b|\bsubscription\b/i, points: 12, tag: 'pricing', category: 'pricing' },
  { pattern: /\brate limits?\b|\busage caps?\b|\bcredits?\b|\bquota\b/i, points: 11, tag: 'limits', category: 'pricing' },
  { pattern: /\bgeneral availability\b|\bnow available\b|\bpublic (beta|preview)\b|\bwaitlist\b/i, points: 14, tag: 'availability', category: 'tools' },

  // Obligations.
  { pattern: /\bEU AI Act\b|\bregulat(ion|ory|es)\b|\bcompliance\b/i, points: 14, tag: 'regulation', category: 'rules' },
  { pattern: /\bcopyright\b|\blicens(e|ing)\b|\bterms of service\b/i, points: 15, tag: 'copyright', category: 'rules' },
  { pattern: /\bdisclosure\b|\bwatermark(ing)?\b|\bAI.generated content\b/i, points: 13, tag: 'disclosure', category: 'rules' },
  { pattern: /\bprivacy\b|\bGDPR\b|\bdata protection\b|\byour data\b/i, points: 12, tag: 'privacy', category: 'rules' },
  { pattern: /\bscams?\b|\bfraud\b|\bdeepfakes?\b|\bphishing\b/i, points: 12, tag: 'fraud risk', category: 'rules' },
];

/** Language that signals "you can do this today", not "someday, at scale". */
const ACTIONABILITY_SIGNALS: Signal[] = [
  { pattern: /\bhow to\b|\bstep.by.step\b|\bguide\b|\btutorial\b/i, points: 14, tag: 'how-to' },
  { pattern: /\blaunch(es|ed)?\b|\bintroduc(es|ing)\b|\bunveil(s|ed)?\b|\broll(s|ed)? out\b/i, points: 11, tag: 'launch' },
  { pattern: /\bnow (supports?|lets?|works?)\b|\byou can now\b/i, points: 13, tag: 'shipped' },
  { pattern: /\bfree\b/i, points: 8, tag: 'free' },
  { pattern: /\btips?\b|\bbest practices\b|\bplaybook\b|\bchecklist\b/i, points: 10, tag: 'playbook' },
  { pattern: /\btry it\b|\bget started\b|\bsign up\b|\bdownload\b/i, points: 8, tag: 'try it' },
  { pattern: /\bcase stud(y|ies)\b|\bhow .{1,30} uses?\b/i, points: 9, tag: 'case study' },
];

/**
 * Industry news that reads as important but changes nothing for a small
 * operator on Monday morning.
 */
const NOISE_SIGNALS: Signal[] = [
  { pattern: /\braises? \$|\bseries [A-E]\b|\bfunding round\b|\bvaluation\b|\bIPO\b/i, points: -22, tag: 'funding' },
  { pattern: /\bacqui(res|red|sition)\b|\bmerger\b/i, points: -12, tag: 'm&a' },
  { pattern: /\bdata ?cent(er|re)s?\b|\bGPU cluster\b|\bchips?\b|\bsemiconductor\b|\bfab\b/i, points: -20, tag: 'infrastructure' },
  { pattern: /\bearnings\b|\bquarterly results\b|\bstock\b|\bshares? (rose|fell)\b/i, points: -18, tag: 'markets' },
  { pattern: /\bbenchmark(s|ing)?\b|\bSOTA\b|\bleaderboard\b|\bevals?\b/i, points: -14, tag: 'benchmarks' },
  { pattern: /\barxiv\b|\bpaper\b|\bresearchers? (find|say|propose)\b|\bstudy finds\b/i, points: -14, tag: 'research' },
  { pattern: /\bhires?\b|\bpoach(es|ed)\b|\bsteps down\b|\bappoints?\b|\bCEO\b/i, points: -12, tag: 'personnel' },
  { pattern: /\blayoffs?\b|\bjob cuts\b/i, points: -10, tag: 'layoffs' },
  { pattern: /\benterprise.grade\b|\bfortune 500\b|\bat scale\b/i, points: -12, tag: 'enterprise' },
  { pattern: /\bgovernment\b|\bmilitary\b|\bdefen[cs]e contract\b|\bnational security\b/i, points: -14, tag: 'government' },
  { pattern: /\bAGI\b|\bsuperintelligence\b|\bexistential\b|\bdoom\b/i, points: -16, tag: 'speculation' },
  // Macro commodity and trade reporting reads as cost news but is not a
  // vendor decision a small business can respond to.
  { pattern: /\b(crude )?oil prices?\b|\bgas(oline)? prices?\b|\bfuel costs?\b|\bcommodit(y|ies)\b|\btariffs?\b|\benergy trade\b|\binflation\b/i, points: -18, tag: 'commodities' },
  { pattern: /\bsues?\b|\blawsuit\b|\bantitrust\b/i, points: -8, tag: 'litigation' },
];

const TITLE_MULTIPLIER = 1.6;
const HALF_LIFE_HOURS = 30;
/**
 * Raw points at which the 0-100 curve reaches ~63. Tuned so a story with one
 * strong audience match plus a launch verb lands in the 60s, and a story that
 * stacks audience + automation + free-tier signals lands in the 90s.
 */
const SATURATION = 110;

function scoreAgainst(text: string, signals: Signal[]) {
  let points = 0;
  const tags: string[] = [];
  const categoryVotes = new Map<CategoryId, number>();

  for (const signal of signals) {
    if (!signal.pattern.test(text)) continue;
    points += signal.points;
    tags.push(signal.tag);
    if (signal.category) {
      categoryVotes.set(
        signal.category,
        (categoryVotes.get(signal.category) ?? 0) + Math.abs(signal.points),
      );
    }
  }

  return { points, tags, categoryVotes };
}

/** Exponential decay so a two-day-old story cannot outrank this morning's. */
export function freshnessPoints(publishedAt: string | null, now: Date): number {
  if (!publishedAt) return 4;
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return 4;

  const ageHours = Math.max(0, (now.getTime() - published) / 3_600_000);
  return 18 * Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
}

export interface Assessment {
  score: number;
  breakdown: ScoreBreakdown;
  category: CategoryId;
  tags: string[];
}

export function assess(
  item: RawItem,
  sourceWeight: number,
  now: Date = new Date(),
): Assessment {
  const title = item.title ?? '';
  const body = item.description ?? '';

  // The title is weighted more heavily: a term in the headline is what the
  // piece is about, the same term in paragraph four is an aside.
  const titleRelevance = scoreAgainst(title, RELEVANCE_SIGNALS);
  const bodyRelevance = scoreAgainst(body, RELEVANCE_SIGNALS);
  const titleAction = scoreAgainst(title, ACTIONABILITY_SIGNALS);
  const bodyAction = scoreAgainst(body, ACTIONABILITY_SIGNALS);
  const titleNoise = scoreAgainst(title, NOISE_SIGNALS);
  const bodyNoise = scoreAgainst(body, NOISE_SIGNALS);

  const relevance =
    titleRelevance.points * TITLE_MULTIPLIER + bodyRelevance.points;
  const actionability =
    titleAction.points * TITLE_MULTIPLIER + bodyAction.points;
  const noise = titleNoise.points * TITLE_MULTIPLIER + bodyNoise.points;
  const freshness = freshnessPoints(item.publishedAt, now);

  // Positive signals stack linearly in the raw sum, so a story that mentions
  // eight relevant things would otherwise peg the scale and lose all ordering
  // against the next such story. Saturating exponentially keeps the whole
  // range discriminating: differences at the top compress but never vanish.
  const positive = (relevance + actionability + freshness) * sourceWeight;
  const net = Math.max(0, positive - Math.abs(noise));
  const score = Math.round(100 * (1 - Math.exp(-net / SATURATION)));

  const categoryVotes = new Map<CategoryId, number>();
  for (const votes of [titleRelevance.categoryVotes, bodyRelevance.categoryVotes]) {
    for (const [category, weight] of votes) {
      categoryVotes.set(category, (categoryVotes.get(category) ?? 0) + weight);
    }
  }

  const category =
    [...categoryVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'strategy';

  const tags = [
    ...new Set([
      ...titleRelevance.tags,
      ...bodyRelevance.tags,
      ...titleAction.tags,
      ...bodyAction.tags,
    ]),
  ].slice(0, 6);

  return {
    score,
    breakdown: {
      relevance: Math.round(relevance),
      actionability: Math.round(actionability),
      noise: Math.round(noise),
      freshness: Math.round(freshness),
      sourceWeight,
    },
    category,
    tags,
  };
}

/** Below this, an item is industry chatter rather than something to act on. */
export const SCORE_THRESHOLD = 22;

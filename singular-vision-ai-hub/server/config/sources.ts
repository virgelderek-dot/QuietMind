import type { Category, FeedSource } from '../types';

/**
 * Public RSS/Atom feeds. No API keys required.
 *
 * Every URL here has been confirmed to fetch and parse in a real run. Three
 * were removed after the first live run rather than left to fail silently:
 * Anthropic (404), Microsoft AI (410 Gone), and Indie Hackers (its feed
 * nests deeply enough to exceed the XML parser's limit). Candidates are worth
 * adding back only once a run confirms the URL — an unverified feed URL is a
 * guess, and it shows up as a daily error in the page footer.
 *
 * `weight` nudges a whole outlet up or down. Outlets that mostly cover
 * enterprise procurement and funding get < 1.0; outlets that cover
 * shipping-today tooling get > 1.0.
 */
export const SOURCES: FeedSource[] = [
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    angle: 'Product launches and pricing moves, ahead of most outlets.',
    weight: 1.0,
  },
  {
    id: 'verge-ai',
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    angle: 'Consumer-facing AI features you can use the day they ship.',
    weight: 1.05,
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    angle: 'Tooling and workflow coverage with practical detail.',
    weight: 0.95,
  },
  {
    id: 'arstechnica-ai',
    name: 'Ars Technica AI',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    angle: 'Sober takes; good for separating hype from usable capability.',
    weight: 0.95,
  },
  {
    id: 'openai-blog',
    name: 'OpenAI',
    url: 'https://openai.com/blog/rss.xml',
    angle: 'First-party announcements: model access, pricing, limits.',
    weight: 1.15,
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI',
    url: 'https://blog.google/technology/ai/rss/',
    angle: 'Workspace and Gemini changes that hit everyday business tools.',
    weight: 1.1,
  },
  {
    id: 'huggingface-blog',
    name: 'Hugging Face',
    url: 'https://huggingface.co/blog/feed.xml',
    angle: 'Open models and free-to-run tooling; strong on cost-cutting.',
    weight: 1.0,
  },
  {
    id: 'zapier-blog',
    name: 'Zapier Blog',
    url: 'https://zapier.com/blog/feeds/latest/',
    angle: 'Automation recipes aimed squarely at small teams.',
    weight: 1.2,
  },
  {
    id: 'smallbiztrends',
    name: 'Small Business Trends',
    url: 'https://smallbiztrends.com/feed',
    angle: 'Explicit small-business framing on new technology.',
    weight: 1.2,
  },
  {
    id: 'ben-evans',
    name: "Benedict Evans",
    url: 'https://www.ben-evans.com/benedictevans?format=rss',
    angle: 'Strategy framing; useful for deciding what to ignore.',
    weight: 0.9,
  },
  {
    id: 'ai-business',
    name: 'AI Business',
    url: 'https://aibusiness.com/rss.xml',
    angle: 'Adoption and regulation coverage with business framing.',
    weight: 0.95,
  },
];

export const CATEGORIES: Category[] = [
  {
    id: 'tools',
    label: 'Tools & Launches',
    blurb: 'New or updated software you could actually adopt this week.',
  },
  {
    id: 'automation',
    label: 'Automate Your Ops',
    blurb: 'Ways to take repeat admin work off your plate.',
  },
  {
    id: 'marketing',
    label: 'Marketing & Content',
    blurb: 'Getting found, writing faster, producing more without a team.',
  },
  {
    id: 'pricing',
    label: 'Pricing & Access',
    blurb: 'Free tiers, price cuts, and limits that change your cost base.',
  },
  {
    id: 'rules',
    label: 'Rules & Risk',
    blurb: 'Compliance, copyright, and disclosure obligations.',
  },
  {
    id: 'strategy',
    label: 'Strategy & Trends',
    blurb: 'Slower-moving shifts worth steering toward.',
  },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
);

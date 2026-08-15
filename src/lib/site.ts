/**
 * One place for anything that appears in more than one file.
 *
 * The tool list drives the home page, the sitemap and the header, so adding a
 * tool means adding one entry here and one route. Keeping the sitemap derived
 * rather than hand written is deliberate: a hand listed sitemap goes stale
 * silently, and a page search engines never see is indistinguishable from a
 * page that does not exist.
 */

export const SITE = {
  name: 'Vantly',
  url: 'https://vantly.xyz',
  tagline: 'Small tools that do one thing, without asking for anything.',
} as const;

export type Tool = {
  slug: string;
  name: string;
  /** Shown on the card. One line, says what goes in and what comes out. */
  blurb: string;
  /** The <title> and h1. Written for what somebody actually types in. */
  title: string;
  description: string;
  /** False until the route exists, so the sitemap never lists a 404. */
  live: boolean;
};

export const TOOLS: Tool[] = [
  {
    slug: 'svg-to-png',
    name: 'SVG to PNG',
    blurb: 'Turn a vector file into a sharp PNG at any size, up to 8K.',
    title: 'SVG to PNG converter, up to 8K with transparency',
    description:
      'Convert SVG to PNG at any resolution, including 4K and 8K, with a transparent background. No resolution cap, no watermark, no sign up. Runs in your browser, so the file never leaves your machine.',
    live: true,
  },
  {
    slug: 'heic-to-jpg',
    name: 'HEIC to JPG',
    blurb: 'Open iPhone photos anywhere. Convert to JPG or WebP in bulk.',
    title: 'HEIC to JPG and WebP converter',
    description:
      'Convert iPhone HEIC photos to JPG or WebP. Bulk conversion, no file limit, no sign up. Runs in your browser.',
    live: false,
  },
];

export const LIVE_TOOLS = TOOLS.filter((t) => t.live);

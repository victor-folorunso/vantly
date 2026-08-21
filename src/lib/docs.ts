import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { toolBySlug, type Category, type Tool } from './site';
import {
  CONVERSION_BY_SLUG,
  canvasHandles,
  conversionDescription,
  conversionTitle,
  dataHandles,
  docHandles,
  mediaHandles,
  type Conversion,
} from './conversions';

/**
 * The documentation, one file per tool, rendered on the tool's own page.
 *
 * The first version gave every article its own URL under /learn. That is the
 * textbook answer, one page per intent, and it is the wrong answer for a domain
 * with no authority yet: it splits the links, the traffic and the relevance
 * between two weak pages instead of concentrating them into one that might
 * actually rank. Every converter site that ranks, iLoveIMG and Smallpdf and the
 * rest, puts the tool at the top and the explanation below it on one URL.
 *
 * So the doc renders on /<tool>, well below the interface, and /learn is an
 * index of titles and summaries rather than a second copy of the text.
 * Duplicating the body across both would put the two pages in competition and
 * neither would win.
 *
 * The filename is the tool slug. That is the whole routing contract, so a doc
 * cannot point at a tool that does not exist or drift out of sync with one.
 *
 * Server only. This is a static export, so every read happens at build time.
 */

const DIR = join(process.cwd(), 'src/content/docs');

export type Doc = {
  /** The tool this documents. Taken from the filename. */
  tool: Tool;
  title: string;
  description: string;
  keywords: string[];
  updated: string;
  html: string;
  minutes: number;
  draft: boolean;
};

/**
 * YAML turns an unquoted 2026-08-15 into a Date, and String() on that gives
 * "Fri Aug 14 2026 19:00:00 GMT-0500": wrong format, and a day early west of
 * UTC. Normalised here so the sitemap cannot inherit either problem.
 */
function isoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

/**
 * A conversion, described in the shape a doc needs.
 *
 * Conversion pages are the majority of the site and had no docs at all, which
 * left most of it as a heading, a drop zone and nothing else. They are not in
 * the tools list because they are generated from format pairs, so a doc named
 * after one is turned into the same shape here rather than the rest of the
 * site learning about a second kind of subject.
 *
 * The category comes from whichever handler serves the pair, so it cannot
 * drift away from the code that actually runs.
 */
function asSubject(c: Conversion): Tool {
  const category: Category = canvasHandles(c)
    ? 'Images'
    : dataHandles(c)
      ? 'Data'
      : mediaHandles(c)
        ? 'Media'
        : docHandles(c)
          ? 'Documents'
          : 'Documents';

  return {
    slug: c.slug,
    name: `${c.from.label} to ${c.to.label}`,
    category,
    blurb: conversionDescription(c),
    title: conversionTitle(c),
    description: conversionDescription(c),
    live: c.live,
  };
}

function parse(file: string): Doc | null {
  const slug = file.replace(/\.md$/, '');
  const conversion = CONVERSION_BY_SLUG.get(slug);
  const tool = toolBySlug(slug) ?? (conversion ? asSubject(conversion) : undefined);
  // A doc for something that no longer exists is dropped rather than rendered
  // somewhere odd. check-docs turns this into a build failure.
  if (!tool) return null;

  const { data, content } = matter(readFileSync(join(DIR, file), 'utf8'));
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    tool,
    title: String(data.title ?? tool.name),
    description: String(data.description ?? ''),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    updated: isoDate(data.updated),
    html: marked.parse(content, { async: false }) as string,
    minutes: Math.max(1, Math.round(words / 220)),
    draft: data.draft === true || data.draft === 'true',
  };
}

export function allDocs(): Doc[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    // A leading underscore marks a working note rather than a doc, so the
    // folder can hold notes without them needing to be a tool slug.
    .filter((f) => f.endsWith('.md') && f !== 'CONTRIBUTING.md' && !f.startsWith('_'))
    .map(parse)
    .filter((d): d is Doc => d !== null)
    /* Drafts are stubs waiting for a writer. Excluded here rather than at each
       call site, so an unwritten one cannot reach a page by being forgotten in
       a single place. */
    .filter((d) => !d.draft)
    .sort((a, b) => a.tool.name.localeCompare(b.tool.name));
}

/** The doc for one tool, or nothing. */
export function docForTool(slug: string): Doc | undefined {
  return allDocs().find((d) => d.tool.slug === slug);
}

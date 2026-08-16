import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { toolBySlug, type Tool } from './site';

/**
 * The /learn articles, read from markdown at build time.
 *
 * Separate pages rather than one long blog, because Google ranks pages and a
 * single page can only satisfy one intent. Somebody searching "why will my
 * iPhone photos not open" and somebody searching "webp or jpg" want different
 * answers, and one article cannot be the best result for both.
 *
 * Kept apart from the tool pages for the same reason in reverse. A person
 * typing "heic to jpg" wants the converter, not an essay, so the essay lives
 * somewhere else and the two link to each other.
 *
 * Called only from server components. The site is a static export, so every one
 * of these reads happens at build time and none of it ships to the browser.
 */

const DIR = join(process.cwd(), 'src/content/learn');

export type Article = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  updated: string;
  /** The tool this article exists to support. */
  tool: Tool | null;
  html: string;
  minutes: number;
};

/**
 * The frontmatter date, always as YYYY-MM-DD.
 *
 * YAML turns an unquoted `2026-08-15` into a Date object rather than leaving it
 * a string, so String() on it gave "Fri Aug 14 2026 19:00:00 GMT-0500". That
 * went into the sitemap as an invalid lastmod, and a day early, because the
 * date was read as local midnight on a machine west of UTC.
 */
function isoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function parse(file: string): Article {
  const slug = file.replace(/\.md$/, '');
  const raw = readFileSync(join(DIR, file), 'utf8');
  const { data, content } = matter(raw);

  const words = content.trim().split(/\s+/).length;

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    updated: isoDate(data.updated),
    tool: data.tool ? (toolBySlug(String(data.tool)) ?? null) : null,
    html: marked.parse(content, { async: false }) as string,
    // 220wpm rather than the usual 200. These are short and scanned, not read.
    minutes: Math.max(1, Math.round(words / 220)),
  };
}

export function allArticles(): Article[] {
  let files: string[];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'CONTRIBUTING.md');
  } catch {
    return [];
  }
  // Newest first. The date is in the frontmatter rather than the filename so a
  // rewrite can update it without changing the URL.
  return files.map(parse).sort((a, b) => b.updated.localeCompare(a.updated));
}

export function articleBySlug(slug: string): Article | undefined {
  return allArticles().find((a) => a.slug === slug);
}

/** Articles written to support a given tool, for the link on its page. */
export function articlesForTool(toolSlug: string): Article[] {
  return allArticles().filter((a) => a.tool?.slug === toolSlug);
}

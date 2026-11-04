import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { toolBySlug, type Tool } from './site';

/**
 * Guides: articles that answer a question of their own, at /learn/<slug>.
 *
 * Docs live on the tool page, one per tool, and docs.ts explains why: a new
 * domain should not split a tool's ranking across two weak pages. A guide is
 * the exception that rule leaves room for. "How do I read tonic solfa on the
 * keyboard" is not a question about the song to solfa tool, and nobody
 * searching it wants an upload box first. Putting it under the tool would
 * bury it; giving it its own URL lets it rank for its own query and link into
 * the tool.
 *
 * So the test for a guide rather than a doc: would the article still be worth
 * reading if the tool did not exist? If not, it belongs in the tool's doc.
 *
 * Each guide names the tool it leads to, which decides its category on /learn
 * and the call to action at its foot. Server only, read at build time.
 */

const DIR = join(process.cwd(), 'src/content/guides');

export type Guide = {
  slug: string;
  title: string;
  description: string;
  /** The opening paragraph, set larger under the title. */
  lede: string;
  keywords: string[];
  updated: string;
  /** The tool the guide leads to. */
  tool: Tool;
  html: string;
  minutes: number;
};

function isoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function parse(file: string): Guide | null {
  const { data, content } = matter(readFileSync(join(DIR, file), 'utf8'));
  const tool = toolBySlug(String(data.tool ?? ''));
  // check-docs turns a guide pointing at nothing into a build failure.
  if (!tool) return null;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return {
    slug: file.replace(/\.md$/, ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    lede: String(data.lede ?? ''),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    updated: isoDate(data.updated),
    tool,
    html: marked.parse(content, { async: false }) as string,
    minutes: Math.max(1, Math.round(words / 220)),
  };
}

export function allGuides(): Guide[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map(parse)
    .filter((g): g is Guide => g !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function guideBySlug(slug: string): Guide | undefined {
  return allGuides().find((g) => g.slug === slug);
}

/** The guides that lead to one tool, for the tool page to link back. */
export function guidesForTool(slug: string): Guide[] {
  return allGuides().filter((g) => g.tool.slug === slug);
}

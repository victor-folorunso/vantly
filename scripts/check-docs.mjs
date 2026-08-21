/**
 * Refuses to build a doc that would break something.
 *
 * The filename is the whole routing contract: docs/<tool-slug>.md renders on
 * /<tool-slug>. A file named after a tool that does not exist renders nowhere
 * and fails silently, which is exactly the class of thing worth a build error.
 *
 * Voice is not checkable and is not attempted, with one exception. Em dashes
 * are banned outright and are the most reliable sign a draft came out of a
 * model without being read, so they fail the build.
 *
 * Run: npm run docs:check
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(root, 'src/content/docs');

const { TOOLS } = await import(pathToFileURL(join(root, 'src/lib/site.ts')).href);
const { CONVERSIONS } = await import(pathToFileURL(join(root, 'src/lib/conversions.ts')).href);

/* A doc can belong to a tool or to a conversion pair. Conversions are the
   majority of the site's pages and had nothing below the drop zone, so they
   are a valid subject too. Either way the filename has to name something that
   exists, which is the point of this check. */
const bySlug = new Map([
  ...TOOLS.map((t) => [t.slug, t]),
  ...CONVERSIONS.map((c) => [c.slug, c]),
]);

if (!existsSync(DIR)) {
  console.log('No src/content/docs yet, nothing to check.');
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'CONTRIBUTING.md');
const problems = [];
let drafts = 0;

/** Enough frontmatter parsing for a flat block of scalars and one list. */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const at = t.indexOf(':');
    if (at < 0) continue;
    const key = t.slice(0, at).trim();
    let value = t.slice(at + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      out[key] = value.replace(/^["']|["']$/g, '');
    }
  }
  return { data: out, body: raw.slice(m[0].length) };
}

for (const file of files) {
  const raw = readFileSync(join(DIR, file), 'utf8');
  const where = `docs/${file}`;
  const slug = file.replace(/\.md$/, '');

  const tool = bySlug.get(slug);
  if (!tool) {
    problems.push(
      `${where}: nothing called "${slug}" exists. The filename must be a tool slug or a conversion slug.`,
    );
    continue;
  }

  /* Internal links, checked against the registry.
     A doc written months after the tool it points at can outlive it. The text
     cleaner was split into one page per job and a doc still linked the old
     slug, which is a 404 sitting inside advice about how to do something. A
     link to a tool that exists but is not built yet is a different problem
     and worth naming separately: it is not broken, it just sends the reader
     to a coming soon notice. */
  for (const [, target] of raw.matchAll(/\]\((\/[a-z0-9-]+)\)/g)) {
    const linked = bySlug.get(target.slice(1));
    if (!linked) {
      problems.push(`${where}: links to ${target}, which does not exist.`);
    } else if (linked.live === false) {
      problems.push(`${where}: links to ${target}, which is not built yet.`);
    }
  }
  if (!tool.live) {
    problems.push(`${where}: ${slug} is not live, so this doc renders nowhere.`);
  }

  const parsed = frontmatter(raw);
  if (!parsed) {
    problems.push(`${where}: no frontmatter. The file must start with --- on line 1.`);
    continue;
  }
  const { data, body } = parsed;

  for (const field of ['title', 'description', 'updated']) {
    if (!data[field]) problems.push(`${where}: missing "${field}".`);
  }
  if (data.updated && Number.isNaN(Date.parse(data.updated))) {
    problems.push(`${where}: updated "${data.updated}" is not a date. Use YYYY-MM-DD.`);
  }
  if (data.description && data.description.length > 165) {
    problems.push(`${where}: description is ${data.description.length} characters. Google cuts it near 160.`);
  }
  if (raw.includes('\u2014')) {
    problems.push(`${where}: contains an em dash. Use a comma or a full stop.`);
  }

  /* A draft is a stub waiting for a writer. The filename still has to be right,
     because that is what breaks routing, but length rules are meaningless until
     somebody writes something. Drafts never reach a page. */
  if (data.draft === 'true' || data.draft === true) { drafts++; continue; }

  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 400) {
    problems.push(`${where}: ${words} words. Under 400 is too thin to be worth the space.`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
  for (const p of problems) console.error('  ' + p);
  console.error('');
  process.exit(1);
}

const written = files.length - drafts;
console.log(`docs: ${written} published, ${drafts} draft${drafts === 1 ? '' : 's'} waiting, all valid.`);

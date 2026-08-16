/**
 * Refuses to build an article that would break something.
 *
 * The frontmatter carries two locked fields, and both fail quietly if wrong: a
 * mismatched slug produces a page nobody can reach, and a bad tool reference
 * points the reader at the wrong tool or drops the link entirely. Neither
 * errors at runtime, which is exactly the class of bug worth a build failure.
 *
 * The voice rules are not checkable and are not attempted here, with one
 * exception. Em dashes are banned outright and are the single most reliable
 * sign a draft came out of a model without being read, so they fail the build.
 *
 * Run: npm run learn:check
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(root, 'src/content/learn');

const { TOOLS } = await import(pathToFileURL(join(root, 'src/lib/site.ts')).href);
const toolSlugs = new Set(TOOLS.map((t) => t.slug));

if (!existsSync(DIR)) {
  console.log('No src/content/learn yet, nothing to check.');
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'CONTRIBUTING.md');
const problems = [];

/** Enough frontmatter parsing for a flat block of scalars and one list. */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf(':');
    if (at < 0) continue;
    const key = trimmed.slice(0, at).trim();
    let value = trimmed.slice(at + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      out[key] = value.replace(/^["']|["']$/g, '');
    }
  }
  return { data: out, body: raw.slice(m[0].length) };
}

for (const file of files) {
  const raw = readFileSync(join(DIR, file), 'utf8');
  const parsed = frontmatter(raw);
  const where = `learn/${file}`;

  if (!parsed) {
    problems.push(`${where}: no frontmatter block. It must start with --- on line 1.`);
    continue;
  }
  const { data, body } = parsed;

  for (const field of ['slug', 'tool', 'updated', 'title', 'description']) {
    if (!data[field]) problems.push(`${where}: missing "${field}".`);
  }

  const expected = file.replace(/\.md$/, '');
  if (data.slug && data.slug !== expected) {
    problems.push(`${where}: slug is "${data.slug}" but the filename says "${expected}".`);
  }

  if (data.tool && !toolSlugs.has(data.tool)) {
    problems.push(`${where}: tool "${data.tool}" is not in src/lib/site.ts.`);
  }

  if (data.updated && Number.isNaN(Date.parse(data.updated))) {
    problems.push(`${where}: updated "${data.updated}" is not a date. Use YYYY-MM-DD.`);
  }

  if (data.description && data.description.length > 165) {
    problems.push(
      `${where}: description is ${data.description.length} characters. Google cuts it around 160.`,
    );
  }

  if (raw.includes('—')) {
    problems.push(`${where}: contains an em dash. Use a comma or a full stop.`);
  }

  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 400) {
    problems.push(`${where}: ${words} words. Under 400 is too thin to rank and drags the rest down.`);
  }

  // A page that never links its tool wastes the only conversion it had.
  if (data.tool && !body.includes(`/${data.tool}`)) {
    problems.push(`${where}: never links to /${data.tool}. Link it once, where it is the answer.`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
  for (const p of problems) console.error('  ' + p);
  console.error('');
  process.exit(1);
}

console.log(`learn: ${files.length} article${files.length === 1 ? '' : 's'}, all valid.`);

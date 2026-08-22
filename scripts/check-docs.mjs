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
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
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

// A leading underscore marks a working note rather than a doc. The loader
// skips those too, and the two have to agree.
const files = readdirSync(DIR).filter(
  (f) => f.endsWith('.md') && f !== 'CONTRIBUTING.md' && !f.startsWith('_'),
);
const problems = [];
let drafts = 0;

/**
 * Parses frontmatter with the same library the site uses.
 *
 * This used to be a hand rolled parser: split on the first colon, split lists
 * on commas, strip quotes. Lenient, never threw, and therefore useless as a
 * check. It passed a doc whose keywords contained an unquoted %20, which is a
 * reserved indicator in YAML, and the build then failed on six pages while the
 * checker reported everything valid.
 *
 * Two parsers with different rules for the same file is the bug. There is one
 * now, and it is the one that decides whether the site builds.
 */
function frontmatter(raw) {
  try {
    const parsed = matter(raw);
    return { data: parsed.data, body: parsed.content };
  } catch (e) {
    // The first line is the useful part. A YAML error then prints the
    // offending line and a caret under it, which is noise in a summary.
    const message = String(e instanceof Error ? e.message : e);
    return { error: message.split(/\r?\n/)[0] };
  }
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
  if (parsed?.error) {
    problems.push(`${where}: the frontmatter is not valid YAML. ${parsed.error}`);
    continue;
  }
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

/**
 * Warns when a doc that already existed has been replaced rather than edited.
 *
 * Twice now a doc has been written for a tool that already had one, and the
 * file was overwritten in place. Nothing failed: the build stayed green, this
 * checker passed, and the only clue was the published count rising by less
 * than the number of docs written. Both times the version destroyed was the
 * better one.
 *
 * There is a gap report to consult first, and it only helps if it gets run.
 * This does not depend on anybody remembering.
 */
function rewrites() {
  let numstat = "";
  try {
    numstat = execSync("git diff --numstat -- src/content/docs", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return [];
  }

  const found = [];
  for (const line of numstat.split(/\r?\n/)) {
    const [, removed, path] = line.split("\t");
    if (!path || !path.endsWith(".md")) continue;
    const gone = Number(removed);
    if (!Number.isFinite(gone)) continue;

    let committed = 0;
    try {
      committed = execSync("git show HEAD:" + path, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).split(/\r?\n/).length;
    } catch {
      continue;
    }

    // Most of the committed doc gone, and a similar amount arrived.
    // Deletions are the signal on their own. Requiring a similar number of
    // additions was wrong: a replacement can be shorter than what it
    // destroys, and that version of this check sat here doing nothing.
    if (committed > 20 && gone > committed * 0.5) {
      found.push(path + ": " + gone + " of " + committed + " lines replaced. This looks like a rewrite of a doc that already existed. Run npm run docs:gaps before writing.");
    }
  }
  return found;
}

const rewritten = rewrites();
if (rewritten.length) {
  console.error("");
  console.error(rewritten.length + " doc(s) rewritten in place:");
  console.error("");
  for (const r of rewritten) console.error("  " + r);
  console.error("");
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
  for (const p of problems) console.error('  ' + p);
  console.error('');
  process.exit(1);
}

const written = files.length - drafts;
console.log(`docs: ${written} published, ${drafts} draft${drafts === 1 ? '' : 's'} waiting, all valid.`);

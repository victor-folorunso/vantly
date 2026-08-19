/**
 * Creates a stub article with correct frontmatter.
 *
 * The two locked fields are the ones that fail quietly when wrong: a slug that
 * does not match its filename makes a page nobody can reach, and a bad tool
 * reference either drops the link or points at the wrong tool. Neither errors
 * at runtime. Generating them removes the chance to get either wrong by hand.
 *
 * The body is left as a brief rather than as filler, because a stub full of
 * plausible sentences is worse than an empty one: it reads as finished and
 * nobody rewrites it.
 *
 * Run: npm run learn:new <slug> <tool-slug> "The title as a question"
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, tool, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ');

if (!slug || !tool || !title) {
  console.error('Usage: npm run learn:new <slug> <tool-slug> "Title as a question"');
  process.exit(1);
}

const { TOOLS } = await import(pathToFileURL(join(root, 'src/lib/site.ts')).href);
const found = TOOLS.find((t) => t.slug === tool);
if (!found) {
  console.error(`No tool "${tool}" in src/lib/site.ts.`);
  console.error('Live tools: ' + TOOLS.filter((t) => t.live).map((t) => t.slug).join(', '));
  process.exit(1);
}

const file = join(root, 'src/content/learn', `${slug}.md`);
if (existsSync(file)) {
  console.error(`${slug}.md already exists.`);
  process.exit(1);
}

// Today, as YYYY-MM-DD, quoted so YAML keeps it a string rather than turning it
// into a Date. An unquoted date parses to a Date object and String() on it
// produces a JS date string, which is how the sitemap ended up with an invalid
// lastmod a day early.
const today = new Date().toISOString().slice(0, 10);

writeFileSync(
  file,
  `---
# ── LOCKED. Do not change these. ──────────────────────────────────────────
slug: ${slug}
tool: ${tool}
updated: "${today}"

# ── EDITABLE. Yours. ──────────────────────────────────────────────────────
title: ${title}
description: One or two sentences under 160 characters. Say what the answer is, not what the article covers.
keywords: []

# Remove this line when the article is written. Drafts are not built or indexed.
draft: true
---

<!--
  Write the article here and delete this comment.

  Read src/content/learn/CONTRIBUTING.md first. The rules that get broken most:
  no em dashes, no tricolons, use contractions, answer in the first paragraph,
  800 to 1500 words, and link /${tool} exactly once where it is the answer.

  npm run learn:check refuses anything under 400 words, an over long
  description, a missing tool link, or an em dash.
-->
`,
  'utf8',
);

console.log(`created src/content/learn/${slug}.md  ->  /learn/${slug}  (tool: /${tool})`);

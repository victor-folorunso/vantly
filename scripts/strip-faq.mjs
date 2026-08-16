/**
 * Removes the FAQ block from every tool page.
 *
 * They were added on the theory that FAQPage schema helps a page rank. Google
 * stopped showing FAQ rich results for most sites in 2023, so what is left is
 * five thin paragraphs sitting between the tool and the bottom of the page,
 * repeated across forty pages, answering a question nobody asked there.
 * Informational content lives at /learn now, one article per question.
 *
 * Two things this had to learn the hard way.
 *
 * The FAQPage object inside the JSON-LD is nested, and a regex for it cut in
 * the wrong place on 19 of 28 files. Balanced literals need counting, not
 * matching, so it is brace matched.
 *
 * These files are checked out CRLF on Windows. Every pattern here anchors on a
 * bare newline, so the stray carriage return made the section match fail
 * silently and left pages referencing a constant that had already been deleted.
 * Input is normalised on the way in.
 *
 * Run once: node --experimental-strip-types scripts/strip-faq.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === 'page.tsx') acc.push(full);
  }
  return acc;
}

/** Walk outward from `index` to the object literal containing it. */
function objectAround(src, index) {
  let start = index;
  let depth = 0;
  while (start >= 0) {
    const ch = src[start];
    if (ch === '}') depth++;
    else if (ch === '{') {
      if (depth === 0) break;
      depth--;
    }
    start--;
  }
  if (start < 0) return null;

  let end = start;
  depth = 0;
  while (end < src.length) {
    const ch = src[end];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    end++;
  }
  return end >= src.length ? null : { start, end: end + 1 };
}

/** Remove a `const NAME = [ ... ];` declaration by matching its brackets. */
function removeArrayConst(src, name) {
  const at = src.indexOf(`const ${name} = [`);
  if (at < 0) return src;
  let i = src.indexOf('[', at);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  const end = src.indexOf(';', i) + 1;
  return src.slice(0, at) + src.slice(end).replace(/^\n+/, '\n');
}

let changed = 0;
const failed = [];

for (const file of walk(join(root, 'src/app'))) {
  let src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  if (!src.includes('const FAQ')) continue;
  const slug = basename(dirname(file));

  // 1. The FAQPage object inside the structured data.
  const faqType = src.indexOf("'@type': 'FAQPage'");
  if (faqType > -1) {
    const span = objectAround(src, faqType);
    if (!span) {
      failed.push(`${slug}: could not bracket the FAQPage object`);
      continue;
    }
    let { start, end } = span;
    // Swallow a neighbouring comma so the surrounding array stays valid.
    while (end < src.length && /[\s,]/.test(src[end])) end++;
    while (start > 0 && /\s/.test(src[start - 1])) start--;
    if (src[start - 1] === ',') start--;
    src = src.slice(0, start) + src.slice(end);
  }

  // 2. A separate faqSchema constant, where the page used one.
  src = src.replace(/\nconst faqSchema = \{[\s\S]*?\n\};\n/, '\n');
  src = src.replace(/\[schema, faqSchema\]/, 'schema');

  // 3. The rendered section.
  src = src.replace(/\n[ \t]*<section className="mt-20 max-w-2xl">[\s\S]*?<\/section>\n/, '\n');

  // 4. The data itself.
  src = removeArrayConst(src, 'FAQ');

  // A one entry array reads better unwrapped.
  src = src.replace(/JSON\.stringify\(\[\s*(\{[\s\S]*?\})\s*\]\)/, 'JSON.stringify($1)');

  if (src.includes('FAQ')) {
    failed.push(`${slug}: still references FAQ after the cut`);
    continue;
  }

  // 5. The replacement.
  if (!src.includes('LearnLink')) {
    src = src.replace(
      /^(import [^\n]*\n)(?![\s\S]*^import )/m,
      `$1import LearnLink from '@/components/LearnLink';\n`,
    );
    const marker = /\n([ \t]*)<\/div>\n([ \t]*)(<\/>\n[ \t]*\);|\);)/;
    if (!marker.test(src)) {
      failed.push(`${slug}: nowhere obvious to put LearnLink`);
      continue;
    }
    src = src.replace(marker, `\n$1  <LearnLink tool="${slug}" />\n$1</div>\n$2$3`);
  }

  writeFileSync(file, src, 'utf8');
  changed++;
}

console.log(`stripped FAQ from ${changed} pages`);
if (failed.length) {
  console.error(`\n${failed.length} left alone:`);
  for (const f of failed) console.error('  ' + f);
}

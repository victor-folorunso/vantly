/**
 * Reads the built HTML and reports what search engines will actually see.
 *
 * Deliberately runs against out/ rather than the source. Metadata in Next comes
 * from several places at once, a page can inherit a title it never declared,
 * and the only honest answer is what ends up in the file.
 *
 * Run: npm run seo
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'out');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === 'index.html') acc.push(full);
  }
  return acc;
}

const pick = (html, re) => (html.match(re) ?? [, ''])[1] ?? '';

const pages = walk(OUT).map((file) => {
  const html = readFileSync(file, 'utf8');
  const url = '/' + relative(OUT, file).replace(/\\/g, '/').replace(/index\.html$/, '');
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

  return {
    url: url === '/' ? '/' : url.replace(/\/$/, ''),
    title: pick(html, /<title>([^<]*)<\/title>/),
    description: pick(html, /<meta name="description" content="([^"]*)"/),
    canonical: pick(html, /<link rel="canonical" href="([^"]*)"/),
    robots: pick(html, /<meta name="robots" content="([^"]*)"/),
    og: /property="og:title"/.test(html),
    schema: (html.match(/application\/ld\+json/g) ?? []).length,
    h1s: (body.match(/<h1[^>]*>/g) ?? []).length,
    words: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length,
  };
});

const indexable = pages.filter((p) => !p.robots.includes('noindex'));
const problems = [];

for (const p of pages) {
  const noindex = p.robots.includes('noindex');

  if (!p.title) problems.push(['no title', p.url]);
  else if (p.title.length > 60) problems.push([`title ${p.title.length} chars`, p.url]);

  if (!p.description) problems.push(['no description', p.url]);
  else if (p.description.length > 160) problems.push([`description ${p.description.length} chars`, p.url]);

  if (!p.canonical) problems.push(['no canonical', p.url]);
  if (p.h1s === 0) problems.push(['no h1', p.url]);
  if (p.h1s > 1) problems.push([`${p.h1s} h1 tags`, p.url]);
  if (!noindex && !p.og) problems.push(['no og:title', p.url]);
  if (!noindex && p.schema === 0) problems.push(['no structured data', p.url]);
  // Under 200 words of real content is what Google calls thin, and thin pages
  // drag the whole domain rather than just themselves.
  if (!noindex && p.words < 200) problems.push([`thin, ${p.words} words`, p.url]);
}

/* Duplicate titles and descriptions across pages compete with each other. */
const byTitle = new Map();
const byDesc = new Map();
for (const p of indexable) {
  if (p.title) byTitle.set(p.title, [...(byTitle.get(p.title) ?? []), p.url]);
  if (p.description) byDesc.set(p.description, [...(byDesc.get(p.description) ?? []), p.url]);
}

console.log(`${pages.length} pages built, ${indexable.length} indexable.\n`);

const grouped = new Map();
for (const [kind, url] of problems) {
  const key = kind.replace(/\d+/g, 'N');
  grouped.set(key, [...(grouped.get(key) ?? []), `${url}${kind === key ? '' : `  (${kind})`}`]);
}

for (const [kind, urls] of [...grouped].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${urls.length}x  ${kind}`);
  for (const u of urls.slice(0, 4)) console.log(`      ${u}`);
  if (urls.length > 4) console.log(`      and ${urls.length - 4} more`);
}

const dupTitles = [...byTitle].filter(([, u]) => u.length > 1);
const dupDescs = [...byDesc].filter(([, u]) => u.length > 1);
if (dupTitles.length) {
  console.log(`\n${dupTitles.length} duplicate titles across indexable pages`);
  for (const [t, u] of dupTitles.slice(0, 3)) console.log(`      "${t.slice(0, 60)}" on ${u.length} pages`);
}
if (dupDescs.length) {
  console.log(`\n${dupDescs.length} duplicate descriptions across indexable pages`);
  for (const [, u] of dupDescs.slice(0, 3)) console.log(`      ${u.slice(0, 3).join(', ')}`);
}

if (!problems.length && !dupTitles.length && !dupDescs.length) console.log('Nothing to report.');

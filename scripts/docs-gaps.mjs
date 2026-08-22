/**
 * Lists live tools that have no doc yet.
 *
 * Written after wasting an afternoon rewriting three docs that already
 * existed, because I picked tools from memory instead of from the folder. The
 * files were overwritten in place, the build stayed green, and the only clue
 * was the published count going up by two when five had been written.
 *
 * So: never pick the next doc from memory. Run this.
 *
 *   node --experimental-strip-types scripts/docs-gaps.mjs
 *   node --experimental-strip-types scripts/docs-gaps.mjs --have
 */

import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TOOLS } from '../src/lib/site.ts';
import { CONVERSIONS } from '../src/lib/conversions.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(root, 'src/content/docs');

const written = new Set(
  existsSync(DIR)
    ? readdirSync(DIR)
        .filter((f) => f.endsWith('.md') && f !== 'CONTRIBUTING.md' && !f.startsWith('_'))
        .map((f) => f.replace(/\.md$/, ''))
    : [],
);

const live = [
  ...TOOLS.filter((t) => t.live).map((t) => ({ slug: t.slug, group: t.category, name: t.name })),
  ...CONVERSIONS.filter((c) => c.live).map((c) => ({
    slug: c.slug,
    group: 'Conversions',
    name: `${c.from.label} to ${c.to.label}`,
  })),
];

const showHave = process.argv.includes('--have');
const rows = live.filter((t) => (showHave ? written.has(t.slug) : !written.has(t.slug)));

const byGroup = new Map();
for (const row of rows) {
  if (!byGroup.has(row.group)) byGroup.set(row.group, []);
  byGroup.get(row.group).push(row);
}

for (const [group, items] of [...byGroup].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${group}  (${items.length})`);
  for (const i of items) console.log(`  ${i.slug.padEnd(30)} ${i.name}`);
}

const orphans = [...written].filter((slug) => !live.some((t) => t.slug === slug));
if (orphans.length) {
  console.log(`\nDocs whose tool is not live: ${orphans.join(', ')}`);
}

console.log(
  `\n${written.size} written, ${live.length} live tools, ${live.length - written.size + orphans.length} without a doc.`,
);

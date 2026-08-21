/**
 * Every download on the site has to go through DownloadButton.
 *
 * Not a style rule. A plain <a download> looks identical before and after it
 * is pressed, so on anything large enough to take a second the visitor presses
 * again, and again, and ends up with four copies of the same file. That is a
 * bug somebody reported from real use rather than a hypothetical.
 *
 * The button fixes it in two ways that a link cannot: it changes what it says
 * the moment it is pressed, and it ignores a second press while the first is
 * still running. Both only work if nothing bypasses it, which is what this
 * checks.
 *
 * Run: node --experimental-strip-types scripts/check-downloads.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

/** The one file allowed to save a file itself, because it is the mechanism. */
const OWNER = 'DownloadButton.tsx';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const problems = [];

for (const file of walk(src)) {
  if (file.endsWith(OWNER)) continue;
  const text = readFileSync(file, 'utf8');
  const where = relative(root, file).replace(/\\/g, '/');

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const at = `${where}:${i + 1}`;

    // An anchor carrying a download attribute.
    if (/<a\b/.test(line) && /\bdownload\b/.test(text.slice(text.indexOf(line), text.indexOf(line) + 400))) {
      if (/<a\b[^>]*\bdownload\b/.test(line) || /^\s*download[=\s]/.test(lines[i + 1] ?? '')) {
        problems.push(`${at}  a download link, use DownloadButton instead`);
      }
    }

    // Building an anchor and clicking it.
    if (/createElement\(['"]a['"]\)/.test(line)) {
      problems.push(`${at}  builds its own download link, use DownloadButton instead`);
    }
  });
}

if (problems.length) {
  console.error(`\n${problems.length} download${problems.length === 1 ? '' : 's'} bypassing DownloadButton:\n`);
  for (const p of problems) console.error('  ' + p);
  console.error(
    '\nDownloadButton takes either href for a file that already exists, or\n' +
      'prepare for one that has to be built when the button is pressed.\n',
  );
  process.exit(1);
}

console.log('downloads: all of them go through DownloadButton.');

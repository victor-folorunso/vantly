/**
 * Finds FAQ answers that got trimmed into uselessness.
 *
 * Cutting to one sentence is right most of the time and wrong when the question
 * asks how to do something: "Can I stop my iPhone making HEIC files?" answered
 * with "Yes." is shorter and worse, because the steps were the whole point.
 *
 * Flags anything short answering a question that wants an instruction.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === 'page.tsx') acc.push(full);
  }
  return acc;
}

/** Questions where a bare yes or no leaves the reader stuck. */
const NEEDS_STEPS = /^(how|what|where|which|can i|do i|should i)/i;

let flagged = 0;
for (const file of walk(join(root, 'src/app'))) {
  const src = readFileSync(file, 'utf8');
  const pairs = [
    ...src.matchAll(/"q":\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"a":\s*"((?:[^"\\]|\\.)*)"/g),
    ...src.matchAll(/\bq:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*a:\s*'((?:[^'\\]|\\.)*)'/g),
  ];
  for (const [, q, a] of pairs) {
    const words = a.trim().split(/\s+/).length;
    if (words <= 6 && NEEDS_STEPS.test(q.trim())) {
      flagged++;
      console.log(`\n${file.replace(root, '').replace(/\\/g, '/')}`);
      console.log(`  Q: ${q}`);
      console.log(`  A: ${a}   <-- ${words} words`);
    }
  }
}
console.log(`\n${flagged} answers need their steps back.`);

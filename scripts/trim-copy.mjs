/**
 * Cuts every FAQ answer down to its first sentence.
 *
 * The answers were written three or four sentences long, and the sentences
 * after the first were almost always me explaining why the first one was true.
 * Nobody asked. The first sentence is the answer.
 *
 * Run with: node --experimental-strip-types scripts/trim-copy.mjs
 * Pass --dry to see what would change without writing.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === 'page.tsx') acc.push(full);
  }
  return acc;
}

/** First sentence, keeping the terminator. */
function firstSentence(text) {
  const m = text.match(/^.*?[.!?](?=\s|$)/s);
  if (!m) return text;
  return m[0];
}

let files = 0;
let trimmed = 0;
let wordsBefore = 0;
let wordsAfter = 0;

for (const file of walk(join(root, 'src/app'))) {
  const before = readFileSync(file, 'utf8');
  let after = before;

  // Generated pages write "a": "…", hand written ones write a: '…'.
  after = after.replace(/("a":\s*")((?:[^"\\]|\\.)*)(")/g, (whole, open_, body, close) => {
    const short = firstSentence(body);
    if (short === body) return whole;
    trimmed++;
    wordsBefore += body.split(/\s+/).length;
    wordsAfter += short.split(/\s+/).length;
    return open_ + short + close;
  });

  after = after.replace(/(\ba:\s*')((?:[^'\\]|\\.)*)(')/g, (whole, open_, body, close) => {
    const short = firstSentence(body);
    if (short === body) return whole;
    trimmed++;
    wordsBefore += body.split(/\s+/).length;
    wordsAfter += short.split(/\s+/).length;
    return open_ + short + close;
  });

  if (after !== before) {
    files++;
    if (!dry) writeFileSync(file, after, 'utf8');
  }
}

console.log(
  `${dry ? '[dry] ' : ''}${trimmed} answers trimmed across ${files} files, ` +
    `${wordsBefore} words down to ${wordsAfter}.`,
);

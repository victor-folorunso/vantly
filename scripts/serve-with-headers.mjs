/**
 * Serves out/ with the headers Cloudflare Pages would apply.
 *
 * A content security policy that has never been served is a guess. The whole
 * risk of adding one is that it breaks a tool nobody thought to check, and
 * that only shows up under the real header, so this reads public/_headers and
 * applies it exactly as written.
 *
 * Run: node --experimental-strip-types scripts/serve-with-headers.mjs 5400
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'out');
const port = Number(process.argv[2] ?? 5400);

/** Parses the Pages _headers format: a path, then indented header lines. */
function parseHeaders(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: [] };
      rules.push(current);
    } else if (current) {
      const at = raw.indexOf(':');
      if (at > 0) current.headers.push([raw.slice(0, at).trim(), raw.slice(at + 1).trim()]);
    }
  }
  return rules;
}

const rules = parseHeaders(readFileSync(join(root, 'public/_headers'), 'utf8'));

function headersFor(pathname) {
  const applied = new Map();
  for (const rule of rules) {
    const re = new RegExp('^' + rule.pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    if (re.test(pathname)) for (const [k, v] of rule.headers) applied.set(k, v);
  }
  return applied;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
};

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(out, pathname);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const body = readFileSync(file);
  const head = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' };
  for (const [k, v] of headersFor(pathname)) head[k] = v;
  res.writeHead(200, head);
  res.end(body);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving out/ with _headers applied on http://127.0.0.1:${port}`);
});

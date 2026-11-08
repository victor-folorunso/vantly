/**
 * The logic behind the small text and developer tools, kept apart from the
 * interface so it can be tested without a browser.
 *
 * Nothing here touches the DOM or the network. Each function takes text or
 * numbers and returns text or numbers, and throws a message a person can read
 * when the input is wrong.
 */

/* ── HTML entities ───────────────────────────────────────────────────────── */

/**
 * The five characters that change meaning in HTML. Encoding only these keeps
 * the text readable, which is what someone pasting a code sample wants.
 */
export function encodeEntities(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The five, and every character outside ASCII as a numeric reference. */
export function encodeEntitiesAll(s: string): string {
  let out = '';
  for (const ch of encodeEntities(s)) {
    const code = ch.codePointAt(0)!;
    out += code > 126 ? `&#${code};` : ch;
  }
  return out;
}

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•',
  middot: '·', deg: '°', euro: '€', pound: '£', yen: '¥', cent: '¢', sect: '§', para: '¶', times: '×',
  divide: '÷', plusmn: '±', frac12: '½', frac14: '¼', frac34: '¾', laquo: '«', raquo: '»',
};

/**
 * Decodes numeric references and the common named ones.
 *
 * Done by hand rather than through the DOM, so it runs anywhere and can be
 * tested. An unknown name is left exactly as written rather than guessed at.
 */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

/* ── JSON checking ───────────────────────────────────────────────────────── */

export type JsonCheck =
  | { ok: true; kind: string; summary: string }
  | { ok: false; message: string; line?: number; column?: number; excerpt?: string };

/** Valid or not, and when not, the line and column and the line itself. */
export function checkJson(input: string): JsonCheck {
  if (!input.trim()) return { ok: false, message: 'Nothing to check yet.' };
  try {
    const value = JSON.parse(input);
    const kind = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    const summary = Array.isArray(value)
      ? `${value.length} item${value.length === 1 ? '' : 's'}`
      : kind === 'object'
        ? `${Object.keys(value).length} key${Object.keys(value).length === 1 ? '' : 's'} at the top level`
        : String(value).slice(0, 40);
    return { ok: true, kind, summary };
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Invalid JSON';
    // V8 says "at position N", sometimes with "(line L column C)" after it.
    const lc = /line (\d+) column (\d+)/.exec(raw);
    const pos = /position (\d+)/.exec(raw);
    let line: number | undefined;
    let column: number | undefined;
    if (lc) {
      line = Number(lc[1]);
      column = Number(lc[2]);
    } else if (pos) {
      const before = input.slice(0, Number(pos[1]));
      line = before.split('\n').length;
      column = Number(pos[1]) - before.lastIndexOf('\n');
    }
    const message = raw.replace(/^JSON\.parse: /, '').replace(/ in JSON at position \d+.*$/, '').replace(/\s*\(line \d+ column \d+\)/, '');
    const excerpt = line ? input.split('\n')[line - 1] : undefined;
    return { ok: false, message, line, column, excerpt };
  }
}

/* ── Fancy text ──────────────────────────────────────────────────────────── */

/**
 * Unicode's mathematical alphanumeric letters, which look like bold, italic or
 * script type but are separate characters, so the look survives a box that
 * allows no formatting. A handful were encoded earlier elsewhere in Unicode
 * (italic h is U+210E, script B is U+212C), and the block has holes where they
 * would be, so those are listed as exceptions.
 */
type Style = { id: string; label: string; upper?: number; lower?: number; digit?: number; holes?: Record<string, string> };

export const FANCY_STYLES: Style[] = [
  { id: 'bold', label: 'Bold', upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  { id: 'italic', label: 'Italic', upper: 0x1d434, lower: 0x1d44e, holes: { h: 'ℎ' } },
  { id: 'bold-italic', label: 'Bold italic', upper: 0x1d468, lower: 0x1d482 },
  {
    id: 'script', label: 'Script', upper: 0x1d49c, lower: 0x1d4b6,
    holes: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
  },
  { id: 'bold-script', label: 'Bold script', upper: 0x1d4d0, lower: 0x1d4ea },
  {
    id: 'fraktur', label: 'Gothic', upper: 0x1d504, lower: 0x1d51e,
    holes: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
  },
  {
    id: 'double', label: 'Outline', upper: 0x1d538, lower: 0x1d552, digit: 0x1d7d8,
    holes: { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' },
  },
  { id: 'sans', label: 'Sans', upper: 0x1d5a0, lower: 0x1d5ba, digit: 0x1d7e2 },
  { id: 'sans-bold', label: 'Sans bold', upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  { id: 'sans-italic', label: 'Sans italic', upper: 0x1d608, lower: 0x1d622 },
  { id: 'mono', label: 'Monospace', upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
];

export function fancy(text: string, styleId: string): string {
  const st = FANCY_STYLES.find((s) => s.id === styleId);
  if (!st) return text;
  let out = '';
  for (const ch of text) {
    if (st.holes?.[ch]) out += st.holes[ch];
    else if (ch >= 'A' && ch <= 'Z' && st.upper) out += String.fromCodePoint(st.upper + ch.charCodeAt(0) - 65);
    else if (ch >= 'a' && ch <= 'z' && st.lower) out += String.fromCodePoint(st.lower + ch.charCodeAt(0) - 97);
    else if (ch >= '0' && ch <= '9' && st.digit) out += String.fromCodePoint(st.digit + ch.charCodeAt(0) - 48);
    else out += ch;
  }
  return out;
}

/** Not letters at all but combining marks, so they sit on any text. */
export function strike(text: string): string {
  return [...text].map((c) => (c === ' ' ? c : c + '̶')).join('');
}
export function underline(text: string): string {
  return [...text].map((c) => (c === ' ' ? c : c + '̲')).join('');
}

/* ── Unix time ───────────────────────────────────────────────────────────── */

/**
 * A number as a moment, deciding seconds or milliseconds by size.
 *
 * Anything past 100 billion is read as milliseconds: as seconds that would be
 * the year 5138, and nobody is converting those. Microseconds and nanoseconds
 * are scaled down the same way.
 */
export function parseTimestamp(raw: string): { ms: number; unit: 's' | 'ms' | 'µs' | 'ns' } {
  const t = raw.trim().replace(/[_,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) throw new Error('That is not a number.');
  const n = Number(t);
  const abs = Math.abs(n);
  if (abs >= 1e17) return { ms: n / 1e6, unit: 'ns' };
  if (abs >= 1e14) return { ms: n / 1e3, unit: 'µs' };
  if (abs >= 1e11) return { ms: n, unit: 'ms' };
  return { ms: n * 1000, unit: 's' };
}

export function relativeTime(ms: number, now = Date.now()): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [365.25 * 864e5, 'year'], [30.44 * 864e5, 'month'], [864e5, 'day'], [36e5, 'hour'], [6e4, 'minute'], [1e3, 'second'],
  ];
  for (const [size, name] of units) {
    if (abs >= size) {
      const n = Math.floor(abs / size);
      const words = `${n} ${name}${n === 1 ? '' : 's'}`;
      return diff < 0 ? `${words} ago` : `in ${words}`;
    }
  }
  return 'now';
}

/* ── JWT ─────────────────────────────────────────────────────────────────── */

export function base64UrlDecode(part: string): string {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  parts: [string, string, string];
};

export function decodeJwt(token: string): DecodedJwt {
  const t = token.trim().replace(/^Bearer\s+/i, '');
  const parts = t.split('.');
  if (parts.length !== 3) {
    throw new Error(
      parts.length === 5
        ? 'That has five parts, so it is an encrypted token (JWE). Its contents cannot be read without the key.'
        : 'A JWT has three parts separated by dots. This has ' + parts.length + '.',
    );
  }
  const read = (p: string, which: string) => {
    try {
      return JSON.parse(base64UrlDecode(p));
    } catch {
      throw new Error(`The ${which} is not valid Base64url JSON.`);
    }
  };
  return { header: read(parts[0], 'header'), payload: read(parts[1], 'payload'), signature: parts[2], parts: parts as [string, string, string] };
}

/* ── IPv4 subnets ────────────────────────────────────────────────────────── */

export function parseIpv4(s: string): number {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s.trim());
  if (!m) throw new Error('An IPv4 address is four numbers separated by dots, like 192.168.1.10.');
  const octets = m.slice(1).map(Number);
  if (octets.some((o) => o > 255)) throw new Error('Each part of an IPv4 address is between 0 and 255.');
  return ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
}

export function formatIpv4(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

export type Subnet = {
  address: string;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  first: string;
  last: string;
  total: number;
  usable: number;
  kind: string;
};

/** Accepts "10.0.0.5/24", or an address and a prefix or dotted mask. */
export function subnet(input: string, prefixOrMask?: string): Subnet {
  let addr = input.trim();
  let p = prefixOrMask?.trim() ?? '';
  if (addr.includes('/')) [addr, p] = addr.split('/');
  if (!p) throw new Error('Add a prefix, like /24, or a mask, like 255.255.255.0.');
  let prefix: number;
  if (/^\d{1,2}$/.test(p)) {
    prefix = Number(p);
    if (prefix > 32) throw new Error('An IPv4 prefix is between 0 and 32.');
  } else {
    const m = parseIpv4(p);
    const inverted = ~m >>> 0;
    // A mask is ones then zeros. Anything else is not a mask.
    if ((inverted & (inverted + 1)) !== 0) throw new Error('That mask is not contiguous, so it is not a valid subnet mask.');
    prefix = 32 - Math.log2(inverted + 1);
  }
  const ip = parseIpv4(addr);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  // /31 is two usable addresses on a point-to-point link (RFC 3021) and /32
  // is one host, so the usual "minus two" does not apply to either.
  const usable = prefix >= 31 ? total : total - 2;
  const first = prefix >= 31 ? network : network + 1;
  const last = prefix >= 31 ? broadcast : broadcast - 1;
  const o1 = ip >>> 24;
  const o2 = (ip >>> 16) & 255;
  const kind =
    o1 === 10 || (o1 === 172 && o2 >= 16 && o2 <= 31) || (o1 === 192 && o2 === 168)
      ? 'Private'
      : o1 === 127
        ? 'Loopback'
        : o1 === 169 && o2 === 254
          ? 'Link-local'
          : o1 === 100 && o2 >= 64 && o2 <= 127
            ? 'Carrier-grade NAT'
            : o1 >= 224 && o1 <= 239
              ? 'Multicast'
              : o1 >= 240
                ? 'Reserved'
                : 'Public';
  return {
    address: formatIpv4(ip),
    prefix,
    mask: formatIpv4(mask),
    wildcard: formatIpv4(~mask >>> 0),
    network: formatIpv4(network),
    broadcast: formatIpv4(broadcast),
    first: formatIpv4(first),
    last: formatIpv4(last),
    total,
    usable,
    kind,
  };
}

/* ── Find and replace ────────────────────────────────────────────────────── */

export type ReplaceOptions = { caseSensitive: boolean; wholeWord: boolean; regex: boolean };

export function buildPattern(find: string, o: ReplaceOptions): RegExp {
  let source = o.regex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // \b only understands ASCII letters, so whole words are bounded by
  // "not a letter or digit in any script" instead.
  if (o.wholeWord) source = `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`;
  try {
    return new RegExp(source, `g${o.caseSensitive ? '' : 'i'}u`);
  } catch (e) {
    throw new Error(`That pattern is not a valid regular expression: ${e instanceof Error ? e.message : ''}`);
  }
}

export function findReplace(text: string, find: string, replace: string, o: ReplaceOptions): { text: string; count: number } {
  if (!find) return { text, count: 0 };
  const re = buildPattern(find, o);
  let count = 0;
  const out = text.replace(re, (...args) => {
    count++;
    if (!o.regex) return replace;
    // $1, $2 and $& work as they do in every editor's regex replace.
    const groups = args.slice(1, -2) as string[];
    return replace.replace(/\$(\$|&|\d{1,2})/g, (m, g: string) =>
      g === '$' ? '$' : g === '&' ? args[0] : (groups[Number(g) - 1] ?? ''),
    );
  });
  // A pattern that matches empty strings would count every gap.
  return { text: out, count };
}

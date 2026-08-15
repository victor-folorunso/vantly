/**
 * The actual transformations, as pure functions with no UI attached.
 *
 * Kept separate from the component so each one can be read, reasoned about and
 * tested on its own. Most of these are three lines; the value is that the
 * awkward cases live in one place instead of being rediscovered per tool.
 */

/* ── Case ─────────────────────────────────────────────────────────────────── */

/**
 * Splits on any boundary a human would recognise, including camelCase humps.
 *
 * The character class is Unicode aware on purpose. Splitting on [^A-Za-z0-9]
 * treats every accented letter as a separator, so "Café" came out as "caf" and
 * the é vanished silently: no error, just a quietly wrong word that somebody
 * would paste into a variable name and not notice.
 */
function words(input: string): string[] {
  return input
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Strips accents but keeps the letter, so é becomes e rather than nothing.
 *
 * NFKD only helps for letters that decompose into a base plus a combining mark.
 * A handful of Latin letters are single indivisible codepoints with no accent
 * to peel off, and those have to be spelled out. Without this, straße slugged
 * to "strae" and Œuvre to "uvre": the letter was deleted rather than
 * transliterated, which is the same silent corruption as the accent bug above.
 */
const SPELLED_OUT: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  Æ: 'ae',
  œ: 'oe',
  Œ: 'oe',
  ø: 'o',
  Ø: 'o',
  đ: 'd',
  Đ: 'd',
  ð: 'd',
  Ð: 'd',
  þ: 'th',
  Þ: 'th',
  ł: 'l',
  Ł: 'l',
  ı: 'i',
};

function fold(s: string): string {
  return s
    .replace(/[ßæÆœŒøØđĐðÐþÞłŁı]/g, (c) => SPELLED_OUT[c] ?? c)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '');
}

export const toUpper = (s: string) => s.toUpperCase();
export const toLower = (s: string) => s.toLowerCase();

export const toTitle = (s: string) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export const toSentence = (s: string) =>
  s
    .toLowerCase()
    // After a full stop, question mark or exclamation, not just at the start.
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());

export const toCamel = (s: string) =>
  words(s)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');

export const toPascal = (s: string) =>
  words(s)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

export const toSnake = (s: string) => words(s).map((w) => w.toLowerCase()).join('_');
export const toKebab = (s: string) => words(s).map((w) => w.toLowerCase()).join('-');
export const toConstant = (s: string) => words(s).map((w) => w.toUpperCase()).join('_');

/**
 * Built from the same word splitter as the other cases, not from a separate
 * regex.
 *
 * Written independently it lost the camelCase boundary that every other case
 * function respects: "getHTTPResponse" slugged to "gethttpresponse" while
 * snake_case correctly gave get_http_response. Two ways of deciding what a word
 * is means two answers, and only one of them can be right.
 */
export const toSlug = (s: string) =>
  words(fold(s))
    .map((w) => w.toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '');

/* ── Encoding ─────────────────────────────────────────────────────────────── */

/**
 * btoa throws on anything outside Latin-1, so an emoji or an accent breaks it.
 * Going through TextEncoder first means the input is bytes before it is
 * base64, which is what people expect the tool to do.
 */
export function encodeBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function decodeBase64(s: string): string {
  const bin = atob(s.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const encodeUrl = (s: string) => encodeURIComponent(s);
export const decodeUrl = (s: string) => decodeURIComponent(s);
export const encodeUrlFull = (s: string) => encodeURI(s);

/* ── Cleaning ─────────────────────────────────────────────────────────────── */

export const sortLines = (s: string) =>
  s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n');

export const sortLinesDesc = (s: string) =>
  s.split('\n').sort((a, b) => b.localeCompare(a)).join('\n');

export const reverseLines = (s: string) => s.split('\n').reverse().join('\n');

export const dedupeLines = (s: string) => [...new Set(s.split('\n'))].join('\n');

export const removeEmptyLines = (s: string) =>
  s.split('\n').filter((l) => l.trim() !== '').join('\n');

export const trimLines = (s: string) => s.split('\n').map((l) => l.trim()).join('\n');

/**
 * Tags out, text kept, entities decoded.
 *
 * A regex is the wrong tool for parsing HTML in general, but this is the right
 * job for it: the browser's own parser is used for the entity half, and script
 * and style content is dropped rather than left behind as stray text, which is
 * the mistake most strip-tags implementations make.
 */
export function stripHtml(s: string): string {
  const withoutScripts = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const withoutTags = withoutScripts.replace(/<[^>]*>/g, '');
  if (typeof document === 'undefined') return withoutTags;
  const el = document.createElement('textarea');
  el.innerHTML = withoutTags;
  return el.value;
}

/* ── Counting ─────────────────────────────────────────────────────────────── */

export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingMinutes: number;
  speakingMinutes: number;
};

export function countText(s: string): TextStats {
  const trimmed = s.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  return {
    // Array.from rather than .length: an emoji is two UTF-16 units and counting
    // it as two characters is wrong to anybody looking at the screen.
    characters: Array.from(s).length,
    charactersNoSpaces: Array.from(s.replace(/\s/g, '')).length,
    words: wordCount,
    sentences: trimmed ? (trimmed.match(/[^.!?]+[.!?]*/g) ?? []).length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    lines: s ? s.split('\n').length : 0,
    // 238 wpm reading and 140 wpm speaking, both from the usual meta-analyses.
    readingMinutes: wordCount / 238,
    speakingMinutes: wordCount / 140,
  };
}

/* ── JSON ─────────────────────────────────────────────────────────────────── */

export type JsonResult = { ok: true; text: string } | { ok: false; message: string; line?: number; column?: number };

/**
 * Formats, and on failure says where.
 *
 * "Unexpected token }" on its own is useless in a 4000 line file. The position
 * is dug out of the error message and turned into a line and column, which is
 * the entire reason to use this over pressing prettify in an editor.
 */
export function formatJson(input: string, indent: number | 'tab' = 2): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, text: JSON.stringify(parsed, null, indent === 'tab' ? '\t' : indent) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON';
    const at = /position (\d+)/.exec(message);
    if (!at) return { ok: false, message };
    const pos = Number(at[1]);
    const before = input.slice(0, pos);
    const line = before.split('\n').length;
    const column = pos - before.lastIndexOf('\n');
    return { ok: false, message, line, column };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    return { ok: true, text: JSON.stringify(JSON.parse(input)) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

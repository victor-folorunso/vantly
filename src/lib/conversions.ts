/**
 * Every conversion the site claims to do, as data.
 *
 * Each pair gets its own address, because "heic to jpg" and "heic to webp" are
 * different things to search for even though they are one tool underneath. The
 * page is the unit search engines rank, so the pairs are enumerated rather than
 * hidden behind a dropdown.
 *
 * Pairs are generated from a small set of rules instead of being typed out.
 * Ninety hand written entries drift the moment somebody adds a format and
 * forgets a row, and nothing fails loudly when they do.
 */

export type FormatKind = 'image' | 'document' | 'data' | 'media';

export type Format = {
  id: string;
  label: string;
  kind: FormatKind;
  /** What a person calls it, used in copy rather than the extension. */
  long: string;
};

const F = (id: string, label: string, kind: FormatKind, long: string): Format => ({
  id,
  label,
  kind,
  long,
});

export const FORMATS: Format[] = [
  // Images
  F('jpg', 'JPG', 'image', 'JPEG photo'),
  F('png', 'PNG', 'image', 'PNG image'),
  F('webp', 'WebP', 'image', 'WebP image'),
  F('avif', 'AVIF', 'image', 'AVIF image'),
  F('gif', 'GIF', 'image', 'GIF image'),
  F('bmp', 'BMP', 'image', 'bitmap image'),
  F('tiff', 'TIFF', 'image', 'TIFF image'),
  F('heic', 'HEIC', 'image', 'iPhone HEIC photo'),
  F('svg', 'SVG', 'image', 'SVG vector'),
  F('ico', 'ICO', 'image', 'icon file'),
  // Documents
  F('pdf', 'PDF', 'document', 'PDF document'),
  F('docx', 'DOCX', 'document', 'Word document'),
  F('txt', 'TXT', 'document', 'plain text file'),
  F('md', 'Markdown', 'document', 'Markdown file'),
  F('html', 'HTML', 'document', 'HTML page'),
  // Data
  F('csv', 'CSV', 'data', 'CSV spreadsheet'),
  F('json', 'JSON', 'data', 'JSON file'),
  F('xml', 'XML', 'data', 'XML file'),
  F('yaml', 'YAML', 'data', 'YAML file'),
  F('tsv', 'TSV', 'data', 'tab separated file'),
  // Media
  F('mp4', 'MP4', 'media', 'MP4 video'),
  F('webm', 'WebM', 'media', 'WebM video'),
  F('mov', 'MOV', 'media', 'QuickTime video'),
  F('gifv', 'Animated GIF', 'media', 'animated GIF'),
  F('mp3', 'MP3', 'media', 'MP3 audio'),
  F('wav', 'WAV', 'media', 'WAV audio'),
  F('m4a', 'M4A', 'media', 'M4A audio'),
  F('ogg', 'OGG', 'media', 'OGG audio'),
];

export const FORMAT_BY_ID = new Map(FORMATS.map((f) => [f.id, f]));

export type Conversion = {
  slug: string;
  from: Format;
  to: Format;
  /** Live tools have their own route and real code behind them. */
  live: boolean;
};

/* Which pairs exist. Written as source lists rather than a full cross product,
   because most of a cross product is nonsense nobody searches for. */
const RASTER = ['jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'];

const RULES: { from: string; to: string[] }[] = [
  // Raster to raster, every direction. These are the highest volume searches.
  ...RASTER.map((from) => ({ from, to: RASTER.filter((t) => t !== from) })),

  // Sources that only ever go one way.
  { from: 'heic', to: ['jpg', 'png', 'webp', 'pdf'] },
  { from: 'svg', to: ['png', 'jpg', 'webp', 'pdf', 'ico'] },

  // Icons out of ordinary images.
  { from: 'png', to: ['ico'] },
  { from: 'jpg', to: ['ico'] },

  // Documents.
  { from: 'pdf', to: ['jpg', 'png', 'txt', 'docx'] },
  { from: 'docx', to: ['pdf', 'txt', 'md', 'html'] },
  { from: 'md', to: ['pdf', 'html', 'docx'] },
  { from: 'html', to: ['pdf', 'md'] },
  { from: 'txt', to: ['pdf'] },

  // Data.
  { from: 'csv', to: ['json', 'xml', 'yaml', 'tsv'] },
  { from: 'json', to: ['csv', 'xml', 'yaml'] },
  { from: 'xml', to: ['json', 'csv'] },
  { from: 'yaml', to: ['json', 'csv'] },
  { from: 'tsv', to: ['csv', 'json'] },

  // Media.
  { from: 'mp4', to: ['mp3', 'webm', 'gifv', 'wav'] },
  { from: 'mov', to: ['mp4', 'webm', 'gifv'] },
  { from: 'webm', to: ['mp4', 'mp3', 'gifv'] },
  { from: 'gifv', to: ['mp4', 'webm'] },
  { from: 'mp3', to: ['wav', 'ogg', 'm4a'] },
  { from: 'wav', to: ['mp3', 'ogg', 'm4a'] },
  { from: 'm4a', to: ['mp3', 'wav'] },
  { from: 'ogg', to: ['mp3', 'wav'] },
];

/**
 * Raster pairs a canvas can do, which is fewer than it looks.
 *
 * Decoding is generous: the browser reads PNG, JPEG, WebP, GIF, BMP and AVIF.
 * Writing is not. Chromium encodes only PNG, JPEG and WebP, and asking toBlob
 * for anything else does not fail, it silently returns a PNG. Verified in a
 * real browser rather than assumed, because the failure mode is PNG data inside
 * a file named .avif, which opens correctly everywhere and is wrong in a way
 * nobody would ever report.
 */
export const CANVAS_SOURCES = ['png', 'jpg', 'webp', 'gif', 'bmp', 'avif'] as const;
export const CANVAS_TARGETS = ['png', 'jpg', 'webp'] as const;

export type EncodableTarget = (typeof CANVAS_TARGETS)[number];

export function canvasHandles(c: { from: Format; to: Format }): boolean {
  return (
    (CANVAS_SOURCES as readonly string[]).includes(c.from.id) &&
    (CANVAS_TARGETS as readonly string[]).includes(c.to.id) &&
    c.from.id !== c.to.id
  );
}

/**
 * Conversions that are actually implemented.
 *
 * The three named here have their own hand written route. Everything the canvas
 * handles is added below and served by the catch-all, so a new raster pair
 * needs no new file.
 */
const HAND_BUILT = ['heic-to-jpg', 'heic-to-webp', 'svg-to-png'];

function build(): Conversion[] {
  const seen = new Set<string>();
  const out: Conversion[] = [];

  for (const rule of RULES) {
    const from = FORMAT_BY_ID.get(rule.from);
    if (!from) continue;
    for (const toId of rule.to) {
      const to = FORMAT_BY_ID.get(toId);
      if (!to) continue;
      const slug = `${from.id}-to-${to.id}`;
      // Rules overlap on purpose, so png appears in both the raster block and
      // the icon block. First writer wins and the duplicate is dropped.
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({
        slug,
        from,
        to,
        live: HAND_BUILT.includes(slug) || canvasHandles({ from, to }),
      });
    }
  }

  return out;
}

export const CONVERSIONS = build();

export const CONVERSION_BY_SLUG = new Map(CONVERSIONS.map((c) => [c.slug, c]));

export function conversionTitle(c: Conversion): string {
  return `Convert ${c.from.label} to ${c.to.label}`;
}

/**
 * "a" or "an", chosen by how the word is said rather than how it is spelled.
 *
 * The descriptions are generated, so a plain "a" produced "a AVIF image", "a
 * icon file" and "a HTML page" across a dozen pages at once. Initialisms are
 * the reason a vowel test on the first letter is not enough: AVIF is said
 * "ay-vif" and takes an, while a word like "unit" starts with a vowel and does
 * not.
 */
export function article(word: string): 'a' | 'an' {
  const first = word.trim().charAt(0).toUpperCase();
  const rest = word.trim().charAt(1);
  // A leading capital followed by another capital reads as an initialism, said
  // letter by letter, so the sound of the letter decides it.
  const isInitialism = rest === rest?.toUpperCase() && /[A-Z]/.test(rest ?? '');
  if (isInitialism) return 'AEFHILMNORSX'.includes(first) ? 'an' : 'a';
  return 'AEIOU'.includes(first) ? 'an' : 'a';
}

export function conversionDescription(c: Conversion): string {
  return `Convert ${article(c.from.long)} ${c.from.long} to ${c.to.label} in your browser. No upload, no watermark, no sign up, and no limit on how many you can do.`;
}

/** Everything that shares a source or a target, for the related links block. */
export function relatedConversions(c: Conversion, limit = 12): Conversion[] {
  const sameSource = CONVERSIONS.filter((x) => x.from.id === c.from.id && x.slug !== c.slug);
  const sameTarget = CONVERSIONS.filter((x) => x.to.id === c.to.id && x.slug !== c.slug);
  const merged: Conversion[] = [];
  const seen = new Set<string>();
  for (const x of [...sameSource, ...sameTarget]) {
    if (seen.has(x.slug)) continue;
    seen.add(x.slug);
    merged.push(x);
  }
  return merged.slice(0, limit);
}

/** What a given file can turn into, keyed by the extension the user dropped. */
export function targetsFor(extension: string): Conversion[] {
  const id = normaliseExtension(extension);
  return CONVERSIONS.filter((c) => c.from.id === id);
}

export function normaliseExtension(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, '');
  if (e === 'jpeg') return 'jpg';
  if (e === 'heif') return 'heic';
  if (e === 'tif') return 'tiff';
  if (e === 'yml') return 'yaml';
  if (e === 'htm') return 'html';
  if (e === 'markdown') return 'md';
  return e;
}

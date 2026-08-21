/**
 * Carries chosen files from the home page to the tool that will handle them.
 *
 * The bug this fixes: pick a file on the front page, press convert, land on
 * the conversion page with an empty drop zone and pick the same file again.
 * A File cannot travel in a URL, so nothing was carrying it.
 *
 * Held in memory, on purpose, and not written to disk.
 *
 * Storing them in IndexedDB would survive a reload as well, and it would also
 * mean somebody's tax return sits in browser storage after they have closed
 * the tab. This site's whole claim is that files stay where they are and are
 * not kept, so the weaker guarantee is the correct one: the handoff survives
 * navigation, which is the case that actually happens, and a reload loses it,
 * which is honest and rare.
 *
 * Navigation between pages here is client side, so the module and its contents
 * survive the trip. A hard reload wipes it, which is exactly the intent.
 */

type Held = {
  files: File[];
  /** Where they were sent, so a tool can ignore a handoff meant for another. */
  slug: string;
  at: number;
};

let held: Held | null = null;

/* A handoff older than this was almost certainly abandoned: somebody pressed
   convert, wandered off, and came back through a link an hour later. Handing
   them a file they have forgotten choosing is worse than an empty drop zone. */
const STALE_AFTER = 5 * 60 * 1000;

export function stash(files: File[], slug: string): void {
  held = { files: [...files], slug, at: Date.now() };
}

/**
 * Takes the files if any were left for this tool, and clears them.
 *
 * Clearing on read matters: without it, going back to the tool later would
 * silently reload a file the visitor thought they were done with.
 */
export function claim(slug: string): File[] {
  if (!held) return [];
  const fresh = Date.now() - held.at < STALE_AFTER;
  const mine = held.slug === slug;
  if (!fresh) {
    held = null;
    return [];
  }
  if (!mine) return [];
  const { files } = held;
  held = null;
  return files;
}

/** Whether anything is waiting, without taking it. */
export function waiting(): number {
  if (!held) return 0;
  return Date.now() - held.at < STALE_AFTER ? held.files.length : 0;
}

/**
 * Where a file can be looked at rather than converted.
 *
 * Somebody dropping a PDF on the front page often wants to read it, not turn
 * it into something else, and until now the only offer was a conversion.
 */
const VIEWERS: Record<string, string> = {
  pdf: 'pdf-viewer',
  doc: 'docx-viewer',
  docx: 'docx-viewer',
  odt: 'docx-viewer',
  rtf: 'docx-viewer',
  xls: 'xlsx-viewer',
  xlsx: 'xlsx-viewer',
  ods: 'xlsx-viewer',
  ppt: 'pptx-viewer',
  pptx: 'pptx-viewer',
  odp: 'pptx-viewer',
  csv: 'csv-viewer',
  md: 'markdown-viewer',
  markdown: 'markdown-viewer',
  html: 'html-viewer',
  htm: 'html-viewer',
  json: 'json-formatter',
  xml: 'xml-formatter',
  yaml: 'data-converter',
  yml: 'data-converter',
  srt: 'srt-shifter',
  vtt: 'srt-shifter',
  svg: 'svg-optimizer',
};

export function viewerFor(ext: string): string | null {
  return VIEWERS[ext.toLowerCase()] ?? null;
}

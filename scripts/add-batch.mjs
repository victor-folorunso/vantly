/**
 * Adds tools to the registry as stubs, greyed out until the code exists.
 *
 * Rerunnable: anything already in the registry is skipped, so this can be
 * pointed at a fresh list without checking by hand first.
 *
 * Two rules decide what gets in.
 *
 * It has to run in the browser, or on the one container we already pay for.
 * Anything that needs a server to answer a question, a DNS or WHOIS lookup, a
 * header or certificate check, live currency rates, costs a request every time
 * it is used and earns nothing. A page load is the billable event here, so a
 * page that must call out to answer is a page that costs money to be popular.
 *
 * And it has to be a real search on its own. That is the argument for the
 * placeholder sizes below: nobody searches "placeholder image tool", they
 * search the size they were told to supply, and each of those is a different
 * page with a different reason to exist.
 *
 * Run: node --experimental-strip-types scripts/add-batch.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/lib/site.ts');

/* ── PDF work, mostly pdf-lib in the browser ───────────────────────────────
   The Office to PDF entries are LibreOffice on the container, which already
   accepts every one of these formats. They are separate pages because they
   are separate searches, not because they are separate work. */
const PDF = [
  ['rotate-pdf', 'Rotate PDF', 'Documents',
   'Turn the pages that came in sideways.',
   'Rotate PDF pages and save them that way',
   'Rotate some or all pages of a PDF and save it, so a scan that came in sideways stops being sideways.'],

  ['delete-pdf-pages', 'Delete PDF pages', 'Documents',
   'Drop the blank scans and the pages you do not need.',
   'Delete pages from a PDF',
   'Remove pages from a PDF and download what is left, without reordering anything else.'],

  ['extract-pdf-pages', 'Extract PDF pages', 'Documents',
   'Pull a few pages out into their own file.',
   'Extract pages from a PDF into a new file',
   'Pick the pages you want and save them as a separate PDF, leaving the original alone.'],

  ['organize-pdf', 'Organize PDF', 'Documents',
   'Reorder, rotate and remove pages in one go.',
   'Reorder and organise the pages of a PDF',
   'Move pages around, turn them the right way up and drop the ones you do not want, then save the result.'],

  ['add-page-numbers', 'Add page numbers', 'Documents',
   'Number a PDF that arrived without any.',
   'Add page numbers to a PDF',
   'Stamp page numbers onto a PDF, choosing where they sit, what they count from and how they are formatted.'],

  ['crop-pdf', 'Crop PDF', 'Documents',
   'Cut the margins off a scan.',
   'Crop the margins of a PDF',
   'Trim the edges of every page, for a scan with wide margins or a document that needs to fit a different paper size.'],

  ['redact-pdf', 'Redact PDF', 'Documents',
   'Black something out so it is actually gone.',
   'Redact a PDF properly',
   'Cover text so it cannot be read, and so it cannot be copied back out either, which a black rectangle drawn on top does not do.'],

  ['protect-pdf', 'Protect PDF', 'Documents',
   'Put a password on it.',
   'Add a password to a PDF',
   'Lock a PDF with a password so it cannot be opened without one.'],

  ['flatten-pdf', 'Flatten PDF', 'Documents',
   'Lock the form answers and annotations into the page.',
   'Flatten a PDF so it cannot be edited',
   'Turn form fields, annotations and layers into part of the page itself, so nobody can change the answers later.'],

  ['pdf-annotator', 'PDF annotator', 'Documents',
   'Highlight, draw and leave a note.',
   'Annotate a PDF in your browser',
   'Highlight text, draw on the page and add notes, then save a copy with the markings in it.'],

  ['pdf-to-pdfa', 'PDF to PDF/A', 'Documents',
   'The archival format an institution asked you for.',
   'Convert a PDF to PDF/A',
   'Convert a PDF to PDF/A, the long term archival format that libraries, courts and universities ask for.'],

  ['odt-to-pdf', 'ODT to PDF', 'Documents',
   'OpenDocument text, without OpenOffice.',
   'Convert ODT to PDF',
   'Turn an OpenDocument text file into a PDF, keeping the fonts, tables and page breaks.'],

  ['ods-to-pdf', 'ODS to PDF', 'Documents',
   'OpenDocument spreadsheet, without OpenOffice.',
   'Convert ODS to PDF',
   'Turn an OpenDocument spreadsheet into a PDF, laid out as it prints.'],

  ['odp-to-pdf', 'ODP to PDF', 'Documents',
   'OpenDocument slides, without OpenOffice.',
   'Convert ODP to PDF',
   'Turn an OpenDocument presentation into a PDF, one slide per page.'],

  ['rtf-to-pdf', 'RTF to PDF', 'Documents',
   'Rich text, kept as it looks.',
   'Convert RTF to PDF',
   'Turn a rich text file into a PDF with its formatting intact.'],

  ['txt-to-pdf', 'TXT to PDF', 'Documents',
   'Plain text on a proper page.',
   'Convert a text file to PDF',
   'Turn a plain text file into a PDF, laid out on a page with margins you can print.'],

  ['csv-to-pdf', 'CSV to PDF', 'Documents',
   'A spreadsheet as a table you can send.',
   'Convert CSV to PDF',
   'Turn a CSV into a PDF table, ready to attach to something or print.'],

  ['pages-to-pdf', 'Pages to PDF', 'Documents',
   'The Apple format nobody else can open.',
   'Convert an Apple Pages file to PDF',
   'Turn a Pages document into a PDF anyone can open, without a Mac.'],
];

/* ── Placeholder images ────────────────────────────────────────────────────
   One generator, and a page for each size people are actually told to
   supply. The size is the search: nobody looks for "placeholder image tool",
   they look for the number a brief handed them. Each page says what the size
   is for, which is the part that stops these being the same page repeated. */
const PLACEHOLDER = [
  ['placeholder-1920x1080', 'Placeholder 1920x1080', 'Generators',
   'Full HD, the default for a hero or a slide.',
   'Placeholder image, 1920x1080',
   'A 1920 by 1080 placeholder image. Full HD and the usual size for a hero image, a slide or a video frame.'],

  ['placeholder-1280x720', 'Placeholder 1280x720', 'Generators',
   'The YouTube thumbnail size.',
   'Placeholder image, 1280x720',
   'A 1280 by 720 placeholder image. The size YouTube asks for a thumbnail, and 720p video.'],

  ['placeholder-1200x630', 'Placeholder 1200x630', 'Generators',
   'The link preview size for social posts.',
   'Placeholder image, 1200x630, for Open Graph',
   'A 1200 by 630 placeholder. The size a link preview uses when a page is shared, set by Open Graph and used by Facebook, LinkedIn and X.'],

  ['placeholder-1080x1080', 'Placeholder 1080x1080', 'Generators',
   'The square Instagram post.',
   'Placeholder image, 1080x1080 square',
   'A 1080 by 1080 square placeholder, the size of an Instagram feed post.'],

  ['placeholder-1080x1920', 'Placeholder 1080x1920', 'Generators',
   'The vertical story and reel size.',
   'Placeholder image, 1080x1920 vertical',
   'A 1080 by 1920 vertical placeholder, the size of a story, a reel and a short.'],

  ['placeholder-800x600', 'Placeholder 800x600', 'Generators',
   'The old faithful four by three.',
   'Placeholder image, 800x600',
   'An 800 by 600 placeholder image, four by three, still the default in plenty of templates.'],

  ['placeholder-600x400', 'Placeholder 600x400', 'Generators',
   'A card or a thumbnail in a grid.',
   'Placeholder image, 600x400',
   'A 600 by 400 placeholder image, the usual shape for a card or a thumbnail in a grid.'],

  ['placeholder-300x250', 'Placeholder 300x250', 'Generators',
   'The medium rectangle ad slot.',
   'Placeholder image, 300x250 medium rectangle',
   'A 300 by 250 placeholder, the medium rectangle, the most used display ad size there is.'],

  ['placeholder-728x90', 'Placeholder 728x90', 'Generators',
   'The leaderboard banner across the top.',
   'Placeholder image, 728x90 leaderboard',
   'A 728 by 90 placeholder, the leaderboard banner that runs across the top of a page.'],

  ['placeholder-160x600', 'Placeholder 160x600', 'Generators',
   'The skyscraper down the side.',
   'Placeholder image, 160x600 skyscraper',
   'A 160 by 600 placeholder, the wide skyscraper that runs down the side of a page.'],

  ['placeholder-400x400', 'Placeholder 400x400', 'Generators',
   'A square avatar or profile picture.',
   'Placeholder image, 400x400 square avatar',
   'A 400 by 400 square placeholder, the usual size for an avatar or a profile picture.'],

  ['placeholder-1500x500', 'Placeholder 1500x500', 'Generators',
   'The X header across a profile.',
   'Placeholder image, 1500x500 header',
   'A 1500 by 500 placeholder, the header image across the top of an X profile.'],
];

const TOOLS = [...PDF, ...PLACEHOLDER];

const source = readFileSync(file, 'utf8');
const already = new Set([...source.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]));

const wanted = TOOLS.filter(([slug]) => !already.has(slug));
const skipped = TOOLS.length - wanted.length;

const blocks = wanted.map(
  ([slug, name, category, blurb, title, description]) => `  {
    slug: '${slug}',
    name: '${name}',
    category: '${category}',
    blurb: '${blurb.replace(/'/g, "\\'")}',
    title: '${title.replace(/'/g, "\\'")}',
    description:
      '${description.replace(/'/g, "\\'")}',
    live: false,
  },`,
);

if (blocks.length === 0) {
  console.log(`nothing to add, all ${TOOLS.length} slugs are already in the registry`);
} else {
  const anchor = "  {\n    slug: 'docx-viewer',";
  if (!source.includes(anchor)) throw new Error('anchor not found in site.ts');
  writeFileSync(file, source.replace(anchor, blocks.join('\n') + '\n\n' + anchor), 'utf8');
  console.log(`added ${blocks.length} stubs${skipped ? `, skipped ${skipped} already present` : ''}`);
  for (const b of blocks) console.log('  ' + /slug: '([a-z0-9-]+)'/.exec(b)[1]);
}

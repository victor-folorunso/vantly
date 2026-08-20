/**
 * Adds a batch of tool entries to src/lib/site.ts.
 *
 * Entries only. Every one lands as live: false, which means the catch-all
 * serves it, the sitemap ignores it and it renders greyed. A slug exists from
 * the day it is planned so the address never changes when the tool ships, and a
 * page that moves after being linked to loses whatever it had earned.
 *
 * Run once: node --experimental-strip-types scripts/add-tools.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'src/lib/site.ts');

/** slug, name, category, blurb, title, description */
const NEW = [
  // ── Convert, out of PDF ────────────────────────────────────────────────
  ['pdf-to-word', 'PDF to Word', 'Documents', 'Turn a PDF back into an editable document.',
   'Convert PDF to Word (DOCX)', 'Convert a PDF into an editable Word document, keeping the text, headings and tables where they were.'],
  ['pdf-to-png', 'PDF to PNG', 'Documents', 'Every page as a sharp image.',
   'Convert PDF pages to PNG images', 'Turn each page of a PDF into a PNG at the resolution you choose. Pick every page or a range.'],
  ['pdf-to-jpg', 'PDF to JPG', 'Documents', 'Every page as a photo-friendly image.',
   'Convert PDF pages to JPG images', 'Turn each page of a PDF into a JPG. Choose the pages and the resolution.'],
  ['pdf-to-excel', 'PDF to Excel', 'Documents', 'Pull the tables out of a PDF into a spreadsheet.',
   'Convert PDF tables to Excel', 'Extract tables from a PDF into an editable spreadsheet, with the rows and columns preserved.'],
  ['pdf-to-pptx', 'PDF to PowerPoint', 'Documents', 'One slide per page.',
   'Convert PDF to PowerPoint (PPTX)', 'Turn a PDF into a PowerPoint deck, one slide per page.'],
  ['pdf-to-html', 'PDF to HTML', 'Documents', 'A web page from a PDF.',
   'Convert PDF to HTML', 'Turn a PDF into HTML you can publish or edit, with the text and layout carried across.'],
  ['pdf-to-txt', 'PDF to text', 'Documents', 'Just the words, nothing else.',
   'Extract the text from a PDF', 'Pull the plain text out of a PDF, without the formatting, images or layout.'],
  ['pdf-to-epub', 'PDF to EPUB', 'Documents', 'Turn a PDF into an ebook that reflows.',
   'Convert PDF to EPUB', 'Turn a PDF into an EPUB, so the text reflows to fit a phone or an e-reader instead of staying fixed to the page.'],

  // ── Convert, into PDF ──────────────────────────────────────────────────
  ['word-to-pdf', 'Word to PDF', 'Documents', 'A DOCX that looks the same everywhere.',
   'Convert Word to PDF', 'Turn a Word document into a PDF, so the formatting holds on any machine.'],
  ['excel-to-pdf', 'Excel to PDF', 'Documents', 'A spreadsheet that prints predictably.',
   'Convert Excel to PDF', 'Turn a spreadsheet into a PDF, choosing which sheets and how the columns fit the page.'],
  ['pptx-to-pdf', 'PowerPoint to PDF', 'Documents', 'A deck anyone can open.',
   'Convert PowerPoint to PDF', 'Turn a PPTX into a PDF, one page per slide, with the notes kept or dropped.'],
  ['html-to-pdf', 'HTML to PDF', 'Documents', 'A page or a file, printed properly.',
   'Convert HTML to PDF', 'Turn HTML into a PDF with the page size and margins you choose.'],
  ['epub-to-pdf', 'EPUB to PDF', 'Documents', 'An ebook with fixed pages.',
   'Convert EPUB to PDF', 'Turn an EPUB into a PDF at a fixed page size, for printing or for a device that cannot read EPUB.'],
  ['png-to-pdf', 'PNG to PDF', 'Documents', 'Images into one document.',
   'Convert PNG images to PDF', 'Combine PNG images into a single PDF, in the order you choose.'],
  ['jpg-to-pdf', 'JPG to PDF', 'Documents', 'Photos or scans into one document.',
   'Convert JPG images to PDF', 'Combine JPG photos or scans into a single PDF, reordered however you like.'],
  ['pdf-converter', 'PDF converter', 'Documents', 'Whatever you have, into or out of PDF.',
   'PDF converter', 'Convert to and from PDF: Word, Excel, PowerPoint, HTML, EPUB, images and plain text.'],

  // ── Convert, images and tables ─────────────────────────────────────────
  ['image-to-excel', 'Image to Excel', 'Data', 'Read a table out of a photo or screenshot.',
   'Convert an image of a table to Excel', 'Read the table in a photo or screenshot and turn it into a spreadsheet you can edit.'],
  ['image-to-text', 'Image to text', 'Text', 'Pull the words out of a picture.',
   'Extract text from an image', 'Read the text in a photo, screenshot or scan and get it back as text you can copy.'],
  ['merge-images', 'Merge images', 'Images', 'Join pictures into one, across or down.',
   'Merge images into one', 'Combine several images into a single picture, side by side or stacked, with the spacing you choose.'],
  ['add-watermark-image', 'Watermark an image', 'Images', 'Put your mark on a picture, in bulk.',
   'Add a watermark to an image', 'Add text or a logo to your images, positioned and faded how you like, across a whole batch at once.'],

  // ── Media ──────────────────────────────────────────────────────────────
  ['mp4-to-gif', 'MP4 to GIF', 'Media', 'A short clip as a looping image.',
   'Convert MP4 video to GIF', 'Turn a clip into a looping GIF. Trim it, set the frame rate, and keep the file small enough to send.'],
  ['convert-to-audio', 'Convert to audio', 'Media', 'Pull the sound out of anything.',
   'Convert video to audio', 'Extract the audio from a video, or convert between MP3, WAV, M4A and OGG.'],
  ['convert-to-video', 'Convert video', 'Media', 'Move between video formats.',
   'Convert between video formats', 'Convert video to MP4, WebM or MOV, choosing the quality and size.'],
  ['transcribe-audio', 'Transcribe audio', 'Media', 'Turn speech into text you can read.',
   'Transcribe audio to text', 'Turn a recording into text, with timestamps, ready to edit or caption.'],
  ['transcribe-video', 'Transcribe video', 'Media', 'Captions and a transcript from a clip.',
   'Transcribe video to text', 'Turn the speech in a video into a transcript or a subtitle file.'],
  ['vocal-remover', 'Vocal remover', 'Media', 'Separate the voice from the backing.',
   'Remove vocals from a song', 'Split a track into vocals and instrumental, for a backing track or an acapella.'],
  ['noise-remover', 'Noise remover', 'Media', 'Clean up a noisy recording.',
   'Remove background noise from audio', 'Strip hiss, hum and background noise out of a recording without hollowing out the voice.'],
  ['text-to-speech', 'Text to speech', 'Media', 'Read text aloud and save the audio.',
   'Convert text to speech', 'Turn written text into spoken audio you can download.'],

  // ── Organise and optimise ──────────────────────────────────────────────
  ['compress-video', 'Compress video', 'Media', 'Make a video small enough to send.',
   'Compress a video file', 'Reduce a video file size, choosing quality against size and seeing the result before you save it.'],
  ['pdf-ocr', 'PDF OCR', 'Documents', 'Make a scanned PDF searchable.',
   'Make a scanned PDF searchable with OCR', 'Read the text in a scanned PDF and put it back into the file, so it can be searched, selected and copied.'],
  ['scan-to-pdf', 'Scan to PDF', 'Documents', 'Photos of paper, straightened into a document.',
   'Turn photos of documents into a PDF', 'Turn phone photos of paper into a clean PDF: cropped square, straightened and readable.'],
  ['translate-pdf', 'Translate PDF', 'Documents', 'A PDF in another language, laid out the same.',
   'Translate a PDF', 'Translate a PDF into another language while keeping the layout it had.'],

  // ── Edit ───────────────────────────────────────────────────────────────
  ['edit-pdf', 'Edit PDF', 'Documents', 'Change the text and pages in a PDF.',
   'Edit a PDF', 'Change text, add notes, move and delete pages, and save the result.'],
  ['sign-pdf', 'Sign PDF', 'Documents', 'Put your signature on a document.',
   'Sign a PDF', 'Draw, type or upload a signature and place it on a PDF.'],
  ['fill-pdf', 'Fill a PDF form', 'Documents', 'Type into a form instead of printing it.',
   'Fill in a PDF form', 'Type into a PDF form, tick the boxes and save it, without printing anything.'],
  ['watermark-pdf', 'Watermark a PDF', 'Documents', 'Mark a document as a draft or a copy.',
   'Add a watermark to a PDF', 'Add text or an image across the pages of a PDF, angled and faded how you choose.'],
  ['unlock-pdf', 'Unlock PDF', 'Documents', 'Remove a password you already know.',
   'Remove a password from a PDF', 'Take the password off a PDF you can already open, so it stops asking every time.'],
];

let src = readFileSync(FILE, 'utf8');

const existing = new Set([...src.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]));
const toAdd = NEW.filter(([slug]) => !existing.has(slug));
const skipped = NEW.filter(([slug]) => existing.has(slug)).map(([s]) => s);

const block = toAdd
  .map(
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
  )
  .join('\n');

// Appended at the end of the array, so the existing grouping is untouched.
const close = src.lastIndexOf('];');
src = src.slice(0, close) + '\n  // ── Added in bulk, none built yet ──────────────────────────────────────\n' + block + '\n' + src.slice(close);

writeFileSync(FILE, src, 'utf8');
console.log(`added ${toAdd.length} tools`);
if (skipped.length) console.log(`already present, skipped: ${skipped.join(', ')}`);

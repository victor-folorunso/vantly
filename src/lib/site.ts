/**
 * One place for anything that appears in more than one file.
 *
 * The tool list drives the home page, the sitemap, and the routes themselves.
 * Adding a tool means adding one entry here and nothing else: a live tool needs
 * a folder under src/app/<slug>, and anything not yet live is served by the
 * catch-all at src/app/[slug] without a file being created for it.
 *
 * Static routes win over the dynamic one in Next, so a tool graduates simply by
 * gaining its own folder and flipping `live`.
 */

export const SITE = {
  name: 'Vantly',
  url: 'https://vantly.xyz',
  tagline: 'Small tools that do one thing, without asking for anything.',
} as const;

export const CATEGORIES = ['Images', 'PDF', 'Data', 'Text', 'Media'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Tool = {
  slug: string;
  name: string;
  category: Category;
  /** Shown on the card. One line, says what goes in and what comes out. */
  blurb: string;
  /** The <title> and h1. Written for what somebody actually types in. */
  title: string;
  description: string;
  /**
   * What the finished tool will refuse to do to you. Shown on the coming soon
   * page, because it is the only thing worth saying before a tool exists.
   */
  promise?: string;
  /** False until the route exists. Keeps the sitemap free of 404s. */
  live: boolean;
};

export const TOOLS: Tool[] = [
  // ── Images ─────────────────────────────────────────────────────────────────
  {
    slug: 'svg-to-png',
    name: 'SVG to PNG',
    category: 'Images',
    blurb: 'Turn a vector file into a sharp PNG at any size, up to 8K.',
    title: 'SVG to PNG converter, up to 8K with transparency',
    description:
      'Convert SVG to PNG at any resolution, including 4K and 8K, with a transparent background. No resolution cap, no watermark, no sign up. Runs in your browser, so the file never leaves your machine.',
    live: true,
  },
  {
    slug: 'heic-to-jpg',
    name: 'HEIC to JPG',
    category: 'Images',
    blurb: 'Open iPhone photos anywhere. Convert to JPG or WebP in bulk.',
    title: 'HEIC to JPG and WebP converter',
    description:
      'Convert iPhone HEIC photos to JPG or WebP. Bulk conversion, no file limit, no sign up. Runs in your browser.',
    live: true,
  },
  {
    slug: 'image-compressor',
    name: 'Image compressor',
    category: 'Images',
    blurb: 'Make photos smaller without making them look worse.',
    title: 'Compress images without losing quality',
    description:
      'Reduce JPG, PNG and WebP file sizes in your browser. Compare before and after, choose your own quality, convert in bulk. No upload, no watermark, no limit.',
    promise: 'No watermark on the result, and no cap on how many you can do.',
    live: true,
  },
  {
    slug: 'image-resizer',
    name: 'Image resizer',
    category: 'Images',
    blurb: 'Scale a hundred images to fit a size, without stretching any.',
    title: 'Resize images in bulk, keeping the aspect ratio',
    description:
      'Resize images to any longest edge in your browser. Batch resize, aspect ratio always kept, never enlarged, export as JPG, PNG or WebP. No upload and no limit.',
    promise: 'Any pixel value you type, not only the presets.',
    live: true,
  },
  {
    slug: 'favicon-generator',
    name: 'Favicon generator',
    category: 'Images',
    blurb: 'One image in, every icon size a site needs out.',
    title: 'Favicon and app icon generator',
    description:
      'Generate every favicon and app icon size from a single image, with the HTML to paste in. Runs in your browser.',
    promise: 'The full set and the markup, without an account.',
    live: false,
  },

  // ── PDF ────────────────────────────────────────────────────────────────────
  {
    slug: 'pdf-reader',
    name: 'PDF reader',
    category: 'PDF',
    blurb: 'Open a PDF and read it. No plugin, no download, no account.',
    title: 'Open and read a PDF online',
    description:
      'Read any PDF in your browser. Search the text, jump between pages, and nothing is uploaded anywhere.',
    promise: 'It opens the file and shows it to you. That is the whole tool.',
    live: false,
  },
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    category: 'PDF',
    blurb: 'Join several PDFs into one, in the order you choose.',
    title: 'Merge PDF files into one',
    description:
      'Combine multiple PDFs into a single file. Drag to reorder, remove pages you do not want, and keep everything on your own machine.',
    promise: 'No two-files-per-day limit.',
    live: false,
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    category: 'PDF',
    blurb: 'Pull out the pages you need and leave the rest.',
    title: 'Split a PDF or extract pages',
    description:
      'Split a PDF into separate files or extract a page range. Runs in your browser with no upload.',
    promise: 'Any page range, not just the first ten.',
    live: false,
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    category: 'PDF',
    blurb: 'Shrink a PDF that is too big to email.',
    title: 'Compress a PDF to a smaller size',
    description:
      'Reduce PDF file size in your browser. Choose how hard to compress and see the result before you save it.',
    promise: 'No file size ceiling on the free version.',
    live: false,
  },
  {
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'PDF',
    blurb: 'Turn a pile of photos or scans into one PDF.',
    title: 'Convert images to a single PDF',
    description:
      'Combine JPG, PNG and HEIC images into one PDF. Reorder them, choose the page size, and nothing leaves your computer.',
    promise: 'As many images as you like, in the order you put them.',
    live: false,
  },

  // ── Data ───────────────────────────────────────────────────────────────────
  {
    slug: 'csv-viewer',
    name: 'CSV viewer',
    category: 'Data',
    blurb: 'Open a huge CSV that Excel refuses to. Filter and sort it.',
    title: 'Open and filter a large CSV file',
    description:
      'View, sort and filter CSV files too large for a spreadsheet. Handles hundreds of thousands of rows in your browser, with no row limit and no upload.',
    promise: 'Every row, not the first thousand.',
    live: false,
  },
  {
    slug: 'csv-to-json',
    name: 'CSV to JSON',
    category: 'Data',
    blurb: 'Convert between CSV and JSON, either direction.',
    title: 'Convert CSV to JSON and back',
    description:
      'Convert CSV to JSON or JSON to CSV in your browser. Choose the delimiter, handle quoted fields, and keep the file on your machine.',
    promise: 'No row cap and no sign up to download the result.',
    live: false,
  },
  {
    slug: 'json-formatter',
    name: 'JSON formatter',
    category: 'Data',
    blurb: 'Make unreadable JSON readable. Spot the error.',
    title: 'Format and validate JSON',
    description:
      'Format, minify and validate JSON in your browser. Points at the exact position of a syntax error rather than just saying it is invalid.',
    promise: 'It tells you where the error is, not just that there is one.',
    live: false,
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  {
    slug: 'diff-checker',
    name: 'Diff checker',
    category: 'Text',
    blurb: 'Compare two pieces of text and see exactly what changed.',
    title: 'Compare two texts and see the differences',
    description:
      'Find the differences between two blocks of text or two files, line by line or word by word. Runs in your browser.',
    promise: 'No character limit on what you can paste in.',
    live: false,
  },
  {
    slug: 'base64',
    name: 'Base64 encoder',
    category: 'Text',
    blurb: 'Encode or decode Base64, including files and images.',
    title: 'Base64 encode and decode',
    description:
      'Encode text or files to Base64 and decode them back, including data URIs for images. Runs in your browser.',
    promise: 'Files as well as text, with no size limit.',
    live: false,
  },
  {
    slug: 'url-encoder',
    name: 'URL encoder',
    category: 'Text',
    blurb: 'Encode or decode URLs and query strings.',
    title: 'URL encode and decode',
    description:
      'Percent-encode and decode URLs and query strings, with the component and full-URL rules handled separately.',
    live: false,
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown preview',
    category: 'Text',
    blurb: 'Write markdown and see it rendered as you type.',
    title: 'Markdown editor and live preview',
    description:
      'Write markdown with a live preview and export the result as HTML. Runs in your browser with nothing stored.',
    live: false,
  },

  // ── Media ──────────────────────────────────────────────────────────────────
  {
    slug: 'audio-trimmer',
    name: 'Audio trimmer',
    category: 'Media',
    blurb: 'Cut an MP3 down to the part you actually want.',
    title: 'Trim an MP3 or audio file',
    description:
      'Cut and trim audio in your browser. Drag the handles, hear the result, export it. No upload queue and no watermark.',
    promise: 'No upload wait, because the file never goes anywhere.',
    live: false,
  },
  {
    slug: 'video-compressor',
    name: 'Video compressor',
    category: 'Media',
    blurb: 'Make a video small enough to send.',
    title: 'Compress a video file',
    description:
      'Reduce video file size in your browser. Choose the quality, watch the size estimate, and keep the file on your machine.',
    promise: 'No watermark burned into the result.',
    live: false,
  },
  {
    slug: 'srt-shifter',
    name: 'Subtitle shifter',
    category: 'Media',
    blurb: 'Fix subtitles that run a few seconds out of sync.',
    title: 'Shift subtitle timing in an SRT file',
    description:
      'Move every subtitle in an SRT file forward or back by a set number of seconds. Runs in your browser.',
    live: false,
  },
];

export const LIVE_TOOLS = TOOLS.filter((t) => t.live);
export const SOON_TOOLS = TOOLS.filter((t) => !t.live);

export function toolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** Tools grouped for display, skipping any category with nothing in it. */
export function byCategory(tools: Tool[]): { category: Category; tools: Tool[] }[] {
  return CATEGORIES.map((category) => ({
    category,
    tools: tools.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
}

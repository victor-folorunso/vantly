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
  // Converting is one of several things here, not the category. Viewers and
  // editors are coming, and copy that says "converter" everywhere makes the
  // rest look bolted on later.
  tagline: 'Open, convert and change files in your browser, without asking for anything.',
} as const;

export const CATEGORIES = [
  'Images',
  'Documents',
  'Data',
  'Text',
  'Media',
  'Developer',
  'Security',
  'Calculators',
  'Generators',
  'Design',
  'Web',
] as const;
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
    category: 'Documents',
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
    category: 'Documents',
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
    category: 'Documents',
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
    category: 'Documents',
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
    category: 'Documents',
    blurb: 'Turn a pile of photos or scans into one PDF.',
    title: 'Convert images to a single PDF',
    description:
      'Combine JPG, PNG and HEIC images into one PDF. Reorder them, choose the page size, and nothing leaves your computer.',
    promise: 'As many images as you like, in the order you put them.',
    live: false,
  },

  {
    slug: 'docx-viewer',
    name: 'DOCX viewer',
    category: 'Documents',
    blurb: 'Open a Word document without Word.',
    title: 'Open a DOCX file online without Word',
    description:
      'View Word documents in your browser. No Office licence, no account, no upload. Formatting, tables and images are kept.',
    promise: 'It opens the file. No trial, no sign in, no upload.',
    live: false,
  },
  {
    slug: 'pptx-viewer',
    name: 'PPTX viewer',
    category: 'Documents',
    blurb: 'Open a PowerPoint deck without PowerPoint.',
    title: 'Open a PPTX file online without PowerPoint',
    description:
      'View PowerPoint presentations in your browser. Step through the slides, read the notes, and keep the file on your own machine.',
    promise: 'The whole deck, not the first three slides.',
    live: false,
  },
  {
    slug: 'xlsx-viewer',
    name: 'XLSX viewer',
    category: 'Data',
    blurb: 'Open a spreadsheet without Excel.',
    title: 'Open an XLSX file online without Excel',
    description:
      'View Excel spreadsheets in your browser. Every sheet, every row, sorted and filtered, with nothing uploaded.',
    promise: 'Every row and every sheet, not a preview of the first one.',
    live: false,
  },
  {
    slug: 'epub-viewer',
    name: 'EPUB reader',
    category: 'Text',
    blurb: 'Read an ebook without installing a reader.',
    title: 'Open and read an EPUB file online',
    description:
      'Read EPUB ebooks in your browser. Change the text size, jump between chapters, and keep the file on your machine.',
    promise: 'No library account and no upload to read your own book.',
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

  // ── Text ───────────────────────────────────────────────────────────────────
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
    live: true,
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

  // ── Developer ───────────────────────
  {
    slug: 'json-formatter',
    name: 'JSON formatter',
    category: 'Developer',
    blurb: 'Make unreadable JSON readable, and find the error.',
    title: 'Format and validate JSON online',
    description:
      'Format, minify and validate JSON in your browser. Points at the exact position of a syntax error rather than only saying it is invalid.',
    promise: 'It tells you where the error is, not just that there is one.',
    live: false,
  },
  {
    slug: 'xml-formatter',
    name: 'XML formatter',
    category: 'Developer',
    blurb: 'Indent and tidy XML so you can read it.',
    title: 'Format and beautify XML online',
    description:
      'Format, indent and validate XML in your browser. No upload and no size limit.',
    live: false,
  },
  {
    slug: 'html-formatter',
    name: 'HTML formatter',
    category: 'Developer',
    blurb: 'Tidy up minified or messy HTML.',
    title: 'Format and beautify HTML online',
    description:
      'Indent and clean HTML in your browser, or minify it back down.',
    live: false,
  },
  {
    slug: 'css-formatter',
    name: 'CSS formatter',
    category: 'Developer',
    blurb: 'Beautify or minify a stylesheet.',
    title: 'Format, beautify and minify CSS online',
    description:
      'Tidy CSS for reading or strip it down for shipping, in your browser.',
    live: false,
  },
  {
    slug: 'js-formatter',
    name: 'JavaScript formatter',
    category: 'Developer',
    blurb: 'Beautify or minify JavaScript.',
    title: 'Format, beautify and minify JavaScript online',
    description:
      'Indent JavaScript for reading or minify it for shipping. Runs in your browser.',
    live: false,
  },
  {
    slug: 'regex-tester',
    name: 'Regex tester',
    category: 'Developer',
    blurb: 'Write a pattern and watch it match, live.',
    title: 'Test and debug a regular expression online',
    description:
      'Build regular expressions with live highlighting, capture groups and a plain English explanation of what each part does.',
    promise: 'It explains the pattern, not only whether it matched.',
    live: false,
  },
  {
    slug: 'crontab-generator',
    name: 'Crontab generator',
    category: 'Developer',
    blurb: 'Build a cron schedule without guessing the syntax.',
    title: 'Cron expression generator and explainer',
    description:
      'Build and read cron schedules in plain English, with the next run times shown so you can check it does what you meant.',
    promise: 'It shows the next five times it will actually run.',
    live: false,
  },
  {
    slug: 'diff-checker',
    name: 'Diff checker',
    category: 'Developer',
    blurb: 'Compare two texts and see exactly what changed.',
    title: 'Compare two texts and see the differences',
    description:
      'Find what changed between two pieces of text or code, highlighted line by line and word by word.',
    promise: 'No length limit and no account to see the result.',
    live: false,
  },

  // ── Text ────────────────────────────
  {
    slug: 'case-converter',
    name: 'Case converter',
    category: 'Text',
    blurb: 'UPPERCASE, camelCase, snake_case, slugs, all of it.',
    title: 'Convert text case online',
    description:
      'Switch text between uppercase, lowercase, title case, sentence case, camelCase, snake_case, kebab-case and a URL slug.',
    live: true,
  },
  {
    slug: 'word-counter',
    name: 'Word counter',
    category: 'Text',
    blurb: 'Words, characters, sentences and reading time as you type.',
    title: 'Word and character counter',
    description:
      'Count words, characters, sentences and paragraphs as you type, with an estimated reading time.',
    live: true,
  },
  {
    slug: 'lorem-ipsum-generator',
    name: 'Lorem ipsum generator',
    category: 'Text',
    blurb: 'Placeholder text, as much or as little as you need.',
    title: 'Lorem ipsum placeholder text generator',
    description:
      'Generate placeholder text by words, sentences or paragraphs, as plain text or wrapped in HTML.',
    live: false,
  },
  {
    slug: 'text-cleaner',
    name: 'Text cleaner',
    category: 'Text',
    blurb: 'Sort lines, remove duplicates, strip HTML.',
    title: 'Sort lines, remove duplicates and strip HTML tags',
    description:
      'Clean up a list or a block of text: sort it, remove duplicate or empty lines, strip HTML tags, trim whitespace.',
    live: true,
  },

  // ── Security ───────────────────────
  {
    slug: 'hash-generator',
    name: 'Hash generator',
    category: 'Security',
    blurb: 'SHA-256 and friends, for text or a file.',
    title: 'Generate SHA-256, SHA-1 and SHA-512 hashes',
    description:
      'Hash text or a file using the cryptography built into your browser. Nothing is uploaded, which matters more here than anywhere else on the site.',
    promise: 'The file never leaves your machine, which is the entire point of checking a hash.',
    live: true,
  },
  {
    slug: 'password-generator',
    name: 'Password generator',
    category: 'Security',
    blurb: 'Strong passwords, generated on your machine.',
    title: 'Generate a strong random password',
    description:
      'Create random passwords with real cryptographic randomness rather than Math.random. Set the length and character types, and see an honest strength estimate.',
    promise: 'Generated in your browser and never sent anywhere.',
    live: true,
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 encoder',
    category: 'Security',
    blurb: 'Encode or decode Base64, text or files.',
    title: 'Base64 encode and decode online',
    description:
      'Convert text or a file to Base64 and back, including data URIs. Runs in your browser.',
    live: true,
  },
  {
    slug: 'url-encoder',
    name: 'URL encoder',
    category: 'Security',
    blurb: 'Escape or unescape a URL or query string.',
    title: 'URL encode and decode online',
    description:
      'Percent-encode text for safe use in a URL, or decode one you have been given.',
    live: false,
  },

  // ── Calculators ────────────────────
  {
    slug: 'unit-converter',
    name: 'Unit converter',
    category: 'Calculators',
    blurb: 'Length, weight, temperature, area, speed, data.',
    title: 'Convert units of measurement',
    description:
      'Convert between metric and imperial units for length, weight, temperature, area, volume, speed and digital storage.',
    live: false,
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage calculator',
    category: 'Calculators',
    blurb: 'The three percentage questions people actually ask.',
    title: 'Percentage calculator',
    description:
      'Work out what percent of a number, what percentage one number is of another, and percentage increase or decrease.',
    live: false,
  },
  {
    slug: 'tip-calculator',
    name: 'Tip and bill splitter',
    category: 'Calculators',
    blurb: 'Split a bill and work out the tip.',
    title: 'Tip calculator and bill splitter',
    description:
      'Add a tip, split a bill between any number of people, and round the result sensibly.',
    live: false,
  },
  {
    slug: 'compound-interest-calculator',
    name: 'Compound interest',
    category: 'Calculators',
    blurb: 'See what regular saving actually grows into.',
    title: 'Compound interest calculator',
    description:
      'Project savings growth over time with regular contributions, showing the total, the contributions and the interest separately.',
    live: false,
  },
  {
    slug: 'loan-calculator',
    name: 'Loan calculator',
    category: 'Calculators',
    blurb: 'Monthly payment, total interest, full schedule.',
    title: 'Loan and mortgage repayment calculator',
    description:
      'Work out monthly repayments, total interest and a full amortisation schedule for a loan or a mortgage.',
    live: false,
  },
  {
    slug: 'date-calculator',
    name: 'Date calculator',
    category: 'Calculators',
    blurb: 'Days between two dates, or add time to one.',
    title: 'Date difference and duration calculator',
    description:
      'Count the days, weeks or months between two dates, or add and subtract time from a date.',
    live: false,
  },

  // ── Generators ───────────────────
  {
    slug: 'uuid-generator',
    name: 'UUID generator',
    category: 'Generators',
    blurb: 'Version 4 UUIDs, as many as you need.',
    title: 'Generate UUID v4 identifiers',
    description:
      'Generate cryptographically random UUIDs one at a time or in bulk, ready to copy.',
    live: true,
  },
  {
    slug: 'qr-code-generator',
    name: 'QR code generator',
    category: 'Generators',
    blurb: 'A QR code for a link, text or Wi-Fi.',
    title: 'Create a QR code online',
    description:
      'Generate a QR code for a URL, plain text, a phone number or Wi-Fi credentials, and download it as PNG or SVG.',
    promise: 'No tracking redirect in the middle. The code points where you said.',
    live: false,
  },
  {
    slug: 'random-picker',
    name: 'Random picker',
    category: 'Generators',
    blurb: 'Pick a winner from a list, fairly.',
    title: 'Random name and choice picker',
    description:
      'Paste a list and pick one at random, or shuffle the whole thing. Uses real randomness rather than Math.random.',
    live: false,
  },
  {
    slug: 'barcode-generator',
    name: 'Barcode generator',
    category: 'Generators',
    blurb: 'Standard retail and inventory barcodes.',
    title: 'Generate a barcode online',
    description:
      'Create EAN, UPC and Code 128 barcodes and download them as PNG or SVG.',
    live: false,
  },

  // ── Design ──────────────────────
  {
    slug: 'color-converter',
    name: 'Colour converter',
    category: 'Design',
    blurb: 'HEX, RGB, HSL and CMYK, all at once.',
    title: 'Convert colours between HEX, RGB, HSL and CMYK',
    description:
      'Pick a colour and read it in every format at once, with a copy button for each.',
    live: true,
  },
  {
    slug: 'contrast-checker',
    name: 'Contrast checker',
    category: 'Design',
    blurb: 'Check text is readable, to WCAG.',
    title: 'Colour contrast checker for WCAG AA and AAA',
    description:
      'Check whether a text and background pair meets WCAG AA or AAA, with the ratio and a live preview.',
    promise: 'It shows the failing case rather than only a pass or a fail.',
    live: true,
  },
  {
    slug: 'gradient-generator',
    name: 'Gradient generator',
    category: 'Design',
    blurb: 'Build a CSS gradient and copy the code.',
    title: 'CSS gradient generator',
    description:
      'Build linear and radial CSS gradients visually and copy the code out.',
    live: false,
  },
  {
    slug: 'shadow-generator',
    name: 'Box shadow generator',
    category: 'Design',
    blurb: 'Design a CSS shadow by eye.',
    title: 'CSS box shadow generator',
    description:
      'Build a CSS box shadow with a live preview, including multiple layered shadows.',
    live: false,
  },
  {
    slug: 'svg-optimizer',
    name: 'SVG optimiser',
    category: 'Design',
    blurb: 'Strip the junk out of an exported SVG.',
    title: 'Optimise and minify SVG files',
    description:
      'Remove editor metadata and shrink SVG files, with a before and after preview so you can see nothing broke.',
    live: false,
  },

  // ── Web ─────────────────────────
  {
    slug: 'utm-builder',
    name: 'UTM link builder',
    category: 'Web',
    blurb: 'Build a tracked campaign URL correctly.',
    title: 'UTM campaign URL builder',
    description:
      'Build Google Analytics campaign URLs with the right parameter names, and keep a list of the ones you have made.',
    live: false,
  },
  {
    slug: 'robots-txt-generator',
    name: 'Robots.txt generator',
    category: 'Web',
    blurb: 'Write a robots.txt without getting it wrong.',
    title: 'Robots.txt generator',
    description:
      'Build a robots.txt with the rules you actually want, including whether AI crawlers are allowed.',
    live: false,
  },
  {
    slug: 'meta-tag-generator',
    name: 'Meta tag generator',
    category: 'Web',
    blurb: 'Title, description and social cards, previewed.',
    title: 'Meta tag and Open Graph generator',
    description:
      'Write the meta and Open Graph tags for a page and see how the result looks as a search result and as a shared card.',
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

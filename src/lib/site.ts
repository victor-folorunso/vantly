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
  repo: 'https://github.com/victor-folorunso/vantly',
  url: 'https://vantly.xyz',
  tagline: 'Everyday tools for everyone.',
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
      'Convert SVG to PNG at any size, including 4K and 8K, with transparency. No resolution cap, no watermark, and the file stays on your machine.',
    live: true,
  },
  {
    slug: 'heic-to-jpg',
    name: 'HEIC to JPG',
    category: 'Images',
    blurb: 'Open iPhone photos anywhere. Convert to JPG or WebP in bulk.',
    title: 'HEIC to JPG and WebP converter',
    description:
      'Convert iPhone HEIC photos to JPG or WebP. Bulk conversion, no file limit. Runs in your browser.',
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
    live: true,
  },

  // ── PDF ────────────────────────────────────────────────────────────────────
  {
    slug: 'pdf-reader',
    name: 'PDF reader',
    category: 'Documents',
    blurb: 'Open a PDF and read it. No plugin and no download.',
    title: 'Read a PDF in your browser, no reader needed',
    description:
      'Read any PDF in your browser. Search the text, jump between pages.',
    live: true,
  },
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    category: 'Documents',
    blurb: 'Join several PDFs into one, in the order you choose.',
    title: 'Merge PDF files into one',
    description:
      'Combine multiple PDFs into a single file. Drag to reorder and remove the pages you do not want.',
    live: true,
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    category: 'Documents',
    blurb: 'Pull out the pages you need and leave the rest.',
    title: 'Split a PDF or extract pages',
    description:
      'Split a PDF into separate files or extract a page range. Runs in your browser.',
    live: true,
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    category: 'Documents',
    blurb: 'Shrink a PDF that is too big to email.',
    title: 'Compress a PDF to a smaller size',
    description:
      'Reduce PDF file size in your browser. Choose how hard to compress and see the result before you save it.',
    live: true,
  },
  {
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'Documents',
    blurb: 'Turn a pile of photos or scans into one PDF.',
    title: 'Convert images to a single PDF',
    description:
      'Combine JPG, PNG and HEIC images into one PDF. Reorder them and choose the page size.',
    live: true,
  },

  // ── Reviewed batch: what a general tool site is expected to carry ────────
  {
    slug: 'unix-timestamp-converter',
    name: 'Unix timestamp converter',
    category: 'Developer',
    blurb: 'Turn 1755734400 into a date, and back again.',
    title: 'Unix timestamp to date converter',
    description:
      'Convert a Unix or epoch timestamp to a readable date in your own timezone or UTC, and a date back to a timestamp. Seconds and milliseconds.',
    live: false,
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT decoder',
    category: 'Developer',
    blurb: 'Read what is inside a token, without sending it anywhere.',
    title: 'Decode a JWT and read its claims',
    description:
      'Paste a JSON Web Token and read its header, payload and expiry. Decoded in your browser, so the token never leaves your machine.',
    live: false,
  },
  {
    slug: 'html-entity-encoder',
    name: 'HTML entity encoder',
    category: 'Developer',
    blurb: 'Escape the characters that break a page, or decode them back.',
    title: 'HTML entity encoder and decoder',
    description:
      'Turn angle brackets, ampersands and quotes into HTML entities so they render as text, or decode entities back into the characters they stand for.',
    live: false,
  },
  {
    slug: 'html-minifier',
    name: 'HTML minifier',
    category: 'Developer',
    blurb: 'Strip the whitespace before you ship.',
    title: 'Minify HTML online',
    description:
      'Remove whitespace and comments from HTML to make the file smaller.',
    live: false,
  },
  {
    slug: 'css-minifier',
    name: 'CSS minifier',
    category: 'Developer',
    blurb: 'Strip the whitespace before you ship.',
    title: 'Minify CSS online',
    description:
      'Remove whitespace and comments from CSS to make the file smaller.',
    live: false,
  },
  {
    slug: 'js-minifier',
    name: 'JavaScript minifier',
    category: 'Developer',
    blurb: 'Strip the whitespace before you ship.',
    title: 'Minify JavaScript online',
    description:
      'Remove whitespace and comments from JavaScript to make the file smaller.',
    live: false,
  },
  {
    slug: 'sql-formatter',
    name: 'SQL formatter',
    category: 'Developer',
    blurb: 'Indent a query you can no longer read.',
    title: 'Format and indent SQL',
    description:
      'Indent a SQL query so the joins and conditions line up, whichever dialect it is written in.',
    live: false,
  },
  {
    slug: 'json-validator',
    name: 'JSON validator',
    category: 'Developer',
    blurb: 'Find the comma that is breaking it.',
    title: 'Validate JSON and find the error',
    description:
      'Check whether JSON is valid and see exactly which line and character breaks it, rather than a bare parse error.',
    live: false,
  },
  {
    slug: 'subnet-calculator',
    name: 'Subnet calculator',
    category: 'Developer',
    blurb: 'The range, the mask, and how many hosts fit.',
    title: 'IPv4 subnet and CIDR calculator',
    description:
      'Enter an address and a CIDR prefix to get the network address, broadcast address, usable host range, mask and host count.',
    live: false,
  },
  {
    slug: 'slug-generator',
    name: 'Slug generator',
    category: 'Text',
    blurb: 'Turn a headline into the bit that goes in the address bar.',
    title: 'Turn a title into a URL slug',
    description:
      'Convert a title into a clean URL slug: lowercase, hyphens, accents folded down and punctuation removed.',
    live: false,
  },
  {
    slug: 'find-and-replace',
    name: 'Find and replace',
    category: 'Text',
    blurb: 'Swap every instance at once, with a pattern if you need one.',
    title: 'Find and replace text online',
    description:
      'Replace every instance of a word or a pattern in a block of text, with case sensitivity and regular expressions if you want them.',
    live: false,
  },
  {
    slug: 'markdown-to-html',
    name: 'Markdown to HTML',
    category: 'Text',
    blurb: 'Get the HTML your markdown turns into.',
    title: 'Convert Markdown to HTML',
    description:
      'Paste markdown and copy the HTML it produces, ready for a page or a template.',
    live: false,
  },
  {
    slug: 'character-counter',
    name: 'Character counter',
    category: 'Text',
    blurb: 'Against the limit for a post, a title or a description.',
    title: 'Character counter with post and meta limits',
    description:
      'Count characters as you type and see how you sit against the limits that matter: a post, a page title, a meta description.',
    live: false,
  },
  {
    slug: 'fancy-text-generator',
    name: 'Fancy text generator',
    category: 'Text',
    blurb: 'Bold and italic letters that survive a plain text box.',
    title: 'Fancy text generator for bios and captions',
    description:
      'Turn ordinary text into bold, italic, script or monospace letters using Unicode, so the styling survives in a box that allows no formatting.',
    live: false,
  },
  {
    slug: 'placeholder-image-generator',
    name: 'Placeholder image generator',
    category: 'Generators',
    blurb: 'A grey box at exactly the size you need.',
    title: 'Generate a placeholder image at any size',
    description:
      'Make a placeholder image at any dimensions, with its size written on it, for mockups and layout work.',
    live: true,
  },
  {
    slug: 'signature-generator',
    name: 'Signature generator',
    category: 'Generators',
    blurb: 'Draw your name, download it with a transparent background.',
    title: 'Draw a signature and download it as a PNG',
    description:
      'Draw your signature with a mouse, a finger or a stylus and download it as a transparent PNG to drop into a document.',
    live: false,
  },
  {
    slug: 'wheel-spinner',
    name: 'Wheel spinner',
    category: 'Generators',
    blurb: 'Put the options on a wheel and let it decide.',
    title: 'Spin a wheel to pick a name at random',
    description:
      'Enter the options, spin the wheel, and let it choose. For picking a name, a winner, or where to eat.',
    live: false,
  },
  {
    slug: 'tally-counter',
    name: 'Tally counter',
    category: 'Generators',
    blurb: 'Click to count, with a key to press instead.',
    title: 'Online tally counter',
    description:
      'Count by clicking or by pressing a key, with several counters at once and a total that survives a reload.',
    live: false,
  },
  {
    slug: 'online-stopwatch',
    name: 'Stopwatch and timer',
    category: 'Generators',
    blurb: 'Count up, count down, and get told when it is done.',
    title: 'Online stopwatch and countdown timer',
    description:
      'A stopwatch with laps and a countdown timer that sounds when it reaches zero. Nothing to install.',
    live: false,
  },
  {
    slug: 'bpm-tapper',
    name: 'BPM tapper',
    category: 'Media',
    blurb: 'Tap along and read the tempo.',
    title: 'Tap tempo BPM counter',
    description:
      'Tap a key in time with the music and read the beats per minute, averaged over the taps you have made.',
    live: false,
  },
  {
    slug: 'statistics-calculator',
    name: 'Statistics calculator',
    category: 'Calculators',
    blurb: 'Mean, median, mode and standard deviation from a list.',
    title: 'Mean, median, mode and standard deviation calculator',
    description:
      'Paste a list of numbers and get the mean, median, mode, range, variance and standard deviation, with both the sample and population figures.',
    live: false,
  },
  {
    slug: 'fraction-to-decimal',
    name: 'Fraction to decimal',
    category: 'Calculators',
    blurb: 'And decimal back to a fraction in its lowest terms.',
    title: 'Fraction to decimal converter',
    description:
      'Convert a fraction to a decimal, and a decimal back to a fraction reduced to its lowest terms, including recurring decimals.',
    live: false,
  },
  {
    slug: 'profit-margin-calculator',
    name: 'Profit margin calculator',
    category: 'Calculators',
    blurb: 'Margin, markup, and the price you need to charge.',
    title: 'Profit margin and markup calculator',
    description:
      'Work out gross margin, markup and the selling price you need from cost and revenue. Margin and markup are not the same number.',
    live: false,
  },
  {
    slug: 'roi-calculator',
    name: 'ROI calculator',
    category: 'Calculators',
    blurb: 'What you got back against what you put in.',
    title: 'Return on investment calculator',
    description:
      'Work out return on investment from what you spent and what came back, as a percentage and as a figure, annualised if you give it a period.',
    live: false,
  },
  {
    slug: 'file-checksum',
    name: 'File checksum',
    category: 'Security',
    blurb: 'Check a download really is what it claims to be.',
    title: 'Verify a file checksum, MD5 or SHA-256',
    description:
      'Work out the checksum of a file and compare it against the one the download page gave you. Read on your machine, never uploaded.',
    live: false,
  },
  {
    slug: 'htpasswd-generator',
    name: 'Htpasswd generator',
    category: 'Security',
    blurb: 'The line to paste into an Apache or Nginx password file.',
    title: 'Generate an htpasswd line',
    description:
      'Create the username and hashed password line for a .htpasswd file, hashed in your browser so the password is never transmitted.',
    live: false,
  },
  {
    slug: 'flexbox-generator',
    name: 'Flexbox generator',
    category: 'Design',
    blurb: 'Move the boxes until it looks right, then take the CSS.',
    title: 'Visual CSS flexbox generator',
    description:
      'Set the flex properties and watch the boxes move, then copy the CSS. For working out which property does the thing you want.',
    live: false,
  },
  {
    slug: 'css-grid-generator',
    name: 'CSS grid generator',
    category: 'Design',
    blurb: 'Draw the grid, take the CSS.',
    title: 'Visual CSS grid generator',
    description:
      'Build a grid by setting rows, columns and gaps, see it laid out, and copy the CSS it produces.',
    live: false,
  },
  {
    slug: 'sitemap-generator',
    name: 'Sitemap generator',
    category: 'Web',
    blurb: 'Paste your addresses, get the XML Google wants.',
    title: 'Generate a sitemap.xml',
    description:
      'Turn a list of addresses into a valid sitemap.xml, with change frequency and priority, ready to upload and submit.',
    live: false,
  },

  {
    slug: 'rotate-pdf',
    name: 'Rotate PDF',
    category: 'Documents',
    blurb: 'Turn the pages that came in sideways.',
    title: 'Rotate PDF pages and save them that way',
    description:
      'Rotate some or all pages of a PDF and save it, so a scan that came in sideways stops being sideways.',
    live: false,
  },
  {
    slug: 'delete-pdf-pages',
    name: 'Delete PDF pages',
    category: 'Documents',
    blurb: 'Drop the blank scans and the pages you do not need.',
    title: 'Delete pages from a PDF',
    description:
      'Remove pages from a PDF and download what is left, without reordering anything else.',
    live: false,
  },
  {
    slug: 'extract-pdf-pages',
    name: 'Extract PDF pages',
    category: 'Documents',
    blurb: 'Pull a few pages out into their own file.',
    title: 'Extract pages from a PDF into a new file',
    description:
      'Pick the pages you want and save them as a separate PDF, leaving the original alone.',
    live: false,
  },
  {
    slug: 'organize-pdf',
    name: 'Organize PDF',
    category: 'Documents',
    blurb: 'Reorder, rotate and remove pages in one go.',
    title: 'Reorder and organise the pages of a PDF',
    description:
      'Move pages around, turn them the right way up and drop the ones you do not want, then save the result.',
    live: false,
  },
  {
    slug: 'add-page-numbers',
    name: 'Add page numbers',
    category: 'Documents',
    blurb: 'Number a PDF that arrived without any.',
    title: 'Add page numbers to a PDF',
    description:
      'Stamp page numbers onto a PDF, choosing where they sit, what they count from and how they are formatted.',
    live: false,
  },
  {
    slug: 'crop-pdf',
    name: 'Crop PDF',
    category: 'Documents',
    blurb: 'Cut the margins off a scan.',
    title: 'Crop the margins of a PDF',
    description:
      'Trim the edges of every page, for a scan with wide margins or a document that needs to fit a different paper size.',
    live: false,
  },
  {
    slug: 'redact-pdf',
    name: 'Redact PDF',
    category: 'Documents',
    blurb: 'Black something out so it is actually gone.',
    title: 'Redact a PDF properly',
    description:
      'Cover text so it cannot be read, and so it cannot be copied back out either, which a black rectangle drawn on top does not do.',
    live: false,
  },
  {
    slug: 'protect-pdf',
    name: 'Protect PDF',
    category: 'Documents',
    blurb: 'Put a password on it.',
    title: 'Add a password to a PDF',
    description:
      'Lock a PDF with a password so it cannot be opened without one.',
    live: false,
  },
  {
    slug: 'flatten-pdf',
    name: 'Flatten PDF',
    category: 'Documents',
    blurb: 'Lock the form answers and annotations into the page.',
    title: 'Flatten a PDF so it cannot be edited',
    description:
      'Turn form fields, annotations and layers into part of the page itself, so nobody can change the answers later.',
    live: false,
  },
  {
    slug: 'pdf-annotator',
    name: 'PDF annotator',
    category: 'Documents',
    blurb: 'Highlight, draw and leave a note.',
    title: 'Annotate a PDF in your browser',
    description:
      'Highlight text, draw on the page and add notes, then save a copy with the markings in it.',
    live: false,
  },
  {
    slug: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    category: 'Documents',
    blurb: 'The archival format an institution asked you for.',
    title: 'Convert a PDF to PDF/A',
    description:
      'Convert a PDF to PDF/A, the long term archival format that libraries, courts and universities ask for.',
    live: false,
  },
  {
    slug: 'odt-to-pdf',
    name: 'ODT to PDF',
    category: 'Documents',
    blurb: 'OpenDocument text, without OpenOffice.',
    title: 'Convert ODT to PDF',
    description:
      'Turn an OpenDocument text file into a PDF, keeping the fonts, tables and page breaks.',
    live: false,
  },
  {
    slug: 'ods-to-pdf',
    name: 'ODS to PDF',
    category: 'Documents',
    blurb: 'OpenDocument spreadsheet, without OpenOffice.',
    title: 'Convert ODS to PDF',
    description:
      'Turn an OpenDocument spreadsheet into a PDF, laid out as it prints.',
    live: false,
  },
  {
    slug: 'odp-to-pdf',
    name: 'ODP to PDF',
    category: 'Documents',
    blurb: 'OpenDocument slides, without OpenOffice.',
    title: 'Convert ODP to PDF',
    description:
      'Turn an OpenDocument presentation into a PDF, one slide per page.',
    live: false,
  },
  {
    slug: 'rtf-to-pdf',
    name: 'RTF to PDF',
    category: 'Documents',
    blurb: 'Rich text, kept as it looks.',
    title: 'Convert RTF to PDF',
    description:
      'Turn a rich text file into a PDF with its formatting intact.',
    live: false,
  },
  {
    slug: 'txt-to-pdf',
    name: 'TXT to PDF',
    category: 'Documents',
    blurb: 'Plain text on a proper page.',
    title: 'Convert a text file to PDF',
    description:
      'Turn a plain text file into a PDF, laid out on a page with margins you can print.',
    live: false,
  },
  {
    slug: 'csv-to-pdf',
    name: 'CSV to PDF',
    category: 'Documents',
    blurb: 'A spreadsheet as a table you can send.',
    title: 'Convert CSV to PDF',
    description:
      'Turn a CSV into a PDF table, ready to attach to something or print.',
    live: false,
  },
  {
    slug: 'pages-to-pdf',
    name: 'Pages to PDF',
    category: 'Documents',
    blurb: 'The Apple format nobody else can open.',
    title: 'Convert an Apple Pages file to PDF',
    description:
      'Turn a Pages document into a PDF anyone can open, without a Mac.',
    live: false,
  },
  {
    slug: 'placeholder-1920x1080',
    name: 'Placeholder 1920x1080',
    category: 'Generators',
    blurb: 'Full HD, the default for a hero or a slide.',
    title: 'Placeholder image, 1920x1080',
    description:
      'A 1920 by 1080 placeholder image. Full HD and the usual size for a hero image, a slide or a video frame.',
    live: true,
  },
  {
    slug: 'placeholder-1280x720',
    name: 'Placeholder 1280x720',
    category: 'Generators',
    blurb: 'The YouTube thumbnail size.',
    title: 'Placeholder image, 1280x720',
    description:
      'A 1280 by 720 placeholder image. The size YouTube asks for a thumbnail, and 720p video.',
    live: true,
  },
  {
    slug: 'placeholder-1200x630',
    name: 'Placeholder 1200x630',
    category: 'Generators',
    blurb: 'The link preview size for social posts.',
    title: 'Placeholder image, 1200x630, for Open Graph',
    description:
      'A 1200 by 630 placeholder. The size a link preview uses when a page is shared, set by Open Graph and used by Facebook, LinkedIn and X.',
    live: true,
  },
  {
    slug: 'placeholder-1080x1080',
    name: 'Placeholder 1080x1080',
    category: 'Generators',
    blurb: 'The square Instagram post.',
    title: 'Placeholder image, 1080x1080 square',
    description:
      'A 1080 by 1080 square placeholder, the size of an Instagram feed post.',
    live: true,
  },
  {
    slug: 'placeholder-1080x1920',
    name: 'Placeholder 1080x1920',
    category: 'Generators',
    blurb: 'The vertical story and reel size.',
    title: 'Placeholder image, 1080x1920 vertical',
    description:
      'A 1080 by 1920 vertical placeholder, the size of a story, a reel and a short.',
    live: true,
  },
  {
    slug: 'placeholder-800x600',
    name: 'Placeholder 800x600',
    category: 'Generators',
    blurb: 'The old faithful four by three.',
    title: 'Placeholder image, 800x600',
    description:
      'An 800 by 600 placeholder image, four by three, still the default in plenty of templates.',
    live: true,
  },
  {
    slug: 'placeholder-600x400',
    name: 'Placeholder 600x400',
    category: 'Generators',
    blurb: 'A card or a thumbnail in a grid.',
    title: 'Placeholder image, 600x400',
    description:
      'A 600 by 400 placeholder image, the usual shape for a card or a thumbnail in a grid.',
    live: true,
  },
  {
    slug: 'placeholder-300x250',
    name: 'Placeholder 300x250',
    category: 'Generators',
    blurb: 'The medium rectangle ad slot.',
    title: 'Placeholder image, 300x250 medium rectangle',
    description:
      'A 300 by 250 placeholder, the medium rectangle, the most used display ad size there is.',
    live: true,
  },
  {
    slug: 'placeholder-728x90',
    name: 'Placeholder 728x90',
    category: 'Generators',
    blurb: 'The leaderboard banner across the top.',
    title: 'Placeholder image, 728x90 leaderboard',
    description:
      'A 728 by 90 placeholder, the leaderboard banner that runs across the top of a page.',
    live: true,
  },
  {
    slug: 'placeholder-160x600',
    name: 'Placeholder 160x600',
    category: 'Generators',
    blurb: 'The skyscraper down the side.',
    title: 'Placeholder image, 160x600 skyscraper',
    description:
      'A 160 by 600 placeholder, the wide skyscraper that runs down the side of a page.',
    live: true,
  },
  {
    slug: 'placeholder-400x400',
    name: 'Placeholder 400x400',
    category: 'Generators',
    blurb: 'A square avatar or profile picture.',
    title: 'Placeholder image, 400x400 square avatar',
    description:
      'A 400 by 400 square placeholder, the usual size for an avatar or a profile picture.',
    live: true,
  },
  {
    slug: 'placeholder-1500x500',
    name: 'Placeholder 1500x500',
    category: 'Generators',
    blurb: 'The X header across a profile.',
    title: 'Placeholder image, 1500x500 header',
    description:
      'A 1500 by 500 placeholder, the header image across the top of an X profile.',
    live: true,
  },

  {
    slug: 'random-name-generator',
    name: 'Random name generator',
    category: 'Generators',
    blurb: 'First names, surnames, or both, from anywhere.',
    title: 'Random name generator',
    description:
      'Generate random names from a choice of regions, as first names, surnames or full names, one or a thousand at a time.',
    live: true,
  },
  {
    slug: 'business-name-generator',
    name: 'Business name generator',
    category: 'Generators',
    blurb: 'Names for a thing you have not named yet.',
    title: 'Business name generator',
    description:
      'Generate business name ideas from a word you start with, or from nothing at all, in several naming styles.',
    live: true,
  },
  {
    slug: 'fantasy-name-generator',
    name: 'Fantasy name generator',
    category: 'Generators',
    blurb: 'For characters, places and things that do not exist.',
    title: 'Fantasy name generator',
    description:
      'Generate names for characters, places, guilds and creatures, built from syllable patterns rather than a fixed list.',
    live: true,
  },
  {
    slug: 'address-generator',
    name: 'Address generator',
    category: 'Generators',
    blurb: 'Fake addresses for filling a test database.',
    title: 'Generate fake addresses for testing',
    description:
      'Generate addresses in the right shape for a country, for seeding a test database or filling a form while developing. Invented, not real, and not deliverable.',
    live: false,
  },
  {
    slug: 'domain-name-checker',
    name: 'Domain name checker',
    category: 'Web',
    blurb: 'See whether a name is taken, across the endings.',
    title: 'Check whether a domain name is available',
    description:
      'Check whether a domain is registered across com, net, org, io, xyz and more, asking the registries directly.',
    live: true,
  },
  {
    slug: 'domain-name-generator',
    name: 'Domain name generator',
    category: 'Web',
    blurb: 'Ideas, with a word to start from or without one.',
    title: 'Domain name idea generator',
    description:
      'Generate available domain name ideas from a seed word or from nothing, and check which ones are still free.',
    live: true,
  },
  {
    slug: 'tonic-solfa-converter',
    name: 'Tonic solfa converter',
    category: 'Media',
    blurb: 'Note names into doh ray me, in any key.',
    title: 'Convert note names to tonic solfa',
    description:
      'Convert note names into tonic solfa in whichever key you choose, and back the other way. For choirs, church music and anyone taught by solfa rather than staff.',
    live: true,
  },
  {
    slug: 'song-to-tonic-solfa',
    name: 'Song to tonic solfa',
    category: 'Media',
    blurb: 'Hum or play a melody, read it back as solfa.',
    title: 'Turn a melody into tonic solfa',
    description:
      'Work out the tonic solfa of a melody from a recording, by following the pitch. Works on one line at a time: a voice, a whistle, a single instrument.',
    live: false,
  },
  {
    slug: 'video-to-mp3',
    name: 'Video to MP3',
    category: 'Media',
    blurb: 'Keep the sound, drop the picture.',
    title: 'Extract the audio from a video as MP3',
    description:
      'Pull the audio out of a video file and save it as an MP3, choosing the quality.',
    live: true,
  },
  {
    slug: 'mp3-to-video',
    name: 'MP3 to video',
    category: 'Media',
    blurb: 'A track plus a still, for somewhere that only takes video.',
    title: 'Turn an MP3 into a video file',
    description:
      'Make a video from an audio file and a still picture, for uploading a track somewhere that only accepts video.',
    live: false,
  },

  {
    slug: 'typing-speed-test',
    name: 'Typing speed test',
    category: 'Generators',
    blurb: 'How fast you actually type, in words a minute.',
    title: 'Typing speed test, words per minute',
    description:
      'Find your typing speed in words per minute over 15, 30, 60 or 120 seconds, with accuracy and a net speed that ignores what you got wrong.',
    live: true,
  },

  {
    slug: 'markdown-viewer',
    name: 'Markdown viewer',
    category: 'Text',
    blurb: 'Open a markdown file and read it properly.',
    title: 'Open and read a markdown file',
    description:
      'Open a README or any markdown file and read it rendered rather than raw, editing it live if you want to.',
    live: false,
  },
  {
    slug: 'html-viewer',
    name: 'HTML viewer',
    category: 'Text',
    blurb: 'See what a page looks like, and change it as you look.',
    title: 'View and edit HTML live',
    description:
      'Paste or open HTML and see it rendered next to the source, with edits appearing as you type.',
    live: false,
  },

  {
    slug: 'docx-viewer',
    name: 'DOCX viewer',
    category: 'Documents',
    blurb: 'Open a Word document without Word.',
    title: 'Open a DOCX file online without Word',
    description:
      'View Word documents in your browser. No Office licence. Formatting, tables and images are kept.',
    live: true,
  },
  {
    slug: 'pptx-viewer',
    name: 'PPTX viewer',
    category: 'Documents',
    blurb: 'Open a PowerPoint deck without PowerPoint.',
    title: 'Open a PPTX file online without PowerPoint',
    description:
      'View PowerPoint presentations in your browser. Step through the slides and read the notes.',
    live: true,
  },
  {
    slug: 'xlsx-viewer',
    name: 'XLSX viewer',
    category: 'Data',
    blurb: 'Open a spreadsheet without Excel.',
    title: 'Open an XLSX file online without Excel',
    description:
      'View Excel spreadsheets in your browser. Every sheet, every row, sorted and filtered.',
    live: true,
  },
  {
    slug: 'pdf-viewer',
    name: 'PDF viewer',
    category: 'Documents',
    blurb: 'Open a PDF without a reader. A page at a time, or all of it.',
    title: 'Open and read a PDF online',
    description:
      'View a PDF in your browser. Step through it a page at a time or scroll the whole document. Nothing is uploaded.',
    live: true,
  },
  {
    slug: 'epub-viewer',
    name: 'EPUB reader',
    category: 'Text',
    blurb: 'Read an ebook without installing a reader.',
    title: 'Open and read an EPUB file online',
    description:
      'Read EPUB ebooks in your browser. Change the text size and jump between chapters.',
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
      'View, sort and filter CSV files too large for a spreadsheet. Handles hundreds of thousands of rows in your browser, with no row limit.',
    live: true,
  },
  {
    slug: 'csv-to-json',
    name: 'CSV to JSON',
    category: 'Data',
    blurb: 'Convert between CSV and JSON, either direction.',
    title: 'Convert CSV to JSON and back',
    description:
      'Convert CSV to JSON or JSON to CSV in your browser. Choose the delimiter and handle quoted fields.',
    live: true,
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
    live: true,
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
    live: true,
  },

  // ── Media ──────────────────────────────────────────────────────────────────
  {
    slug: 'audio-trimmer',
    name: 'Audio trimmer',
    category: 'Media',
    blurb: 'Cut an MP3 down to the part you actually want.',
    title: 'Trim an MP3 or audio file',
    description:
      'Cut and trim audio in your browser. Drag the handles, hear the result, export it.',
    live: true,
  },
  {
    slug: 'video-compressor',
    name: 'Video compressor',
    category: 'Media',
    blurb: 'Make a video small enough to send.',
    title: 'Compress a video file',
    description:
      'Reduce video file size in your browser. Choose the quality and watch the size estimate.',
    live: true,
  },
  {
    slug: 'srt-shifter',
    name: 'Subtitle shifter',
    category: 'Media',
    blurb: 'Fix subtitles that run a few seconds out of sync.',
    title: 'Shift subtitle timing in an SRT file',
    description:
      'Move every subtitle in an SRT file forward or back by a set number of seconds. Runs in your browser.',
    live: true,
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
    live: true,
  },
  {
    slug: 'xml-formatter',
    name: 'XML formatter',
    category: 'Developer',
    blurb: 'Indent and tidy XML so you can read it.',
    title: 'Format and beautify XML online',
    description:
      'Format, indent and validate XML in your browser.',
    live: true,
  },
  {
    slug: 'html-formatter',
    name: 'HTML formatter',
    category: 'Developer',
    blurb: 'Tidy up minified or messy HTML.',
    title: 'Format and beautify HTML online',
    description:
      'Indent and clean HTML in your browser, or minify it back down.',
    live: true,
  },
  {
    slug: 'css-formatter',
    name: 'CSS formatter',
    category: 'Developer',
    blurb: 'Beautify or minify a stylesheet.',
    title: 'Format, beautify and minify CSS online',
    description:
      'Tidy CSS for reading or strip it down for shipping, in your browser.',
    live: true,
  },
  {
    slug: 'js-formatter',
    name: 'JavaScript formatter',
    category: 'Developer',
    blurb: 'Beautify or minify JavaScript.',
    title: 'Format, beautify and minify JavaScript online',
    description:
      'Indent JavaScript for reading or minify it for shipping. Runs in your browser.',
    live: true,
  },
  {
    slug: 'regex-tester',
    name: 'Regex tester',
    category: 'Developer',
    blurb: 'Write a pattern and watch it match, live.',
    title: 'Test and debug a regular expression online',
    description:
      'Build regular expressions with live highlighting, capture groups and a plain English explanation of what each part does.',
    live: true,
  },
  {
    slug: 'crontab-generator',
    name: 'Crontab generator',
    category: 'Developer',
    blurb: 'Build a cron schedule without guessing the syntax.',
    title: 'Cron expression generator and explainer',
    description:
      'Build and read cron schedules in plain English, with the next run times shown so you can check it does what you meant.',
    live: true,
  },
  {
    slug: 'diff-checker',
    name: 'Diff checker',
    category: 'Developer',
    blurb: 'Compare two texts and see exactly what changed.',
    title: 'Compare two texts and see the differences',
    description:
      'Find what changed between two pieces of text or code, highlighted line by line and word by word.',
    live: true,
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
    live: true,
  },
  {
    slug: 'remove-empty-lines',
    name: 'Remove empty lines',
    category: 'Text',
    blurb: 'Strip the blank lines out of a list or a block of text.',
    title: 'Remove empty lines from text',
    description:
      'Delete blank and whitespace-only lines from any list or block of text. Paste it in, get it back clean. Runs in your browser.',
    live: true,
  },
  {
    slug: 'remove-duplicate-lines',
    name: 'Remove duplicate lines',
    category: 'Text',
    blurb: 'Keep the first of each line and drop the repeats.',
    title: 'Remove duplicate lines from a list',
    description:
      'Delete repeated lines from a list, keeping the first of each and the original order. Paste it in and copy the result.',
    live: true,
  },
  {
    slug: 'sort-lines',
    name: 'Sort lines',
    category: 'Text',
    blurb: 'Put a list in order, forwards, backwards or reversed.',
    title: 'Sort lines alphabetically',
    description:
      'Sort any list of lines A to Z or Z to A, reverse the order, or remove duplicates while you are there.',
    live: true,
  },
  {
    slug: 'strip-html-tags',
    name: 'Strip HTML tags',
    category: 'Text',
    blurb: 'Pull the plain text out of HTML, tags and all.',
    title: 'Strip HTML tags and get plain text',
    description:
      'Remove every HTML tag and return just the readable text. Script and style contents go too, and entities are decoded.',
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

  // ── Calculators ────────────────────
  {
    slug: 'unit-converter',
    name: 'Unit converter',
    category: 'Calculators',
    blurb: 'Length, weight, temperature, area, speed, data.',
    title: 'Convert units of measurement',
    description:
      'Convert between metric and imperial units for length, weight, temperature, area, volume, speed and digital storage.',
    live: true,
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage calculator',
    category: 'Calculators',
    blurb: 'The three percentage questions people actually ask.',
    title: 'Percentage calculator',
    description:
      'Work out what percent of a number, what percentage one number is of another, and percentage increase or decrease.',
    live: true,
  },
  {
    slug: 'tip-calculator',
    name: 'Tip and bill splitter',
    category: 'Calculators',
    blurb: 'Split a bill and work out the tip.',
    title: 'Tip calculator and bill splitter',
    description:
      'Add a tip, split a bill between any number of people, and round the result sensibly.',
    live: true,
  },
  {
    slug: 'compound-interest-calculator',
    name: 'Compound interest',
    category: 'Calculators',
    blurb: 'See what regular saving actually grows into.',
    title: 'Compound interest calculator',
    description:
      'Project savings growth over time with regular contributions, showing the total, the contributions and the interest separately.',
    live: true,
  },
  {
    slug: 'loan-calculator',
    name: 'Loan calculator',
    category: 'Calculators',
    blurb: 'Monthly payment, total interest, full schedule.',
    title: 'Loan and mortgage repayment calculator',
    description:
      'Work out monthly repayments, total interest and a full amortisation schedule for a loan or a mortgage.',
    live: true,
  },
  {
    slug: 'date-calculator',
    name: 'Date calculator',
    category: 'Calculators',
    blurb: 'Days between two dates, or add time to one.',
    title: 'Date difference and duration calculator',
    description:
      'Count the days, weeks or months between two dates, or add and subtract time from a date.',
    live: true,
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
    live: true,
  },
  {
    slug: 'random-picker',
    name: 'Random picker',
    category: 'Generators',
    blurb: 'Pick a winner from a list, fairly.',
    title: 'Random name and choice picker',
    description:
      'Paste a list and pick one at random, or shuffle the whole thing. Uses real randomness rather than Math.random.',
    live: true,
  },
  {
    slug: 'barcode-generator',
    name: 'Barcode generator',
    category: 'Generators',
    blurb: 'Standard retail and inventory barcodes.',
    title: 'Generate a barcode online',
    description:
      'Create EAN, UPC and Code 128 barcodes and download them as PNG or SVG.',
    live: true,
  },

  // ── Design ──────────────────────
  {
    slug: 'color-palette',
    name: 'Colour palette',
    category: 'Design',
    blurb: 'Pull a palette out of an image, or build one from a colour.',
    title: 'Colour palette generator and extractor',
    description:
      'Extract a colour palette from any image, or build harmonies and shades from one colour. Copy the result as hex, CSS variables, Tailwind, SCSS or JSON.',
    live: true,
  },
  {
    slug: 'hex-to-rgb',
    name: 'HEX to RGB',
    category: 'Design',
    blurb: 'Paste a hex colour like #b4530a and get the RGB values, plus HSL and CMYK.',
    title: 'Convert a hex colour code to RGB',
    description:
      'Paste a hex colour like #b4530a and get the RGB values, plus HSL and CMYK. Runs in your browser.',
    live: true,
  },
  {
    slug: 'rgb-to-hex',
    name: 'RGB to HEX',
    category: 'Design',
    blurb: 'Paste RGB values and get the hex code, plus HSL and CMYK.',
    title: 'Convert RGB to a hex colour code',
    description:
      'Paste RGB values and get the hex code, plus HSL and CMYK. Runs in your browser.',
    live: true,
  },
  {
    slug: 'hex-to-hsl',
    name: 'HEX to HSL',
    category: 'Design',
    blurb: 'Paste a hex colour and get HSL, the format worth learning because lightness is one number.',
    title: 'Convert a hex colour code to HSL',
    description:
      'Paste a hex colour and get HSL, the format worth learning because lightness is one number. Runs in your browser.',
    live: true,
  },
  {
    slug: 'hsl-to-hex',
    name: 'HSL to HEX',
    category: 'Design',
    blurb: 'Paste HSL values and get the hex code, plus RGB and CMYK.',
    title: 'Convert HSL to a hex colour code',
    description:
      'Paste HSL values and get the hex code, plus RGB and CMYK. Runs in your browser.',
    live: true,
  },
  {
    slug: 'rgb-to-hsl',
    name: 'RGB to HSL',
    category: 'Design',
    blurb: 'Paste RGB values and get HSL, which makes a colour easier to adjust.',
    title: 'Convert RGB to HSL',
    description:
      'Paste RGB values and get HSL, which makes a colour easier to adjust. Runs in your browser.',
    live: true,
  },
  {
    slug: 'hsl-to-rgb',
    name: 'HSL to RGB',
    category: 'Design',
    blurb: 'Paste HSL values and get RGB, plus hex and CMYK.',
    title: 'Convert HSL to RGB',
    description:
      'Paste HSL values and get RGB, plus hex and CMYK. Runs in your browser.',
    live: true,
  },
  {
    slug: 'rgb-to-cmyk',
    name: 'RGB to CMYK',
    category: 'Design',
    blurb: 'Paste RGB values and get an approximate CMYK breakdown for print.',
    title: 'Convert RGB to CMYK for print',
    description:
      'Paste RGB values and get an approximate CMYK breakdown for print. Runs in your browser.',
    live: true,
  },
  {
    slug: 'cmyk-to-rgb',
    name: 'CMYK to RGB',
    category: 'Design',
    blurb: 'Paste CMYK values and get RGB and hex for screen use.',
    title: 'Convert CMYK to RGB',
    description:
      'Paste CMYK values and get RGB and hex for screen use. Runs in your browser.',
    live: true,
  },
  {
    slug: 'hex-to-cmyk',
    name: 'HEX to CMYK',
    category: 'Design',
    blurb: 'Paste a hex colour and get an approximate CMYK breakdown for print.',
    title: 'Convert a hex colour code to CMYK',
    description:
      'Paste a hex colour and get an approximate CMYK breakdown for print. Runs in your browser.',
    live: true,
  },
  {
    slug: 'color-picker',
    name: 'Colour picker',
    category: 'Design',
    blurb: 'Pick a colour and read it back as hex, RGB, HSL and CMYK.',
    title: 'Pick a colour and get every code',
    description:
      'Pick a colour and read it back as hex, RGB, HSL and CMYK. Runs in your browser.',
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
    live: true,
  },
  {
    slug: 'shadow-generator',
    name: 'Box shadow generator',
    category: 'Design',
    blurb: 'Design a CSS shadow by eye.',
    title: 'CSS box shadow generator',
    description:
      'Build a CSS box shadow with a live preview, including multiple layered shadows.',
    live: true,
  },
  {
    slug: 'svg-optimizer',
    name: 'SVG optimiser',
    category: 'Design',
    blurb: 'Strip the junk out of an exported SVG.',
    title: 'Optimise and minify SVG files',
    description:
      'Remove editor metadata and shrink SVG files, with a before and after preview so you can see nothing broke.',
    live: true,
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
    live: true,
  },
  {
    slug: 'robots-txt-generator',
    name: 'Robots.txt generator',
    category: 'Web',
    blurb: 'Write a robots.txt without getting it wrong.',
    title: 'Robots.txt generator',
    description:
      'Build a robots.txt with the rules you actually want, including whether AI crawlers are allowed.',
    live: true,
  },
  {
    slug: 'meta-tag-generator',
    name: 'Meta tag generator',
    category: 'Web',
    blurb: 'Title, description and social cards, previewed.',
    title: 'Meta tag and Open Graph generator',
    description:
      'Write the meta and Open Graph tags for a page and see how the result looks as a search result and as a shared card.',
    live: true,
  },

  // ── Added in bulk, none built yet ──────────────────────────────────────
  {
    slug: 'pdf-to-png',
    name: 'PDF to PNG',
    category: 'Documents',
    blurb: 'Every page as a sharp image.',
    title: 'Convert PDF pages to PNG images',
    description:
      'Turn each page of a PDF into a PNG at the resolution you choose. Pick every page or a range.',
    live: true,
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    category: 'Documents',
    blurb: 'Every page as a photo-friendly image.',
    title: 'Convert PDF pages to JPG images',
    description:
      'Turn each page of a PDF into a JPG. Choose the pages and the resolution.',
    live: true,
  },
  {
    slug: 'pdf-to-html',
    name: 'PDF to HTML',
    category: 'Documents',
    blurb: 'A web page from a PDF.',
    title: 'Convert PDF to HTML',
    description:
      'Turn a PDF into HTML you can publish or edit, with the text and layout carried across.',
    live: false,
  },
  {
    slug: 'pdf-to-txt',
    name: 'PDF to text',
    category: 'Documents',
    blurb: 'Just the words, nothing else.',
    title: 'Extract the text from a PDF',
    description:
      'Pull the plain text out of a PDF, without the formatting, images or layout.',
    live: true,
  },
  {
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    category: 'Documents',
    blurb: 'A DOCX that looks the same everywhere.',
    title: 'Convert Word to PDF',
    description:
      'Turn a Word document into a PDF, so the formatting holds on any machine.',
    live: true,
  },
  {
    slug: 'excel-to-pdf',
    name: 'Excel to PDF',
    category: 'Documents',
    blurb: 'A spreadsheet that prints predictably.',
    title: 'Convert Excel to PDF',
    description:
      'Turn a spreadsheet into a PDF, choosing which sheets and how the columns fit the page.',
    live: true,
  },
  {
    slug: 'pptx-to-pdf',
    name: 'PowerPoint to PDF',
    category: 'Documents',
    blurb: 'A deck anyone can open.',
    title: 'Convert PowerPoint to PDF',
    description:
      'Turn a PPTX into a PDF, one page per slide, with the notes kept or dropped.',
    live: true,
  },
  {
    slug: 'html-to-pdf',
    name: 'HTML to PDF',
    category: 'Documents',
    blurb: 'A page or a file, printed properly.',
    title: 'Convert HTML to PDF',
    description:
      'Turn HTML into a PDF with the page size and margins you choose.',
    live: true,
  },
  {
    slug: 'epub-to-pdf',
    name: 'EPUB to PDF',
    category: 'Documents',
    blurb: 'An ebook with fixed pages.',
    title: 'Convert EPUB to PDF',
    description:
      'Turn an EPUB into a PDF at a fixed page size, for printing or for a device that cannot read EPUB.',
    live: true,
  },
  {
    slug: 'png-to-pdf',
    name: 'PNG to PDF',
    category: 'Documents',
    blurb: 'Images into one document.',
    title: 'Convert PNG images to PDF',
    description:
      'Combine PNG images into a single PDF, in the order you choose.',
    live: true,
  },
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    category: 'Documents',
    blurb: 'Photos or scans into one document.',
    title: 'Convert JPG images to PDF',
    description:
      'Combine JPG photos or scans into a single PDF, reordered however you like.',
    live: true,
  },
  {
    slug: 'pdf-converter',
    name: 'PDF converter',
    category: 'Documents',
    blurb: 'Whatever you have, into or out of PDF.',
    title: 'PDF converter',
    description:
      'Convert to and from PDF: Word, Excel, PowerPoint, HTML, EPUB, images and plain text.',
    live: true,
  },
  {
    slug: 'image-to-text',
    name: 'Image to text',
    category: 'Text',
    blurb: 'Pull the words out of a picture.',
    title: 'Extract text from an image',
    description:
      'Read the text in a photo, screenshot or scan and get it back as text you can copy.',
    live: true,
  },
  {
    slug: 'merge-images',
    name: 'Merge images',
    category: 'Images',
    blurb: 'Join pictures into one, across or down.',
    title: 'Merge images into one',
    description:
      'Combine several images into a single picture, side by side or stacked, with the spacing you choose.',
    live: true,
  },
  {
    slug: 'add-watermark-image',
    name: 'Watermark an image',
    category: 'Images',
    blurb: 'Put your mark on a picture, in bulk.',
    title: 'Add a watermark to an image',
    description:
      'Add text or a logo to your images, positioned and faded how you like, across a whole batch at once.',
    live: true,
  },
  {
    slug: 'mp4-to-gif',
    name: 'MP4 to GIF',
    category: 'Media',
    blurb: 'A short clip as a looping image.',
    title: 'Convert MP4 video to GIF',
    description:
      'Turn a clip into a looping GIF. Trim it, set the frame rate, and keep the file small enough to send.',
    live: true,
  },
  {
    slug: 'convert-to-audio',
    name: 'Convert to audio',
    category: 'Media',
    blurb: 'Pull the sound out of anything.',
    title: 'Convert video to audio',
    description:
      'Extract the audio from a video, or convert between MP3, WAV, M4A and OGG.',
    live: true,
  },
  {
    slug: 'convert-to-video',
    name: 'Convert video',
    category: 'Media',
    blurb: 'Move between video formats.',
    title: 'Convert between video formats',
    description:
      'Convert video to MP4, WebM or MOV, choosing the quality and size.',
    live: true,
  },
  {
    slug: 'compress-video',
    name: 'Compress video',
    category: 'Media',
    blurb: 'Make a video small enough to send.',
    title: 'Make a video smaller online',
    description:
      'Reduce a video file size, choosing quality against size and seeing the result before you save it.',
    live: true,
  },
  {
    slug: 'pdf-ocr',
    name: 'PDF OCR',
    category: 'Documents',
    blurb: 'Make a scanned PDF searchable.',
    title: 'Make a scanned PDF searchable with OCR',
    description:
      'Read the text in a scanned PDF and put it back into the file, so it can be searched, selected and copied.',
    live: true,
  },
  {
    slug: 'scan-to-pdf',
    name: 'Scan to PDF',
    category: 'Documents',
    blurb: 'Photos of paper, straightened into a document.',
    title: 'Turn photos of documents into a PDF',
    description:
      'Turn phone photos of paper into a clean PDF: cropped square, straightened and readable.',
    live: false,
  },
  {
    slug: 'edit-pdf',
    name: 'Edit PDF',
    category: 'Documents',
    blurb: 'Change the text and pages in a PDF.',
    title: 'Edit a PDF',
    description:
      'Change text, add notes, move and delete pages, and save the result.',
    live: false,
  },
  {
    slug: 'sign-pdf',
    name: 'Sign PDF',
    category: 'Documents',
    blurb: 'Put your signature on a document.',
    title: 'Sign a PDF',
    description:
      'Draw, type or upload a signature and place it on a PDF.',
    live: true,
  },
  {
    slug: 'fill-pdf',
    name: 'Fill a PDF form',
    category: 'Documents',
    blurb: 'Type into a form instead of printing it.',
    title: 'Fill in a PDF form',
    description:
      'Type into a PDF form, tick the boxes and save it, without printing anything.',
    live: true,
  },
  {
    slug: 'watermark-pdf',
    name: 'Watermark a PDF',
    category: 'Documents',
    blurb: 'Mark a document as a draft or a copy.',
    title: 'Add a watermark to a PDF',
    description:
      'Add text or an image across the pages of a PDF, angled and faded how you choose.',
    live: true,
  },
  {
    slug: 'unlock-pdf',
    name: 'Unlock PDF',
    category: 'Documents',
    blurb: 'Remove a password you already know.',
    title: 'Remove a password from a PDF',
    description:
      'Take the password off a PDF you can already open, so it stops asking every time.',
    live: true,
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

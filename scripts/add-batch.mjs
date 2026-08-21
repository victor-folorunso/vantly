/**
 * Adds the reviewed batch of tools to the registry.
 *
 * A one-off, kept in the repo because the reasoning for what was left out
 * matters more than the list itself, and a commit message is not where anyone
 * will look for it.
 *
 * Everything added here runs in the browser. The suggestions that needed a
 * server to answer at all, DNS and WHOIS lookups, HTTP header and TLS
 * certificate checks, IP geolocation, live currency rates, an API request
 * tester, were left out on purpose: each one costs a request every time it is
 * used and earns nothing, which is the reverse of how the rest of the site
 * pays for itself. A page load is the billable event here; a page that has to
 * call out to answer is a page that costs money to be popular.
 *
 * Run: node --experimental-strip-types scripts/add-batch.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/lib/site.ts');

const TOOLS = [
  ['unix-timestamp-converter', 'Unix timestamp converter', 'Developer',
   'Turn 1755734400 into a date, and back again.',
   'Unix timestamp to date converter',
   'Convert a Unix or epoch timestamp to a readable date in your own timezone or UTC, and a date back to a timestamp. Seconds and milliseconds.'],

  ['jwt-decoder', 'JWT decoder', 'Developer',
   'Read what is inside a token, without sending it anywhere.',
   'Decode a JWT and read its claims',
   'Paste a JSON Web Token and read its header, payload and expiry. Decoded in your browser, so the token never leaves your machine.'],

  ['html-entity-encoder', 'HTML entity encoder', 'Developer',
   'Escape the characters that break a page, or decode them back.',
   'HTML entity encoder and decoder',
   'Turn angle brackets, ampersands and quotes into HTML entities so they render as text, or decode entities back into the characters they stand for.'],

  ['html-minifier', 'HTML minifier', 'Developer',
   'Strip the whitespace before you ship.',
   'Minify HTML online',
   'Remove whitespace and comments from HTML to make the file smaller.'],

  ['css-minifier', 'CSS minifier', 'Developer',
   'Strip the whitespace before you ship.',
   'Minify CSS online',
   'Remove whitespace and comments from CSS to make the file smaller.'],

  ['js-minifier', 'JavaScript minifier', 'Developer',
   'Strip the whitespace before you ship.',
   'Minify JavaScript online',
   'Remove whitespace and comments from JavaScript to make the file smaller.'],

  ['sql-formatter', 'SQL formatter', 'Developer',
   'Indent a query you can no longer read.',
   'Format and indent SQL',
   'Indent a SQL query so the joins and conditions line up, whichever dialect it is written in.'],

  ['json-validator', 'JSON validator', 'Developer',
   'Find the comma that is breaking it.',
   'Validate JSON and find the error',
   'Check whether JSON is valid and see exactly which line and character breaks it, rather than a bare parse error.'],

  ['subnet-calculator', 'Subnet calculator', 'Developer',
   'The range, the mask, and how many hosts fit.',
   'IPv4 subnet and CIDR calculator',
   'Enter an address and a CIDR prefix to get the network address, broadcast address, usable host range, mask and host count.'],

  ['slug-generator', 'Slug generator', 'Text',
   'Turn a headline into the bit that goes in the address bar.',
   'Turn a title into a URL slug',
   'Convert a title into a clean URL slug: lowercase, hyphens, accents folded down and punctuation removed.'],

  ['find-and-replace', 'Find and replace', 'Text',
   'Swap every instance at once, with a pattern if you need one.',
   'Find and replace text online',
   'Replace every instance of a word or a pattern in a block of text, with case sensitivity and regular expressions if you want them.'],

  ['markdown-to-html', 'Markdown to HTML', 'Text',
   'Get the HTML your markdown turns into.',
   'Convert Markdown to HTML',
   'Paste markdown and copy the HTML it produces, ready for a page or a template.'],

  ['character-counter', 'Character counter', 'Text',
   'Against the limit for a post, a title or a description.',
   'Character counter with post and meta limits',
   'Count characters as you type and see how you sit against the limits that matter: a post, a page title, a meta description.'],

  ['fancy-text-generator', 'Fancy text generator', 'Text',
   'Bold and italic letters that survive a plain text box.',
   'Fancy text generator for bios and captions',
   'Turn ordinary text into bold, italic, script or monospace letters using Unicode, so the styling survives in a box that allows no formatting.'],

  ['placeholder-image-generator', 'Placeholder image generator', 'Generators',
   'A grey box at exactly the size you need.',
   'Generate a placeholder image at any size',
   'Make a placeholder image at any dimensions, with its size written on it, for mockups and layout work.'],

  ['signature-generator', 'Signature generator', 'Generators',
   'Draw your name, download it with a transparent background.',
   'Draw a signature and download it as a PNG',
   'Draw your signature with a mouse, a finger or a stylus and download it as a transparent PNG to drop into a document.'],

  ['wheel-spinner', 'Wheel spinner', 'Generators',
   'Put the options on a wheel and let it decide.',
   'Spin a wheel to pick a name at random',
   'Enter the options, spin the wheel, and let it choose. For picking a name, a winner, or where to eat.'],

  ['tally-counter', 'Tally counter', 'Generators',
   'Click to count, with a key to press instead.',
   'Online tally counter',
   'Count by clicking or by pressing a key, with several counters at once and a total that survives a reload.'],

  ['online-stopwatch', 'Stopwatch and timer', 'Generators',
   'Count up, count down, and get told when it is done.',
   'Online stopwatch and countdown timer',
   'A stopwatch with laps and a countdown timer that sounds when it reaches zero. Nothing to install.'],

  ['bpm-tapper', 'BPM tapper', 'Media',
   'Tap along and read the tempo.',
   'Tap tempo BPM counter',
   'Tap a key in time with the music and read the beats per minute, averaged over the taps you have made.'],

  ['statistics-calculator', 'Statistics calculator', 'Calculators',
   'Mean, median, mode and standard deviation from a list.',
   'Mean, median, mode and standard deviation calculator',
   'Paste a list of numbers and get the mean, median, mode, range, variance and standard deviation, with both the sample and population figures.'],

  ['fraction-to-decimal', 'Fraction to decimal', 'Calculators',
   'And decimal back to a fraction in its lowest terms.',
   'Fraction to decimal converter',
   'Convert a fraction to a decimal, and a decimal back to a fraction reduced to its lowest terms, including recurring decimals.'],

  ['profit-margin-calculator', 'Profit margin calculator', 'Calculators',
   'Margin, markup, and the price you need to charge.',
   'Profit margin and markup calculator',
   'Work out gross margin, markup and the selling price you need from cost and revenue. Margin and markup are not the same number.'],

  ['roi-calculator', 'ROI calculator', 'Calculators',
   'What you got back against what you put in.',
   'Return on investment calculator',
   'Work out return on investment from what you spent and what came back, as a percentage and as a figure, annualised if you give it a period.'],

  ['file-checksum', 'File checksum', 'Security',
   'Check a download really is what it claims to be.',
   'Verify a file checksum, MD5 or SHA-256',
   'Work out the checksum of a file and compare it against the one the download page gave you. Read on your machine, never uploaded.'],

  ['htpasswd-generator', 'Htpasswd generator', 'Security',
   'The line to paste into an Apache or Nginx password file.',
   'Generate an htpasswd line',
   'Create the username and hashed password line for a .htpasswd file, hashed in your browser so the password is never transmitted.'],

  ['flexbox-generator', 'Flexbox generator', 'Design',
   'Move the boxes until it looks right, then take the CSS.',
   'Visual CSS flexbox generator',
   'Set the flex properties and watch the boxes move, then copy the CSS. For working out which property does the thing you want.'],

  ['css-grid-generator', 'CSS grid generator', 'Design',
   'Draw the grid, take the CSS.',
   'Visual CSS grid generator',
   'Build a grid by setting rows, columns and gaps, see it laid out, and copy the CSS it produces.'],

  ['sitemap-generator', 'Sitemap generator', 'Web',
   'Paste your addresses, get the XML Google wants.',
   'Generate a sitemap.xml',
   'Turn a list of addresses into a valid sitemap.xml, with change frequency and priority, ready to upload and submit.'],
];

const source = readFileSync(file, 'utf8');
const already = new Set([...source.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]));

const blocks = TOOLS.filter(([slug]) => !already.has(slug)).map(
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
  console.log('nothing to add, every slug is already in the registry');
} else {
  const anchor = "  {\n    slug: 'docx-viewer',";
  if (!source.includes(anchor)) throw new Error('anchor not found');
  const banner = `  // ── Reviewed batch: what a general tool site is expected to carry ────────\n`;
  writeFileSync(file, source.replace(anchor, banner + blocks.join('\n') + '\n\n' + anchor), 'utf8');
  console.log(`added ${blocks.length} tools:`);
  console.log(blocks.map((b) => '  ' + /slug: '([a-z0-9-]+)'/.exec(b)[1]).join('\n'));
}

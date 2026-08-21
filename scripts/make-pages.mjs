/**
 * Generates tool pages that are a component plus a prop.
 *
 * The same reason as make-pdf-pages: a dozen pages differing only in one prop
 * and one sentence is a dozen chances to typo a slug, and a slug that does not
 * match its folder is a page nobody can reach.
 *
 * Refuses to write a page whose slug is not in the registry, because a page
 * with no registry entry has no title, no description and no place in the
 * sitemap, and it fails at build rather than here.
 *
 * Run: node --experimental-strip-types scripts/make-pages.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TOOLS } from '../src/lib/site.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  // Formatters. The component already handles all five languages, so these
  // are the same tool pointed at a different default.
  { slug: 'xml-formatter', component: 'CodeFormatter', props: 'initial="xml"',
    sub: 'Indent XML so you can read it, and find the tag that is not closed.' },
  { slug: 'html-formatter', component: 'CodeFormatter', props: 'initial="html"',
    sub: 'Indent HTML so you can read it.' },
  { slug: 'css-formatter', component: 'CodeFormatter', props: 'initial="css"',
    sub: 'Indent CSS so you can read it, or strip it down to ship.' },
  { slug: 'js-formatter', component: 'CodeFormatter', props: 'initial="js"',
    sub: 'Indent JavaScript so you can read it, or strip it down to ship.' },

  // Everything LibreOffice turns into a PDF.
  { slug: 'word-to-pdf', component: 'ConvertToPdf', props: 'from="word"',
    sub: 'Keep the fonts, tables and page breaks. No Word licence needed.' },
  { slug: 'excel-to-pdf', component: 'ConvertToPdf', props: 'from="excel"',
    sub: 'Every sheet, laid out as it prints.' },
  { slug: 'pptx-to-pdf', component: 'ConvertToPdf', props: 'from="powerpoint"',
    sub: 'One slide per page, ready to send to someone without PowerPoint.' },
  { slug: 'epub-to-pdf', component: 'ConvertToPdf', props: 'from="epub"',
    sub: 'Turn an ebook into a document you can print.' },
  { slug: 'html-to-pdf', component: 'ConvertToPdf', props: 'from="html"',
    sub: 'Turn a saved web page into a PDF.' },
  { slug: 'pdf-converter', component: 'ConvertToPdf', props: 'from="any"',
    sub: 'Word, Excel, PowerPoint, EPUB or HTML, all into a PDF.' },

  // Pure browser tools, no dependency and no server.
  { slug: 'lorem-ipsum-generator', component: 'LoremIpsum', props: '',
    sub: 'Placeholder text in the amount you need, by paragraph, sentence or word.' },
  { slug: 'regex-tester', component: 'RegexTester', props: '',
    sub: 'See what your pattern matches, highlighted in the text itself.' },
  { slug: 'random-picker', component: 'RandomPicker', props: '',
    sub: 'Draw a name, pick a winner, or shuffle a list into a running order.' },
  { slug: 'date-calculator', component: 'DateCalculator', props: '',
    sub: 'Days between two dates, or the date a number of days from one.' },
  { slug: 'markdown-preview', component: 'MarkdownPreview', props: '',
    sub: 'Type on the left, read the result on the right.' },
  { slug: 'csv-viewer', component: 'CsvTools', props: 'mode="view"',
    sub: 'Open a CSV too big for Excel. Search it, read it, no upload.' },
  { slug: 'csv-to-json', component: 'CsvTools', props: 'mode="json"',
    sub: 'Numbers stay numbers and empty cells become null.' },

  // Builders and generators. All canvas or plain CSS.
  { slug: 'favicon-generator', component: 'FaviconGenerator', props: '',
    sub: 'Every icon a site needs, from one picture, with the head tag to paste.' },
  { slug: 'merge-images', component: 'ImageCompose', props: 'mode="merge"',
    sub: 'Join pictures into one, across or down, without stretching any of them.' },
  { slug: 'add-watermark-image', component: 'ImageCompose', props: 'mode="watermark"',
    sub: 'Stamp your text on a picture, in a corner or tiled across the whole thing.' },
  { slug: 'crontab-generator', component: 'CrontabGenerator', props: '',
    sub: 'Build the expression, and read back in plain words when it will run.' },
  { slug: 'gradient-generator', component: 'CssBuilder', props: 'mode="gradient"',
    sub: 'Build a CSS gradient and see it at full size, not in a swatch.' },
  { slug: 'shadow-generator', component: 'CssBuilder', props: 'mode="shadow"',
    sub: 'Build a box shadow and copy the CSS.' },
  { slug: 'svg-optimizer', component: 'SvgOptimizer', props: '',
    sub: 'Strip the editor leftovers your icons are carrying.' },
  { slug: 'base64', component: 'TextTool', props: 'preset="base64"',
    sub: 'Encode text or a file to Base64, or decode it back.' },


  // Recognising words in pictures. Tesseract, in the browser.
  { slug: 'image-to-text', component: 'OcrTool', props: 'mode="image"',
    sub: 'Pull the words out of a screenshot, a photo of a page, or a scan.' },
  { slug: 'pdf-ocr', component: 'OcrTool', props: 'mode="pdf"',
    sub: 'For a PDF that is pictures of words, where selecting text does nothing.' },

  // PDF editing, all pdf-lib in the browser.
  { slug: 'fill-pdf', component: 'PdfForm', props: '',
    sub: 'Type into the boxes the form already has, then lock the answers in.' },
  { slug: 'sign-pdf', component: 'PdfSign', props: '',
    sub: 'Draw your name or upload a picture of it, and place it on the page.' },
  { slug: 'compress-pdf', component: 'PdfCompress', props: '',
    sub: 'For the one that is too big to email. Lossless, or much smaller.' },
  { slug: 'pdf-reader', component: 'PdfViewer', props: '',
    sub: 'Read a PDF a page at a time, or scroll the whole thing.' },

  // Subtitles are a text file, so this one needs no video machinery at all.
  { slug: 'srt-shifter', component: 'SubtitleShifter', props: '',
    sub: 'Move subtitles earlier or later, fix frame rate drift, and swap between SRT and VTT.' },

  // Placeholder images. One component, and a page for each size people are
  // actually told to supply, because the size is the search.
  { slug: 'placeholder-image-generator', component: 'PlaceholderImage', props: '',
    sub: 'Any size you need, drawn here and downloaded. No service to call and no link to rot.' },
  { slug: 'placeholder-1920x1080', component: 'PlaceholderImage', props: 'width={1920} height={1080} fixed',
    sub: 'Full HD, and what a hero image or a slide is usually asked for.' },
  { slug: 'placeholder-1280x720', component: 'PlaceholderImage', props: 'width={1280} height={720} fixed',
    sub: 'What YouTube asks for a thumbnail.' },
  { slug: 'placeholder-1200x630', component: 'PlaceholderImage', props: 'width={1200} height={630} fixed',
    sub: 'What a link preview uses when a page gets shared.' },
  { slug: 'placeholder-1080x1080', component: 'PlaceholderImage', props: 'width={1080} height={1080} fixed',
    sub: 'The square Instagram feed post.' },
  { slug: 'placeholder-1080x1920', component: 'PlaceholderImage', props: 'width={1080} height={1920} fixed',
    sub: 'Vertical, for a story, a reel or a short.' },
  { slug: 'placeholder-800x600', component: 'PlaceholderImage', props: 'width={800} height={600} fixed',
    sub: 'Four by three, still the default in plenty of templates.' },
  { slug: 'placeholder-600x400', component: 'PlaceholderImage', props: 'width={600} height={400} fixed',
    sub: 'A card or a thumbnail in a grid.' },
  { slug: 'placeholder-300x250', component: 'PlaceholderImage', props: 'width={300} height={250} fixed',
    sub: 'The medium rectangle, the most used display ad size there is.' },
  { slug: 'placeholder-728x90', component: 'PlaceholderImage', props: 'width={728} height={90} fixed',
    sub: 'The leaderboard banner across the top of a page.' },
  { slug: 'placeholder-160x600', component: 'PlaceholderImage', props: 'width={160} height={600} fixed',
    sub: 'The wide skyscraper down the side of a page.' },
  { slug: 'placeholder-400x400', component: 'PlaceholderImage', props: 'width={400} height={400} fixed',
    sub: 'A square avatar or profile picture.' },
  { slug: 'placeholder-1500x500', component: 'PlaceholderImage', props: 'width={1500} height={500} fixed',
    sub: 'The header across the top of an X profile.' },

  // Movable doh, which is how a great many people were taught to read music.
  { slug: 'tonic-solfa-converter', component: 'SolfaConverter', props: '',
    sub: 'Note names into doh ray me in any key, and back the other way.' },

  // Codes and a keyboard test, all drawn locally.
  { slug: 'qr-code-generator', component: 'CodeGenerator', props: 'kind="qr"',
    sub: 'A link, a wifi network or a contact card, downloaded as PNG or SVG.' },
  { slug: 'barcode-generator', component: 'CodeGenerator', props: 'kind="barcode"',
    sub: 'Code 128, EAN, UPC and the rest, checked as you type.' },
  { slug: 'typing-speed-test', component: 'TypingTest', props: '',
    sub: 'Words a minute over 15, 30, 60 or 120 seconds, with accuracy.' },

  // Names and domains. The domain pair asks RDAP, which answers browsers.
  { slug: 'random-name-generator', component: 'NameGenerator', props: 'mode="random"',
    sub: 'First names, surnames or both, from a choice of regions.' },
  { slug: 'business-name-generator', component: 'NameGenerator', props: 'mode="business"',
    sub: 'Names for a company, from a word you start with or from nothing.' },
  { slug: 'fantasy-name-generator', component: 'NameGenerator', props: 'mode="fantasy"',
    sub: 'Built from syllables, so the supply does not run out.' },
  { slug: 'domain-name-checker', component: 'DomainTools', props: 'mode="check"',
    sub: 'Asks the registries themselves, not whether the name resolves.' },
  { slug: 'domain-name-generator', component: 'DomainTools', props: 'mode="ideas"',
    sub: 'Ideas from a seed word or from nothing, checked as they are made.' },
];

const TPL = ({ slug, component, props, sub }) => `import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import ${component} from '@/components/${component}';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('${slug}')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: \`\${SITE.url}/${slug}\` },
  openGraph: { title: tool.title, description: tool.description, url: \`\${SITE.url}/${slug}\` },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: tool.name,
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: \`\${SITE.url}/${slug}\`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">${sub}</p>

        <div className="mt-10">
          <${component}${props ? ' ' + props : ''} />
        </div>

        <ToolDocs tool="${slug}" />
      </div>
    </>
  );
}
`;

const known = new Set(TOOLS.map((t) => t.slug));
let written = 0;

for (const page of PAGES) {
  if (!known.has(page.slug)) {
    console.error(`skipped ${page.slug}: not in the registry`);
    continue;
  }
  const dir = join(root, 'src/app', page.slug);
  if (existsSync(join(dir, 'page.tsx'))) {
    console.log(`kept   ${page.slug}, already written`);
    continue;
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'page.tsx'), TPL(page), 'utf8');
  console.log(`wrote  ${page.slug}`);
  written++;
}

console.log(`\n${written} page${written === 1 ? '' : 's'} written.`);
console.log('Now flip live: true on those slugs in src/lib/site.ts.');

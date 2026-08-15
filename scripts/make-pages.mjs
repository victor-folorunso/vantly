/**
 * Writes the route file for the simple tools.
 *
 * These pages are all the same shape: metadata, schema, an h1, the component,
 * and an FAQ. Hand writing eight of them means eight chances for the schema to
 * drift from the metadata, or for a canonical to point at the wrong slug after
 * a copy and paste. The differences between them are data, so they live here as
 * data.
 *
 * One-off, kept in the repo so the next batch does not start from nothing.
 * Run with: node --experimental-strip-types scripts/make-pages.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  {
    slug: 'case-converter',
    h1: 'Convert text case',
    sub: 'Paste anything and switch it between the cases you actually need, including the programming ones.',
    imports: `import TextTool from '@/components/TextTool';\nimport * as T from '@/lib/textTools';`,
    body: `<TextTool
          outputLabel="Result"
          sample="the quick brown fox jumps over the lazy dog"
          transforms={[
            { id: 'upper', label: 'UPPERCASE', run: T.toUpper },
            { id: 'lower', label: 'lowercase', run: T.toLower },
            { id: 'title', label: 'Title Case', run: T.toTitle },
            { id: 'sentence', label: 'Sentence case', run: T.toSentence },
            { id: 'camel', label: 'camelCase', run: T.toCamel },
            { id: 'pascal', label: 'PascalCase', run: T.toPascal },
            { id: 'snake', label: 'snake_case', run: T.toSnake },
            { id: 'kebab', label: 'kebab-case', run: T.toKebab },
            { id: 'constant', label: 'CONSTANT_CASE', run: T.toConstant },
            { id: 'slug', label: 'url-slug', run: T.toSlug, note: 'Accents are folded rather than dropped, so Café becomes cafe and not caf.' },
          ]}
        />`,
    faq: [
      ['What is the difference between title case and sentence case?', 'Title case capitalises every word, the way a headline does. Sentence case capitalises only the first word of each sentence, and it looks for full stops rather than just the start of the box, so a paragraph comes out correctly.'],
      ['Why does camelCase handle my existing camelCase correctly?', 'The splitter looks for the hump between a lowercase letter and an uppercase one, so getHTTPResponse is read as three words rather than one. Converting between programming cases repeatedly does not degrade the text.'],
      ['Is there a length limit?', 'No. It runs in your browser, so the only limit is your own machine.'],
    ],
  },
  {
    slug: 'word-counter',
    h1: 'Count words and characters',
    sub: 'Live counts as you type, including reading time. Useful for anything with a limit attached to it.',
    imports: `import WordCounter from '@/components/WordCounter';`,
    body: `<WordCounter />`,
    faq: [
      ['How is reading time worked out?', 'At 238 words per minute for silent reading and 140 for reading aloud, which are the figures the usual meta-analyses land on. They are averages, so treat them as a guide rather than a promise.'],
      ['Do emoji count as one character or two?', 'One. An emoji is stored as two UTF-16 units, so a naive count reports two, which is wrong to anybody looking at the screen. This counts what you can see.'],
      ['Is my text sent anywhere?', 'No. It never leaves the page, which is worth knowing if you are pasting something unpublished.'],
    ],
  },
  {
    slug: 'base64-encoder',
    h1: 'Base64 encode and decode',
    sub: 'Convert text to Base64 and back. Handles accents and emoji, which most encoders do not.',
    imports: `import TextTool from '@/components/TextTool';\nimport * as T from '@/lib/textTools';`,
    body: `<TextTool
          mono
          sample="Hello, world"
          transforms={[
            { id: 'encode', label: 'Encode', run: T.encodeBase64 },
            { id: 'decode', label: 'Decode', run: T.decodeBase64, note: 'Invalid Base64 shows an error rather than silent nonsense.' },
          ]}
        />`,
    faq: [
      ['Why do other Base64 tools break on emoji?', 'Because btoa, the browser function most of them call directly, only accepts Latin-1. Anything outside it throws. This encodes the text to UTF-8 bytes first, which is what people mean when they say Base64 encode a string.'],
      ['Is Base64 encryption?', 'No, and this matters. It is an encoding, fully reversible by anyone, with no key involved. It makes binary data safe to put in text, it does not hide anything.'],
      ['Can I encode a file?', 'Not yet on this page. It is on the list.'],
    ],
  },
  {
    slug: 'url-encoder',
    h1: 'URL encode and decode',
    sub: 'Percent-encode text so it survives being put in a URL, or decode one you have been handed.',
    imports: `import TextTool from '@/components/TextTool';\nimport * as T from '@/lib/textTools';`,
    body: `<TextTool
          mono
          sample="search?q=hello world&lang=en"
          transforms={[
            { id: 'component', label: 'Encode a value', run: T.encodeUrl, note: 'For one parameter value. Encodes & = ? and / too, which is what you want inside a query string.' },
            { id: 'full', label: 'Encode a whole URL', run: T.encodeUrlFull, note: 'Leaves the structural characters alone so the URL still works.' },
            { id: 'decode', label: 'Decode', run: T.decodeUrl },
          ]}
        />`,
    faq: [
      ['Which of the two encode options do I want?', 'If you are encoding one value to drop into a query string, use the first. If you have a whole URL with slashes and question marks that should stay as they are, use the second. Using the wrong one is the commonest reason a link breaks.'],
      ['Why did decoding fail?', 'A stray percent sign that is not followed by two hex digits is invalid, and the browser refuses rather than guessing. Usually it means the text was encoded twice, or truncated.'],
    ],
  },
  {
    slug: 'text-cleaner',
    h1: 'Clean up text',
    sub: 'Sort a list, remove duplicates, strip HTML, tidy whitespace. The small jobs that are annoying by hand.',
    imports: `import TextTool from '@/components/TextTool';\nimport * as T from '@/lib/textTools';`,
    body: `<TextTool
          sample={'banana\\napple\\nbanana\\n\\ncherry\\n  apple  '}
          transforms={[
            { id: 'sort', label: 'Sort A to Z', run: T.sortLines },
            { id: 'sortdesc', label: 'Sort Z to A', run: T.sortLinesDesc },
            { id: 'reverse', label: 'Reverse order', run: T.reverseLines },
            { id: 'dedupe', label: 'Remove duplicates', run: T.dedupeLines },
            { id: 'empty', label: 'Remove empty lines', run: T.removeEmptyLines },
            { id: 'trim', label: 'Trim each line', run: T.trimLines },
            { id: 'html', label: 'Strip HTML', run: T.stripHtml, note: 'Script and style contents are removed rather than left behind as loose text, and entities are decoded.' },
          ]}
        />`,
    faq: [
      ['Does sorting understand accents and other alphabets?', 'Yes. It sorts the way your language does rather than by raw character code, so an accented letter files next to its plain form instead of at the end.'],
      ['Does removing duplicates keep the first or the last one?', 'The first, and the original order of everything else is kept.'],
    ],
  },
  {
    slug: 'uuid-generator',
    h1: 'Generate UUIDs',
    sub: 'Version 4 UUIDs, one or five hundred, generated by your browser.',
    imports: `import { UuidGenerator } from '@/components/Generators';`,
    body: `<UuidGenerator />`,
    faq: [
      ['Are these safe to use as database keys?', 'Yes. Version 4 UUIDs carry 122 random bits, which is enough that a collision is not something you need to plan for.'],
      ['Are they generated on a server?', 'No. Your browser generates them with crypto.randomUUID, so nothing is transmitted and the same list is not sitting in somebody else logs.'],
      ['Why no version 1?', 'Version 1 embeds a timestamp and the machine MAC address, which leaks information and is rarely what people actually want. If you need sortable ids, UUID v7 is the better answer and it is on the list.'],
    ],
  },
  {
    slug: 'password-generator',
    h1: 'Generate a strong password',
    sub: 'Real randomness, generated on your machine and never transmitted.',
    imports: `import { PasswordGenerator } from '@/components/Generators';`,
    body: `<PasswordGenerator />`,
    faq: [
      ['How is this different from other password generators?', 'Two ways that matter. It uses the browser cryptographic random source rather than Math.random, which is predictable and unsuitable, and it generates in the page rather than on a server. A password that travelled over the network has been seen by whoever served it.'],
      ['What does the entropy number mean?', 'It is how many bits of genuine randomness the password carries, worked out from its length and the size of the character set. Above 80 bits is strong for anything ordinary. It is a more honest measure than a coloured bar, which mostly guesses at whether a human chose the word.'],
      ['Should I turn off symbols?', 'Only if something refuses to accept them. Length does more for strength than variety does, so a longer password with fewer character types beats a short one with everything switched on.'],
    ],
  },
];

const TPL = (p) => `import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
${p.imports}

const tool = toolBySlug('${p.slug}')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: \`\${SITE.url}/${p.slug}\` },
  openGraph: { title: tool.title, description: tool.description, url: \`\${SITE.url}/${p.slug}\` },
};

const FAQ = ${JSON.stringify(p.faq.map(([q, a]) => ({ q, a })), null, 2).replace(/\n/g, '\n')};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: tool.name,
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: \`\${SITE.url}/${p.slug}\`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">${p.h1}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">${p.sub}</p>

        <div className="mt-10">
          ${p.body}
        </div>

        <section className="mt-20 max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
          <dl className="mt-6 space-y-7">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
`;

for (const p of PAGES) {
  const dir = join(root, 'src/app', p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'page.tsx'), TPL(p), 'utf8');
  console.log('wrote', p.slug);
}

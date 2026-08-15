/**
 * Second batch of simple tool routes. Same reasoning as make-pages.mjs: the
 * pages differ only in data, so the data lives here rather than being copied
 * into eight near-identical files.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  {
    slug: 'hash-generator',
    h1: 'Generate a hash',
    sub: 'SHA-256 and friends, for text or a whole file. Read on your machine, never uploaded.',
    imports: `import HashGenerator from '@/components/HashGenerator';`,
    body: `<HashGenerator />`,
    faq: [
      ['Why is my file not uploaded?', 'Because the usual reason to hash a file is to check nobody tampered with it, and sending it to a stranger to find out rather defeats the exercise. Your browser reads the bytes locally and does the maths itself.'],
      ['Why is MD5 not offered?', 'MD5 is broken. Two different files can be made to produce the same MD5 deliberately, so it proves nothing about tampering. It is still fine as a rough checksum against accidental corruption, but putting it in a list beside SHA-256 implies they are alternatives, and they are not.'],
      ['My hash does not match the one on the download page.', 'Check the algorithm first. Download pages often publish SHA-256 without labelling it, and comparing it against SHA-1 will never match. If the algorithm is right and it still differs, do not use the file.'],
      ['Is there a file size limit?', 'No, though very large files take a moment because the whole thing has to be read. There is a progress bar so you can tell it is working.'],
    ],
  },
  {
    slug: 'color-converter',
    h1: 'Convert a colour',
    sub: 'Pick a colour and read it as hex, RGB, HSL and CMYK at once.',
    imports: `import { ColorConverter } from '@/components/ColorTools';`,
    body: `<ColorConverter />`,
    faq: [
      ['Can I paste a colour in rather than pick one?', 'Yes. Hex with or without the hash, three digit shorthand, rgb() and hsl() are all understood, in either comma or space separated form.'],
      ['Is the CMYK accurate for printing?', 'It is the standard conversion, which is what any screen based tool can honestly give you. Matching a specific printing press needs that press colour profile, so treat this as a starting point rather than a final answer.'],
      ['What is HSL useful for?', 'Adjusting a colour rather than describing it. Keeping the hue and changing only the lightness gives you a matching lighter or darker shade, which is much harder to do by eye in hex.'],
    ],
  },
  {
    slug: 'contrast-checker',
    h1: 'Check colour contrast',
    sub: 'See whether your text is actually readable, and by how much you are missing it.',
    imports: `import { ContrastChecker } from '@/components/ColorTools';`,
    body: `<ContrastChecker />`,
    faq: [
      ['What do AA and AAA mean?', 'They are levels in the Web Content Accessibility Guidelines. AA needs a ratio of 4.5 to 1 for normal text and is what most legislation and company standards require. AAA needs 7 to 1 and is stricter than most designs manage for body text.'],
      ['What counts as large text?', 'From 18.66px if it is bold, or 24px otherwise. Larger text is legible at a lower contrast, which is why it gets its own lower threshold.'],
      ['Why show how far short I am rather than just fail?', 'Because a fail on its own leaves you guessing. Being 0.3 short is usually one step of lightness away, and being 2 short means rethinking the pair. Those need different responses.'],
      ['Does this cover everything about accessible colour?', 'No. It checks contrast, which is the part with a number attached. It cannot tell you whether you are relying on colour alone to carry meaning, which is a separate and equally common failure.'],
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

const FAQ = ${JSON.stringify(p.faq.map(([q, a]) => ({ q, a })), null, 2)};

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

/** Third batch of tool routes. Same data-driven approach as the first two. */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  {
    slug: 'unit-converter',
    h1: 'Convert units',
    sub: 'Length, weight, temperature, area, volume, speed and data. Every other unit shown at the same time.',
    imports: `import UnitConverter from '@/components/UnitConverter';`,
    body: `<UnitConverter />`,
    faq: [
      ['Are the conversions exact?', 'The factors are the defined ones rather than rounded approximations. An inch is exactly 25.4 millimetres and a pound is exactly 0.45359237 kilograms, because those are definitions rather than measurements. What you see is limited only by how many decimal places are worth showing.'],
      ['Why are there two kinds of kilobyte?', 'Because there genuinely are. Storage manufacturers use 1000 bytes and most operating systems count 1024, which is why a new 1TB drive shows up as about 931GB. Both are listed so you can see which one you are being quoted.'],
      ['Why are US and UK pints different?', 'They just are, and by a lot: a UK pint is about 20 percent larger. The same applies to gallons and fluid ounces, so recipes that cross the Atlantic go wrong quietly. Both are listed separately for that reason.'],
      ['Why does temperature work differently?', 'Because Fahrenheit has an offset as well as a scale, so it cannot be converted by multiplying alone. Treating it like the other units is the classic bug in converters, and it produces answers that look plausible and are wrong.'],
    ],
  },
  {
    slug: 'json-formatter',
    h1: 'Format and validate code',
    sub: 'JSON, HTML, XML, CSS and JavaScript. Beautify to read it, minify to ship it, and get told exactly where the error is.',
    imports: `import CodeFormatter from '@/components/CodeFormatter';`,
    body: `<CodeFormatter initial="json" />`,
    faq: [
      ['Why does it tell me the line and column for JSON?', 'Because "Unexpected token" on its own is useless in a four thousand line file. The position is pulled out of the parser error and turned into a line and column, which is the whole reason to use this rather than pressing prettify in an editor.'],
      ['Is my code uploaded?', 'No. It is formatted in your browser, which matters if what you are pasting is a config file or an API response with real data in it.'],
      ['What does minify actually do here?', 'It removes whitespace and nothing else. It will not rename variables or drop unused code, because those need to understand the program and belong in a build step. A minifier that changes behaviour is worse than no minifier.'],
      ['Is there a size limit?', 'No. Very large files take a moment to format because the work happens on your machine, but nothing is capped.'],
    ],
  },
  {
    slug: 'diff-checker',
    h1: 'Compare two texts',
    sub: 'See exactly what changed between two versions, line by line and side by side.',
    imports: `import DiffChecker from '@/components/DiffChecker';`,
    body: `<DiffChecker />`,
    faq: [
      ['How does it decide what changed?', 'With the Myers diff algorithm, the same one git uses, through the BSD licensed jsdiff library. A naive line by line comparison marks everything after a single inserted line as changed, which is useless on exactly the files people want to compare.'],
      ['What do the ignore options do?', 'Ignore case treats upper and lower case as the same. Ignore spaces trims each line before comparing, which removes the noise when only indentation moved. Both change what counts as a difference rather than hiding differences that are there.'],
      ['Is there a length limit?', 'No, and nothing is uploaded. Comparing two long documents happens entirely on your machine.'],
      ['Can it compare files rather than pasted text?', 'Not yet. It is on the list.'],
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
              applicationCategory: 'DeveloperApplication',
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

/** Fifth batch: the webmaster string builders. */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  {
    slug: 'utm-builder',
    h1: 'UTM link builder',
    sub: 'Build a tracked link, and catch the mistakes that split one campaign into four.',
    imports: `import { UtmBuilder } from '@/components/WebTools';`,
    body: `<UtmBuilder />`,
    faq: [
      ['Why does capitalisation matter?', 'Analytics treats Email and email as two different mediums. Mix them and one campaign turns into several rows, each looking like it underperformed. Nothing errors and nobody notices until someone tries to total it up weeks later.'],
      ['Which parameters do I actually need?', 'Source and medium. Without those the visit gets filed as direct traffic and the link may as well not have been tagged. Campaign is worth adding. Term and content only matter if you are splitting one campaign across several ads.'],
      ['Can I put the parameters after the hash?', 'No. Anything after # never leaves the browser, so analytics cannot see it. If your URL already has a fragment, the parameters go before it.'],
      ['Do these work with tools other than Google Analytics?', 'Yes. UTM parameters are a plain convention rather than a Google feature, and every serious analytics tool reads them.'],
    ],
  },
  {
    slug: 'robots-txt-generator',
    h1: 'Robots.txt generator',
    sub: 'Write a robots.txt without the one line that hides your whole site.',
    imports: `import { RobotsGenerator } from '@/components/WebTools';`,
    body: `<RobotsGenerator />`,
    faq: [
      ['What does Disallow: / do?', 'It asks every crawler to ignore the entire site. That is correct for a staging server and catastrophic on a live one, and it is the most common reason a site disappears from search overnight. It usually arrives by being copied from staging to production.'],
      ['Is robots.txt a security measure?', 'No, and treating it as one is a mistake. It is a polite request that well behaved crawlers honour and everything else ignores. The file is public, so listing a secret path in it advertises that path to anyone who looks.'],
      ['Does it stop a page appearing in Google?', 'Not reliably. Blocking a URL stops it being crawled, but it can still be listed if other sites link to it. To keep a page out of results properly, let it be crawled and serve a noindex tag.'],
      ['Should I block AI crawlers?', 'It depends what you want. Blocking them keeps your content out of training data, and also keeps you out of AI answers, which is increasingly how people find things. The tool offers both without pushing you either way.'],
      ['Where does the file go?', 'At the root of the domain, so example.com/robots.txt. In a subfolder it does nothing at all.'],
    ],
  },
  {
    slug: 'meta-tag-generator',
    h1: 'Meta tag generator',
    sub: 'Title, description and social cards, with a preview of the result.',
    imports: `import { MetaTagGenerator } from '@/components/WebTools';`,
    body: `<MetaTagGenerator />`,
    faq: [
      ['Why 60 and 160 characters?', 'Those are roughly where Google truncates a title and a description. It measures pixels rather than characters, so it is a guide and not a rule, but going well past them means the end of your sentence is replaced by an ellipsis.'],
      ['Does the description affect ranking?', 'Not directly. It affects whether someone clicks, which is the thing you actually wanted. Google also rewrites it fairly often when it thinks the page answers the query differently.'],
      ['What size should the share image be?', '1200 by 630 pixels. That fits the large card on X, LinkedIn and Facebook without cropping anything important.'],
      ['Why is the Twitter card set to summary_large_image?', 'Because the default renders a small square thumbnail beside the text, which wastes the picture. The tool only sets it when you have actually supplied an image.'],
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

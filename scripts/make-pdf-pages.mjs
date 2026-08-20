/**
 * Pages for the PDF tools, all driven by three components.
 *
 * Written by a script because seven pages differing only in a component prop
 * and a sentence is seven chances to typo a slug, and a slug that does not
 * match its folder is a page nobody can reach.
 *
 * Run once: node --experimental-strip-types scripts/make-pdf-pages.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  { slug: 'merge-pdf', component: 'PdfPages', props: 'mode="merge"',
    sub: 'Drop in as many PDFs as you like, drag the pages into the order you want, and download one file.' },
  { slug: 'split-pdf', component: 'PdfPages', props: 'mode="split"',
    sub: 'Pick the pages you want and leave the rest behind.' },
  { slug: 'pdf-to-png', component: 'PdfToImages', props: 'format="png"',
    sub: 'Every page as a PNG, at the resolution you choose.' },
  { slug: 'pdf-to-jpg', component: 'PdfToImages', props: 'format="jpg"',
    sub: 'Every page as a JPG, at the resolution you choose.' },
  { slug: 'images-to-pdf', component: 'ImagesToPdf', props: '',
    sub: 'Combine photos, screenshots or scans into a single document.' },
  { slug: 'png-to-pdf', component: 'ImagesToPdf', props: '',
    sub: 'Combine PNG images into a single document, in the order you choose.' },
  { slug: 'jpg-to-pdf', component: 'ImagesToPdf', props: '',
    sub: 'Combine JPG photos or scans into a single document.' },
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

for (const page of PAGES) {
  const dir = join(root, 'src/app', page.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'page.tsx'), TPL(page), 'utf8');
  console.log('wrote', page.slug);
}

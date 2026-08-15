import type { Metadata } from 'next';
import SvgToPng from '@/components/SvgToPng';
import { SITE, TOOLS } from '@/lib/site';

const tool = TOOLS.find((t) => t.slug === 'svg-to-png')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/${tool.slug}` },
  openGraph: {
    title: tool.title,
    description: tool.description,
    url: `${SITE.url}/${tool.slug}`,
  },
};

/*
  SoftwareApplication with a zero price, because the free tier being genuinely
  free is the thing that distinguishes this page from the results above it, and
  a rich result can say so before anybody clicks.
*/
const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${tool.name} converter`,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/${tool.slug}`,
  description: tool.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FAQ = [
  {
    q: 'Is there a resolution limit?',
    a: 'No. You can export at 8K, and the quality is identical at every size because an SVG is mathematics rather than pixels. Most converters cap the free export at a few hundred pixels and charge for anything sharper. There is no cost reason for that, because your own browser does the rendering.',
  },
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. The conversion happens inside your browser using the Canvas API, so the file never leaves your computer. You can watch it work with your network disconnected.',
  },
  {
    q: 'Why does my SVG look wrong after converting?',
    a: 'Usually a font. An SVG that names a font your browser does not have will render with a substitute. Converting text to outlines in your design tool before exporting the SVG fixes it permanently.',
  },
  {
    q: 'Can I keep the transparent background?',
    a: 'Yes, and it is on by default. Turn it off if you want a white background baked in, which some older software needs.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, faqSchema]) }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">
          Convert SVG to PNG at any resolution
        </h1>
        <p className="mt-3 text-ink-soft max-w-2xl">
          Up to 8K, with transparency, no watermark and no sign up. It runs in
          your browser, so the file stays on your machine.
        </p>

        <div className="mt-10">
          <SvgToPng />
        </div>

        <section className="mt-20 max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
          <dl className="mt-6 space-y-7">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1.5 text-ink-soft leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}

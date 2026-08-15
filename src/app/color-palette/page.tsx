import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PaletteTool from '@/components/PaletteTool';

const tool = toolBySlug('color-palette')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/color-palette` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/color-palette` },
};

const FAQ = [
  {
    q: 'How are the colours chosen from an image?',
    a: 'By median cut, the standard quantisation algorithm, using the same MIT licensed library Color Thief is built on. The image is scaled down first, because a twelve megapixel photo has far more pixels than the answer needs, and near-white pixels are skipped since they otherwise dominate every palette taken from a product photo.',
  },
  {
    q: 'Why does Shades come first rather than a wheel of harmonies?',
    a: 'Because it is the one a real design system needs. One hue at nine lightness steps is what actually goes into a config file. Complementary and triadic are useful for setting a mood, but you cannot build an interface out of five unrelated hues.',
  },
  {
    q: 'Can I get the palette as code?',
    a: 'Yes, and that is the point. Hex, CSS custom properties, a Tailwind colour scale, SCSS variables or JSON. Copying six hex codes one at a time and retyping them into a config is the tedious part, so the tool does that part.',
  },
  {
    q: 'Is my image uploaded?',
    a: 'No. It is read and analysed inside your browser and never sent anywhere.',
  },
];

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
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/color-palette`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Build a colour palette
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Pull the colours out of an image, or grow a full set from one you
          already have. Copy the result as code rather than one swatch at a time.
        </p>

        <div className="mt-10">
          <PaletteTool />
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

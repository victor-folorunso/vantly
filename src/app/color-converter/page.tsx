import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ColorConverter } from '@/components/ColorTools';

const tool = toolBySlug('color-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/color-converter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/color-converter` },
};

const FAQ = [
  {
    "q": "Can I paste a colour in rather than pick one?",
    "a": "Yes. Hex with or without the hash, three digit shorthand, rgb() and hsl() are all understood, in either comma or space separated form."
  },
  {
    "q": "Is the CMYK accurate for printing?",
    "a": "It is the standard conversion, which is what any screen based tool can honestly give you. Matching a specific printing press needs that press colour profile, so treat this as a starting point rather than a final answer."
  },
  {
    "q": "What is HSL useful for?",
    "a": "Adjusting a colour rather than describing it. Keeping the hue and changing only the lightness gives you a matching lighter or darker shade, which is much harder to do by eye in hex."
  }
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
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/color-converter`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Convert a colour</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Pick a colour and read it as hex, RGB, HSL and CMYK at once.</p>

        <div className="mt-10">
          <ColorConverter />
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

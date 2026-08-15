import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';

const tool = toolBySlug('text-cleaner')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/text-cleaner` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/text-cleaner` },
};

const FAQ = [
  {
    "q": "Does sorting understand accents and other alphabets?",
    "a": "Yes."
  },
  {
    "q": "Does removing duplicates keep the first or the last one?",
    "a": "The first, and the original order of everything else is kept."
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
              url: `${SITE.url}/text-cleaner`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Clean up text</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Sort a list, remove duplicates, strip HTML, tidy whitespace.
        </p>

        <div className="mt-10">
          <TextTool preset="clean" outputLabel="Result" />
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

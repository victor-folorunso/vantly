import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import WordCounter from '@/components/WordCounter';

const tool = toolBySlug('word-counter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/word-counter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/word-counter` },
};

const FAQ = [
  {
    "q": "How is reading time worked out?",
    "a": "At 238 words per minute for silent reading and 140 for reading aloud, which are the figures the usual meta-analyses land on."
  },
  {
    "q": "Do emoji count as one character or two?",
    "a": "One."
  },
  {
    "q": "Is my text sent anywhere?",
    "a": "No."
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
              url: `${SITE.url}/word-counter`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Count words and characters</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Live counts as you type, including reading time.
        </p>

        <div className="mt-10">
          <WordCounter />
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

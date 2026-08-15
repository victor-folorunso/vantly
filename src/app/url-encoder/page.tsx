import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';

const tool = toolBySlug('url-encoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/url-encoder` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/url-encoder` },
};

const FAQ = [
  {
    "q": "Which of the two encode options do I want?",
    "a": "If you are encoding one value to drop into a query string, use the first. If you have a whole URL with slashes and question marks that should stay as they are, use the second. Using the wrong one is the commonest reason a link breaks."
  },
  {
    "q": "Why did decoding fail?",
    "a": "A stray percent sign that is not followed by two hex digits is invalid, and the browser refuses rather than guessing. Usually it means the text was encoded twice, or truncated."
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
              url: `${SITE.url}/url-encoder`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">URL encode and decode</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Percent-encode text so it survives being put in a URL, or decode one you have been handed.</p>

        <div className="mt-10">
          <TextTool preset="url" outputLabel="Result" />
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

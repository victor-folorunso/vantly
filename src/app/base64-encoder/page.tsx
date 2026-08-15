import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';

const tool = toolBySlug('base64-encoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/base64-encoder` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/base64-encoder` },
};

const FAQ = [
  {
    "q": "Why do other Base64 tools break on emoji?",
    "a": "Because btoa, the browser function most of them call directly, only accepts Latin-1."
  },
  {
    "q": "Is Base64 encryption?",
    "a": "No, and this matters."
  },
  {
    "q": "Can I encode a file?",
    "a": "Not yet on this page."
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
              url: `${SITE.url}/base64-encoder`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Base64 encode and decode</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Convert text to Base64 and back.
        </p>

        <div className="mt-10">
          <TextTool preset="base64" outputLabel="Result" />
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

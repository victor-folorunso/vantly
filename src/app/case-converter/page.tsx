import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextTool from '@/components/TextTool';

const tool = toolBySlug('case-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/case-converter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/case-converter` },
};

const FAQ = [
  {
    "q": "What is the difference between title case and sentence case?",
    "a": "Title case capitalises every word, the way a headline does."
  },
  {
    "q": "Why does camelCase handle my existing camelCase correctly?",
    "a": "The splitter looks for the hump between a lowercase letter and an uppercase one, so getHTTPResponse is read as three words rather than one."
  },
  {
    "q": "Is there a length limit?",
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
              url: `${SITE.url}/case-converter`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Convert text case</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Paste anything and switch it between the cases you actually need, including the programming ones.</p>

        <div className="mt-10">
          <TextTool preset="case" outputLabel="Result" />
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

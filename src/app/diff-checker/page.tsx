import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DiffChecker from '@/components/DiffChecker';

const tool = toolBySlug('diff-checker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/diff-checker` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/diff-checker` },
};

const FAQ = [
  {
    "q": "How does it decide what changed?",
    "a": "With the Myers diff algorithm, the same one git uses, through the BSD licensed jsdiff library."
  },
  {
    "q": "What do the ignore options do?",
    "a": "Ignore case treats upper and lower case as the same."
  },
  {
    "q": "Is there a length limit?",
    "a": "No, and nothing is uploaded."
  },
  {
    "q": "Can it compare files rather than pasted text?",
    "a": "Not yet."
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
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/diff-checker`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Compare two texts</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">See exactly what changed between two versions, line by line and side by side.</p>

        <div className="mt-10">
          <DiffChecker />
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

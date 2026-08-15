import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import HashGenerator from '@/components/HashGenerator';

const tool = toolBySlug('hash-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/hash-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/hash-generator` },
};

const FAQ = [
  {
    "q": "Why is my file not uploaded?",
    "a": "Because the usual reason to hash a file is to check nobody tampered with it, and sending it to a stranger to find out rather defeats the exercise."
  },
  {
    "q": "Why is MD5 not offered?",
    "a": "MD5 is broken."
  },
  {
    "q": "My hash does not match the one on the download page.",
    "a": "Check the algorithm first."
  },
  {
    "q": "Is there a file size limit?",
    "a": "No, though very large files take a moment because the whole thing has to be read."
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
              url: `${SITE.url}/hash-generator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Generate a hash</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          SHA-256 and friends, for text or a whole file.
        </p>

        <div className="mt-10">
          <HashGenerator />
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

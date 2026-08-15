import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { MetaTagGenerator } from '@/components/WebTools';

const tool = toolBySlug('meta-tag-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/meta-tag-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/meta-tag-generator` },
};

const FAQ = [
  {
    "q": "Why 60 and 160 characters?",
    "a": "Those are roughly where Google truncates a title and a description."
  },
  {
    "q": "Does the description affect ranking?",
    "a": "Not directly."
  },
  {
    "q": "What size should the share image be?",
    "a": "1200 by 630 pixels."
  },
  {
    "q": "Why is the Twitter card set to summary_large_image?",
    "a": "Because the default renders a small square thumbnail beside the text, which wastes the picture."
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
              url: `${SITE.url}/meta-tag-generator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Meta tag generator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Title, description and social cards, with a preview of the result.</p>

        <div className="mt-10">
          <MetaTagGenerator />
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

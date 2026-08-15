import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { RobotsGenerator } from '@/components/WebTools';

const tool = toolBySlug('robots-txt-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/robots-txt-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/robots-txt-generator` },
};

const FAQ = [
  {
    "q": "What does Disallow: / do?",
    "a": "It asks every crawler to ignore the entire site. That is correct for a staging server and catastrophic on a live one, and it is the most common reason a site disappears from search overnight. It usually arrives by being copied from staging to production."
  },
  {
    "q": "Is robots.txt a security measure?",
    "a": "No, and treating it as one is a mistake. It is a polite request that well behaved crawlers honour and everything else ignores. The file is public, so listing a secret path in it advertises that path to anyone who looks."
  },
  {
    "q": "Does it stop a page appearing in Google?",
    "a": "Not reliably. Blocking a URL stops it being crawled, but it can still be listed if other sites link to it. To keep a page out of results properly, let it be crawled and serve a noindex tag."
  },
  {
    "q": "Should I block AI crawlers?",
    "a": "It depends what you want. Blocking them keeps your content out of training data, and also keeps you out of AI answers, which is increasingly how people find things. The tool offers both without pushing you either way."
  },
  {
    "q": "Where does the file go?",
    "a": "At the root of the domain, so example.com/robots.txt. In a subfolder it does nothing at all."
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
              url: `${SITE.url}/robots-txt-generator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Robots.txt generator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Write a robots.txt without the one line that hides your whole site.</p>

        <div className="mt-10">
          <RobotsGenerator />
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

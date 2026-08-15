import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { PasswordGenerator } from '@/components/Generators';

const tool = toolBySlug('password-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/password-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/password-generator` },
};

const FAQ = [
  {
    "q": "How is this different from other password generators?",
    "a": "It never leaves your browser, and the randomness comes from crypto.getRandomValues rather than Math.random."
  },
  {
    "q": "What does the entropy number mean?",
    "a": "It is how many bits of genuine randomness the password carries, worked out from its length and the size of the character set."
  },
  {
    "q": "Should I turn off symbols?",
    "a": "Only if something refuses to accept them."
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
              url: `${SITE.url}/password-generator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Generate a strong password</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Real randomness, generated on your machine and never transmitted.</p>

        <div className="mt-10">
          <PasswordGenerator />
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

import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { CompoundCalculator } from '@/components/Calculators';

const tool = toolBySlug('compound-interest-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/compound-interest-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/compound-interest-calculator` },
};

const FAQ = [
  {
    "q": "Why split contributions from growth?",
    "a": "Because a single final number tells you nothing about whether to believe it."
  },
  {
    "q": "Is a fixed annual return realistic?",
    "a": "No, and no calculator that shows one is realistic."
  },
  {
    "q": "Does it account for inflation, fees or tax?",
    "a": "No, and all three are real."
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
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/compound-interest-calculator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Compound interest calculator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">See how much of the final number is your money and how much is growth.</p>

        <div className="mt-10">
          <CompoundCalculator />
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

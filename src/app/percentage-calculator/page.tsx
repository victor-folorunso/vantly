import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { PercentageCalculator } from '@/components/Calculators';

const tool = toolBySlug('percentage-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/percentage-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/percentage-calculator` },
};

const FAQ = [
  {
    "q": "Why is a 20 percent rise not undone by a 20 percent fall?",
    "a": "Because the second percentage is taken from a bigger number. 100 rising by 20 percent is 120, and 120 falling by 20 percent is 96, not 100. To get back you need a fall of 16.67 percent. This is the single most common percentage mistake, so the tool shows the return trip explicitly."
  },
  {
    "q": "What is the difference between percent and percentage points?",
    "a": "If a rate goes from 4 percent to 6 percent, that is a rise of 2 percentage points, but a rise of 50 percent. Both are correct and they mean very different things, which is why the distinction gets abused in headlines."
  },
  {
    "q": "How do I take a percentage off a price?",
    "a": "Use the first box: work out what the discount is worth, then subtract. Or use the third box in reverse, since going from the old price to the new one gives you the discount as a negative percentage."
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
              url: `${SITE.url}/percentage-calculator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Percentage calculator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">The three questions people actually ask, answered at once.</p>

        <div className="mt-10">
          <PercentageCalculator />
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

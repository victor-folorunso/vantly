import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { TipCalculator } from '@/components/Calculators';

const tool = toolBySlug('tip-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/tip-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/tip-calculator` },
};

const FAQ = [
  {
    "q": "Should the tip be worked out before or after tax?",
    "a": "Custom says before, on the food and drink rather than on the tax. In practice most people tip on the total because it is easier. The difference is small on a small bill and not small on a large one."
  },
  {
    "q": "What is a normal tip?",
    "a": "It depends entirely on where you are, which is why there is no default pretending otherwise. Around 15 to 20 percent is usual in the United States. In much of Europe service is included and rounding up is enough. In Japan tipping can be taken as rude."
  },
  {
    "q": "Why does it tell me the split does not divide evenly?",
    "a": "Because it usually does not, and the person paying ends up quietly covering the difference. Better to know it is a penny than to argue about it."
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
              url: `${SITE.url}/tip-calculator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Tip and bill splitter</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Work out the tip, split the bill, and see who owes the extra penny.</p>

        <div className="mt-10">
          <TipCalculator />
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

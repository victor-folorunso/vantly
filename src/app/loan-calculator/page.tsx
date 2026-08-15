import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { LoanCalculator } from '@/components/Calculators';

const tool = toolBySlug('loan-calculator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/loan-calculator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/loan-calculator` },
};

const FAQ = [
  {
    "q": "Why is the payment not the amount divided by the months?",
    "a": "Because interest is charged on what is still owed, and that changes every month. The payment is fixed but its composition is not: early on it is mostly interest, and only later is it mostly repaying what you borrowed."
  },
  {
    "q": "Why does paying extra early save so much more than paying extra later?",
    "a": "Because every pound off the balance early removes the interest that pound would have generated for the rest of the term. The same payment in the final year removes almost no future interest, because there is almost none left to remove."
  },
  {
    "q": "Does this include fees, insurance or tax?",
    "a": "No. It is the pure loan repayment. Arrangement fees, buildings insurance and property tax are real and are not in this number, so treat it as a floor rather than the actual monthly cost."
  },
  {
    "q": "Is my data sent anywhere?",
    "a": "No. It is all worked out in your browser, which matters given what people put into a mortgage calculator."
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
              url: `${SITE.url}/loan-calculator`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Loan and mortgage calculator</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Monthly payment, total interest, and the full year by year schedule.</p>

        <div className="mt-10">
          <LoanCalculator />
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

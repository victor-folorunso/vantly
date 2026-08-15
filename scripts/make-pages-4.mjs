/** Fourth batch: the calculators. */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  {
    slug: 'percentage-calculator',
    h1: 'Percentage calculator',
    sub: 'The three questions people actually ask, answered at once.',
    imports: `import { PercentageCalculator } from '@/components/Calculators';`,
    body: `<PercentageCalculator />`,
    faq: [
      ['Why is a 20 percent rise not undone by a 20 percent fall?', 'Because the second percentage is taken from a bigger number. 100 rising by 20 percent is 120, and 120 falling by 20 percent is 96, not 100. To get back you need a fall of 16.67 percent. This is the single most common percentage mistake, so the tool shows the return trip explicitly.'],
      ['What is the difference between percent and percentage points?', 'If a rate goes from 4 percent to 6 percent, that is a rise of 2 percentage points, but a rise of 50 percent. Both are correct and they mean very different things, which is why the distinction gets abused in headlines.'],
      ['How do I take a percentage off a price?', 'Use the first box: work out what the discount is worth, then subtract. Or use the third box in reverse, since going from the old price to the new one gives you the discount as a negative percentage.'],
    ],
  },
  {
    slug: 'tip-calculator',
    h1: 'Tip and bill splitter',
    sub: 'Work out the tip, split the bill, and see who owes the extra penny.',
    imports: `import { TipCalculator } from '@/components/Calculators';`,
    body: `<TipCalculator />`,
    faq: [
      ['Should the tip be worked out before or after tax?', 'Custom says before, on the food and drink rather than on the tax. In practice most people tip on the total because it is easier. The difference is small on a small bill and not small on a large one.'],
      ['What is a normal tip?', 'It depends entirely on where you are, which is why there is no default pretending otherwise. Around 15 to 20 percent is usual in the United States. In much of Europe service is included and rounding up is enough. In Japan tipping can be taken as rude.'],
      ['Why does it tell me the split does not divide evenly?', 'Because it usually does not, and the person paying ends up quietly covering the difference. Better to know it is a penny than to argue about it.'],
    ],
  },
  {
    slug: 'loan-calculator',
    h1: 'Loan and mortgage calculator',
    sub: 'Monthly payment, total interest, and the full year by year schedule.',
    imports: `import { LoanCalculator } from '@/components/Calculators';`,
    body: `<LoanCalculator />`,
    faq: [
      ['Why is the payment not the amount divided by the months?', 'Because interest is charged on what is still owed, and that changes every month. The payment is fixed but its composition is not: early on it is mostly interest, and only later is it mostly repaying what you borrowed.'],
      ['Why does paying extra early save so much more than paying extra later?', 'Because every pound off the balance early removes the interest that pound would have generated for the rest of the term. The same payment in the final year removes almost no future interest, because there is almost none left to remove.'],
      ['Does this include fees, insurance or tax?', 'No. It is the pure loan repayment. Arrangement fees, buildings insurance and property tax are real and are not in this number, so treat it as a floor rather than the actual monthly cost.'],
      ['Is my data sent anywhere?', 'No. It is all worked out in your browser, which matters given what people put into a mortgage calculator.'],
    ],
  },
  {
    slug: 'compound-interest-calculator',
    h1: 'Compound interest calculator',
    sub: 'See how much of the final number is your money and how much is growth.',
    imports: `import { CompoundCalculator } from '@/components/Calculators';`,
    body: `<CompoundCalculator />`,
    faq: [
      ['Why split contributions from growth?', 'Because a single final number tells you nothing about whether to believe it. Early on almost all of the balance is money you put in. The point at which growth overtakes contributions is the thing worth seeing, and it usually arrives later than people expect.'],
      ['Is a fixed annual return realistic?', 'No, and no calculator that shows one is realistic. Real returns arrive unevenly, and the order matters: a bad year early does more damage than a bad year late. Treat this as a shape rather than a forecast.'],
      ['Does it account for inflation, fees or tax?', 'No, and all three are real. A 7 percent return with 3 percent inflation is about 4 percent in what the money will actually buy. Fees come off before you see anything.'],
    ],
  },
];

const TPL = (p) => `import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
${p.imports}

const tool = toolBySlug('${p.slug}')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: \`\${SITE.url}/${p.slug}\` },
  openGraph: { title: tool.title, description: tool.description, url: \`\${SITE.url}/${p.slug}\` },
};

const FAQ = ${JSON.stringify(p.faq.map(([q, a]) => ({ q, a })), null, 2)};

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
              url: \`\${SITE.url}/${p.slug}\`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">${p.h1}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">${p.sub}</p>

        <div className="mt-10">
          ${p.body}
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
`;

for (const p of PAGES) {
  const dir = join(root, 'src/app', p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'page.tsx'), TPL(p), 'utf8');
  console.log('wrote', p.slug);
}

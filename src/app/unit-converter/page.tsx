import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import UnitConverter from '@/components/UnitConverter';

const tool = toolBySlug('unit-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/unit-converter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/unit-converter` },
};

const FAQ = [
  {
    "q": "Are the conversions exact?",
    "a": "The factors are the defined ones rather than rounded approximations. An inch is exactly 25.4 millimetres and a pound is exactly 0.45359237 kilograms, because those are definitions rather than measurements. What you see is limited only by how many decimal places are worth showing."
  },
  {
    "q": "Why are there two kinds of kilobyte?",
    "a": "Because there genuinely are. Storage manufacturers use 1000 bytes and most operating systems count 1024, which is why a new 1TB drive shows up as about 931GB. Both are listed so you can see which one you are being quoted."
  },
  {
    "q": "Why are US and UK pints different?",
    "a": "They just are, and by a lot: a UK pint is about 20 percent larger. The same applies to gallons and fluid ounces, so recipes that cross the Atlantic go wrong quietly. Both are listed separately for that reason."
  },
  {
    "q": "Why does temperature work differently?",
    "a": "Because Fahrenheit has an offset as well as a scale, so it cannot be converted by multiplying alone. Treating it like the other units is the classic bug in converters, and it produces answers that look plausible and are wrong."
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
              url: `${SITE.url}/unit-converter`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Convert units</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Length, weight, temperature, area, volume, speed and data. Every other unit shown at the same time.</p>

        <div className="mt-10">
          <UnitConverter />
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

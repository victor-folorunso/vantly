import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ContrastChecker } from '@/components/ColorTools';

const tool = toolBySlug('contrast-checker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/contrast-checker` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/contrast-checker` },
};

const FAQ = [
  {
    "q": "What do AA and AAA mean?",
    "a": "They are levels in the Web Content Accessibility Guidelines. AA needs a ratio of 4.5 to 1 for normal text and is what most legislation and company standards require. AAA needs 7 to 1 and is stricter than most designs manage for body text."
  },
  {
    "q": "What counts as large text?",
    "a": "From 18.66px if it is bold, or 24px otherwise. Larger text is legible at a lower contrast, which is why it gets its own lower threshold."
  },
  {
    "q": "Why show how far short I am rather than just fail?",
    "a": "Because a fail on its own leaves you guessing. Being 0.3 short is usually one step of lightness away, and being 2 short means rethinking the pair. Those need different responses."
  },
  {
    "q": "Does this cover everything about accessible colour?",
    "a": "No. It checks contrast, which is the part with a number attached. It cannot tell you whether you are relying on colour alone to carry meaning, which is a separate and equally common failure."
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
              url: `${SITE.url}/contrast-checker`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Check colour contrast</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">See whether your text is actually readable, and by how much you are missing it.</p>

        <div className="mt-10">
          <ContrastChecker />
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

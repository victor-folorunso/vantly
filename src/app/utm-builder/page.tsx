import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { UtmBuilder } from '@/components/WebTools';

const tool = toolBySlug('utm-builder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/utm-builder` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/utm-builder` },
};

const FAQ = [
  {
    "q": "Why does capitalisation matter?",
    "a": "Analytics treats Email and email as two different mediums. Mix them and one campaign turns into several rows, each looking like it underperformed. Nothing errors and nobody notices until someone tries to total it up weeks later."
  },
  {
    "q": "Which parameters do I actually need?",
    "a": "Source and medium. Without those the visit gets filed as direct traffic and the link may as well not have been tagged. Campaign is worth adding. Term and content only matter if you are splitting one campaign across several ads."
  },
  {
    "q": "Can I put the parameters after the hash?",
    "a": "No. Anything after # never leaves the browser, so analytics cannot see it. If your URL already has a fragment, the parameters go before it."
  },
  {
    "q": "Do these work with tools other than Google Analytics?",
    "a": "Yes. UTM parameters are a plain convention rather than a Google feature, and every serious analytics tool reads them."
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
              url: `${SITE.url}/utm-builder`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">UTM link builder</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Build a tracked link, and catch the mistakes that split one campaign into four.</p>

        <div className="mt-10">
          <UtmBuilder />
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

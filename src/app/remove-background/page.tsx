import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import BackgroundRemover from '@/components/BackgroundRemover';

const tool = toolBySlug('remove-background')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/remove-background` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/remove-background` },
};

const FAQ = [
  {
    q: 'What kind of images does this work on?',
    a: 'Anything with a flat, even background: a logo, a product photographed on white, a screenshot, a scanned signature, a graphic.',
  },
  {
    q: 'Why is there no resolution limit?',
    a: 'Because there is no cost to recover.',
  },
  {
    q: 'The white inside my subject stayed. Is that a bug?',
    a: 'No, that is deliberate.',
  },
  {
    q: 'Parts of my subject are disappearing.',
    a: 'Lower the tolerance.',
  },
  {
    q: 'Why is the download a PNG?',
    a: 'JPG cannot store transparency.',
  },
  {
    q: 'Will there be an AI version for photos?',
    a: 'Probably.',
  },
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
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/remove-background`,
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
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Remove an image background
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          For logos, product shots and anything on a flat background.
        </p>

        <div className="mt-10">
          <BackgroundRemover />
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

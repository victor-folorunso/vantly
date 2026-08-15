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
    a: 'Anything with a flat, even background: a logo, a product photographed on white, a screenshot, a scanned signature, a graphic. For those it is exact and instant. A person photographed against a busy room is a different problem and this will not do it well.',
  },
  {
    q: 'Why is there no resolution limit?',
    a: 'Because there is no cost to recover. The work happens on your machine, so there is no server time to pay for and no reason to hold the full size version back. Tools that give you a 612 by 408 preview and charge for the real one are describing their business model, not a technical limit.',
  },
  {
    q: 'The white inside my subject stayed. Is that a bug?',
    a: 'No, that is deliberate. The removal spreads inward from the edges of the image rather than deleting every matching pixel, so white eyes, white text and white gaps inside the subject survive. Deleting every white pixel is the commonest failure of simple background removal and it is very hard to undo.',
  },
  {
    q: 'Parts of my subject are disappearing.',
    a: 'Lower the tolerance. It controls how different a pixel can be from the background and still count as background, so a high value starts eating anything pale. If the background is uneven you may need to raise it instead and accept a rougher edge.',
  },
  {
    q: 'Why is the download a PNG?',
    a: 'JPG cannot store transparency. Saving a cutout as JPG fills the transparent area back in, usually with black or white, which undoes the entire operation.',
  },
  {
    q: 'Will there be an AI version for photos?',
    a: 'Probably. It is genuinely possible in the browser, since the models are around 45MB rather than gigabytes. The hold-up is licensing: the best known model is released for non-commercial use only, and building on it and finding out later would be worse than waiting. A permissively licensed one is being looked for.',
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
          For logos, product shots and anything on a flat background. Full
          resolution, no watermark, no account, and nothing is uploaded.
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

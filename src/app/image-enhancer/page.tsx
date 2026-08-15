import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import ImageEnhancer from '@/components/ImageEnhancer';

const tool = toolBySlug('image-enhancer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/image-enhancer` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/image-enhancer` },
};

const FAQ = [
  {
    q: 'Does this use AI to add detail?',
    a: 'No, and that is deliberate. Every change is a real operation on the pixels already in your photo: stretching the tonal range, sharpening edges, shifting colour. Nothing is invented. Tools that promise to recover detail from a blurry photo are generating plausible texture that was never there, which is fine for a wallpaper and misleading for anything you need to be true.',
  },
  {
    q: 'What does auto levels actually do?',
    a: 'It finds the darkest and lightest tones actually present and stretches them to reach true black and true white. A photo shot through haze, or a scan, uses only the middle of the range and looks flat. This is usually the single change that makes the biggest difference, which is why it is on by default.',
  },
  {
    q: 'Why is my blurry photo still blurry?',
    a: 'Sharpening increases the contrast at edges that exist. It cannot recover focus, because the information was never recorded. Turning sharpness up far enough produces halos around edges rather than a sharper picture.',
  },
  {
    q: 'Is my photo uploaded?',
    a: 'No. It is read, adjusted and saved entirely inside your browser.',
  },
  {
    q: 'Why is the download a PNG?',
    a: 'PNG is lossless, so re-saving does not add compression damage on top of whatever the original already carried. If you want a smaller file afterwards, run it through the compressor.',
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
              url: `${SITE.url}/image-enhancer`,
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
          Enhance a photo
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Fix a flat or dull picture, and drag the handle to see exactly what
          changed. Everything happens in your browser.
        </p>

        <div className="mt-10">
          <ImageEnhancer />
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

import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import ImageEnhancer from '@/components/ImageEnhancer';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('image-enhancer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/image-enhancer` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/image-enhancer` },
};


export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: tool.name,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/image-enhancer`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Enhance a photo
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Fix a flat or dull picture, and drag the handle to see exactly what changed.
        </p>

        <div className="mt-10">
          <ImageEnhancer />
        </div>

        <LearnLink tool="image-enhancer" />
      </div>
    </>
  );
}

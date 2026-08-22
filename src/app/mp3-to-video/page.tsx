import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import MediaConvert from '@/components/MediaConvert';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('mp3-to-video')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/mp3-to-video` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/mp3-to-video` },
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
            url: `${SITE.url}/mp3-to-video`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          A track and a still picture, for somewhere that only accepts video.
        </p>

        <div className="mt-10">
          <MediaConvert to="mp4" source="audio" mode="still" />
        </div>

        <ToolDocs tool="mp3-to-video" />
      </div>
    </>
  );
}

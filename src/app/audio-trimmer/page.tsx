import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import MediaConvert from '@/components/MediaConvert';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('audio-trimmer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/audio-trimmer` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/audio-trimmer` },
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
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/audio-trimmer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="audio-trimmer" lede="Cut the start and the end off a recording.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <MediaConvert to="mp3" mode="trim" source="audio" />
        </div>

        <ToolDocs tool="audio-trimmer" />
      </div>
    </>
  );
}

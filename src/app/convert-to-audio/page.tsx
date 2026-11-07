import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import MediaConvert from '@/components/MediaConvert';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('convert-to-audio')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/convert-to-audio` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/convert-to-audio` },
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
            url: `${SITE.url}/convert-to-audio`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="convert-to-audio" lede="Anything with sound in it, turned into an MP3.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <MediaConvert to="mp3" source="both" />
        </div>

        <ToolDocs tool="convert-to-audio" />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import MediaConvert from '@/components/MediaConvert';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('compress-video')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/compress-video` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/compress-video` },
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
            url: `${SITE.url}/compress-video`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="compress-video" lede="Make a video smaller without a desktop editor.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <MediaConvert to="mp4" mode="compress" source="video" />
        </div>

        <ToolDocs tool="compress-video" />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import ImageStudio from '@/components/ImageStudio';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = 'Image compressor';
const description = 'Make images smaller without making them look worse. Bulk compression in your browser, no upload, no watermark, no file size limit.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/image-compressor` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/image-compressor` },
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
              name: title,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/image-compressor`,
              description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="image-compressor" lede="Drop in as many as you like and pull the quality down until the size looks right. No limit on how many.">Compress images</ToolHeader>

        <div className="mt-10">
          <ImageStudio mode="compress" />
        </div>

        <ToolDocs tool="image-compressor" />
      </div>
    </>
  );
}

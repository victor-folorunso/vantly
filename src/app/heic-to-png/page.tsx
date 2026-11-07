import type { Metadata } from 'next';
import HeicConvert from '@/components/HeicConvert';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = "HEIC to PNG converter";
const description =
  "Convert iPhone HEIC photos to PNG in your browser, with nothing lost to compression. Bulk conversion, no upload, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/heic-to-png` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/heic-to-png` },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/heic-to-png`,
  description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="heic-to-png" lede={"For when every pixel has to survive, for editing or printing. Converted in bulk, and none of the photos leave your computer."}>Convert HEIC to PNG</ToolHeader>

        <div className="mt-10">
          <HeicConvert initialFormat="png" />
        </div>

        <ToolDocs tool="heic-to-png" />
      </div>
    </>
  );
}

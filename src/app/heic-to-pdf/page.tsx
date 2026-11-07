import type { Metadata } from 'next';
import HeicConvert from '@/components/HeicConvert';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = "HEIC to PDF converter";
const description =
  "Turn iPhone HEIC photos into one PDF, a photo on each page, in your browser. No upload, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/heic-to-pdf` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/heic-to-pdf` },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/heic-to-pdf`,
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
        <ToolHeader slug="heic-to-pdf" lede={"Put a set of iPhone photos into one PDF, a photo on each page, in the order you add them. Nothing is uploaded."}>Convert HEIC to PDF</ToolHeader>

        <div className="mt-10">
          <HeicConvert initialFormat="pdf" />
        </div>

        <ToolDocs tool="heic-to-pdf" />
      </div>
    </>
  );
}

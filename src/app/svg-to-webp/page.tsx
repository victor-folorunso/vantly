import type { Metadata } from 'next';
import SvgToPng from '@/components/SvgToPng';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = "SVG to WebP converter";
const description =
  "Convert an SVG to a WebP at up to 8K in your browser, transparency kept. No upload, no size cap, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/svg-to-webp` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/svg-to-webp` },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/svg-to-webp`,
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
        <ToolHeader slug="svg-to-webp" lede={"Render a vector to a WebP at the size you need, with the transparency kept. It never leaves your computer."}>Convert SVG to WebP</ToolHeader>

        <div className="mt-10">
          <SvgToPng target="webp" />
        </div>

        <ToolDocs tool="svg-to-webp" />
      </div>
    </>
  );
}

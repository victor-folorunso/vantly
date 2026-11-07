import type { Metadata } from 'next';
import SvgToPng from '@/components/SvgToPng';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = "SVG to JPG converter";
const description =
  "Convert an SVG to a JPG at up to 8K in your browser, on a white background. No upload, no size cap, no watermark.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/svg-to-jpg` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/svg-to-jpg` },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/svg-to-jpg`,
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
        <ToolHeader slug="svg-to-jpg" lede={"Render a vector to a JPG at the size you need, up to 8K, on a white background. It never leaves your computer."}>Convert SVG to JPG</ToolHeader>

        <div className="mt-10">
          <SvgToPng target="jpg" />
        </div>

        <ToolDocs tool="svg-to-jpg" />
      </div>
    </>
  );
}

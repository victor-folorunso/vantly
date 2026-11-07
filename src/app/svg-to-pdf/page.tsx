import type { Metadata } from 'next';
import SvgToPng from '@/components/SvgToPng';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = "SVG to PDF converter";
const description =
  "Convert an SVG to a PDF that stays a vector, sharp at any zoom and in print. In your browser, no upload.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/svg-to-pdf` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/svg-to-pdf` },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/svg-to-pdf`,
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
        <ToolHeader slug="svg-to-pdf" lede={"The paths stay paths, so the PDF is as sharp printed on a poster as it is on screen. It never leaves your computer."}>Convert SVG to PDF</ToolHeader>

        <div className="mt-10">
          <SvgToPng target="pdf" />
        </div>

        <ToolDocs tool="svg-to-pdf" />
      </div>
    </>
  );
}

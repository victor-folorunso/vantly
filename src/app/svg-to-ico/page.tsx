import type { Metadata } from 'next';
import SvgToPng from '@/components/SvgToPng';
import { SITE } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const title = "SVG to ICO converter";
const description =
  "Turn an SVG into a Windows ICO file holding every size from 16 to 256 pixels. In your browser, no upload.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/svg-to-ico` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/svg-to-ico` },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: title,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/svg-to-ico`,
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
        <ToolHeader slug="svg-to-ico" lede={"One icon file with every size from 16 to 256 pixels inside, drawn from the vector so each one is sharp."}>Convert SVG to ICO</ToolHeader>

        <div className="mt-10">
          <SvgToPng target="ico" />
        </div>

        <ToolDocs tool="svg-to-ico" />
      </div>
    </>
  );
}

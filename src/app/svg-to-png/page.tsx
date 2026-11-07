import type { Metadata } from 'next';
import SvgToPng from '@/components/SvgToPng';
import { SITE, TOOLS } from '@/lib/site';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = TOOLS.find((t) => t.slug === 'svg-to-png')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/${tool.slug}` },
  openGraph: {
    images: '/og.png',
    title: tool.title,
    description: tool.description,
    url: `${SITE.url}/${tool.slug}`,
  },
};

/*
  SoftwareApplication with a zero price, because the free tier being genuinely
  free is the thing that distinguishes this page from the results above it, and
  a rich result can say so before anybody clicks.
*/
const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${tool.name} converter`,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/${tool.slug}`,
  description: tool.description,
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
        <ToolHeader slug="svg-to-png" lede="Up to 8K, with transparency and no watermark. The file stays on your machine.">Convert SVG to PNG at any resolution</ToolHeader>

        <div className="mt-10">
          <SvgToPng />
        </div>

        <ToolDocs tool="svg-to-png" />
      </div>
    </>
  );
}

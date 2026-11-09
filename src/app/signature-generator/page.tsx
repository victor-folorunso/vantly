import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import Playthings from '@/components/Playthings';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('signature-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/signature-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/signature-generator` },
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
            url: `${SITE.url}/signature-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="signature-generator" lede={"Sign with a mouse, finger or pen. Download it with a transparent background."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <Playthings tool="signature" />
        </div>

        <ToolDocs tool="signature-generator" />
      </div>
    </>
  );
}

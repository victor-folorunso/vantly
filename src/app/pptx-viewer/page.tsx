import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import OfficeViewer from '@/components/OfficeViewer';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('pptx-viewer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/pptx-viewer` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/pptx-viewer` },
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
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/pptx-viewer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="pptx-viewer" lede="Step through a PowerPoint deck without PowerPoint, slide by slide.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <OfficeViewer kind="pptx" />
        </div>

        <ToolDocs tool="pptx-viewer" />
      </div>
    </>
  );
}

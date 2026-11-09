import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import LayoutBuilder from '@/components/LayoutBuilder';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('css-grid-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/css-grid-generator` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/css-grid-generator` },
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
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/css-grid-generator`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="css-grid-generator" lede={"Set the columns, rows and gaps, see the grid, copy the CSS."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <LayoutBuilder kind="grid" />
        </div>

        <ToolDocs tool="css-grid-generator" />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { ContrastChecker } from '@/components/ColorTools';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('contrast-checker')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/contrast-checker` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/contrast-checker` },
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
              url: `${SITE.url}/contrast-checker`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="contrast-checker" lede="See whether your text is actually readable, and by how much you are missing it.">Check colour contrast</ToolHeader>

        <div className="mt-10">
          <ContrastChecker />
        </div>

        <ToolDocs tool="contrast-checker" />
      </div>
    </>
  );
}

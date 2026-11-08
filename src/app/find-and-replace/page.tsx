import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import TextExtras from '@/components/TextExtras';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('find-and-replace')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/find-and-replace` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/find-and-replace` },
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
            url: `${SITE.url}/find-and-replace`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="find-and-replace" lede={"Every instance at once, with a pattern if you want one."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <TextExtras tool="find" />
        </div>

        <ToolDocs tool="find-and-replace" />
      </div>
    </>
  );
}

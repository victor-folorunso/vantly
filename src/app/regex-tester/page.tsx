import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import RegexTester from '@/components/RegexTester';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('regex-tester')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/regex-tester` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/regex-tester` },
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
            url: `${SITE.url}/regex-tester`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="regex-tester" lede="See what your pattern matches, highlighted in the text itself.">{tool.name}</ToolHeader>

        <div className="mt-10">
          <RegexTester />
        </div>

        <ToolDocs tool="regex-tester" />
      </div>
    </>
  );
}

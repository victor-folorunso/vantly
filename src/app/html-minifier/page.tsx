import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import CodeFormatter from '@/components/CodeFormatter';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('html-minifier')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/html-minifier` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/html-minifier` },
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
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/html-minifier`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="html-minifier" lede={"Strip the whitespace and comments a browser does not need."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <CodeFormatter initial="html" action="minify" />
        </div>

        <ToolDocs tool="html-minifier" />
      </div>
    </>
  );
}

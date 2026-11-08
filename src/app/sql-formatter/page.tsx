import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import CodeFormatter from '@/components/CodeFormatter';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('sql-formatter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/sql-formatter` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/sql-formatter` },
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
            url: `${SITE.url}/sql-formatter`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="sql-formatter" lede={"Long queries laid out so you can read them."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <CodeFormatter initial="sql" />
        </div>

        <ToolDocs tool="sql-formatter" />
      </div>
    </>
  );
}

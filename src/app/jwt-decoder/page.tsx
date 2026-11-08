import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DevExtras from '@/components/DevExtras';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('jwt-decoder')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/jwt-decoder` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/jwt-decoder` },
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
            url: `${SITE.url}/jwt-decoder`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="jwt-decoder" lede={"Read the header and claims, and check the signature if you have the secret."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <DevExtras tool="jwt" />
        </div>

        <ToolDocs tool="jwt-decoder" />
      </div>
    </>
  );
}

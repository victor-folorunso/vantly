import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import DevExtras from '@/components/DevExtras';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('unix-timestamp-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/unix-timestamp-converter` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/unix-timestamp-converter` },
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
            url: `${SITE.url}/unix-timestamp-converter`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="unix-timestamp-converter" lede={"Seconds since 1970, to a date and back."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <DevExtras tool="unix" />
        </div>

        <ToolDocs tool="unix-timestamp-converter" />
      </div>
    </>
  );
}

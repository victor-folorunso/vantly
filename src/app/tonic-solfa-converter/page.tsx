import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, toolBySlug } from '@/lib/site';
import SolfaConverter from '@/components/SolfaConverter';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('tonic-solfa-converter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/tonic-solfa-converter` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/tonic-solfa-converter` },
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
            url: `${SITE.url}/tonic-solfa-converter`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="tonic-solfa-converter" lede={<>Note names into doh ray me in any key, and back the other way. Have a recording instead?{' '}
          <Link href="/song-to-tonic-solfa" className="text-accent underline underline-offset-4">
            Turn the song into solfa
          </Link>
          .</>}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <SolfaConverter />
        </div>

        <ToolDocs tool="tonic-solfa-converter" />
      </div>
    </>
  );
}

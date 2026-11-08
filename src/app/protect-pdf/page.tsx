import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import PdfEdit from '@/components/PdfEdit';
import ToolDocs from '@/components/ToolDocs';
import ToolHeader from '@/components/ToolHeader';

const tool = toolBySlug('protect-pdf')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/protect-pdf` },
  openGraph: { images: '/og.png', title: tool.title, description: tool.description, url: `${SITE.url}/protect-pdf` },
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
            url: `${SITE.url}/protect-pdf`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <ToolHeader slug="protect-pdf" lede={"Put a password on a PDF so nobody can open it without one. AES-256, done on your computer, and the file never leaves it."}>{tool.name}</ToolHeader>

        <div className="mt-10">
          <PdfEdit mode="protect" />
        </div>

        <ToolDocs tool="protect-pdf" />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import OfficeViewer from '@/components/OfficeViewer';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('docx-viewer')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/docx-viewer` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/docx-viewer` },
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
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any, runs in a web browser',
            url: `${SITE.url}/docx-viewer`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Open a Word document in your browser. No Office licence and nothing to install.</p>

        <div className="mt-10">
          <OfficeViewer kind="docx" />
        </div>

        <ToolDocs tool="docx-viewer" />
      </div>
    </>
  );
}

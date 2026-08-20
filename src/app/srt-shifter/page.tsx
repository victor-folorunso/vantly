import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import SubtitleShifter from '@/components/SubtitleShifter';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('srt-shifter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/srt-shifter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/srt-shifter` },
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
            url: `${SITE.url}/srt-shifter`,
            description: tool.description,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Move subtitles earlier or later, fix frame rate drift, and swap between SRT and VTT.</p>

        <div className="mt-10">
          <SubtitleShifter />
        </div>

        <ToolDocs tool="srt-shifter" />
      </div>
    </>
  );
}

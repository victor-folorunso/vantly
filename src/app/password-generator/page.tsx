import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import { PasswordGenerator } from '@/components/Generators';
import LearnLink from '@/components/LearnLink';

const tool = toolBySlug('password-generator')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/password-generator` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/password-generator` },
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
              url: `${SITE.url}/password-generator`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Generate a strong password</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">Real randomness, generated on your machine and never transmitted.</p>

        <div className="mt-10">
          <PasswordGenerator />
        </div>

        <LearnLink tool="password-generator" />
      </div>
    </>
  );
}

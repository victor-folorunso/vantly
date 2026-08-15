import type { Metadata } from 'next';
import HeicConvert from '@/components/HeicConvert';
import { SITE, TOOLS } from '@/lib/site';

const tool = TOOLS.find((t) => t.slug === 'heic-to-jpg')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/${tool.slug}` },
  openGraph: {
    title: tool.title,
    description: tool.description,
    url: `${SITE.url}/${tool.slug}`,
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HEIC to JPG converter',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any, runs in a web browser',
  url: `${SITE.url}/${tool.slug}`,
  description: tool.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FAQ = [
  {
    q: 'Why will my iPhone photos not open on Windows?',
    a: 'iPhones have saved photos as HEIC since iOS 11 in 2017.',
  },
  {
    q: 'How many photos can I convert at once?',
    a: 'There is no limit.',
  },
  {
    q: 'Are my photos uploaded to a server?',
    a: 'No.',
  },
  {
    q: 'Should I pick JPG or WebP?',
    a: 'JPG if anything at all needs to open it, including old software and printing services.',
  },
  {
    q: 'Can I stop my iPhone making HEIC files in the first place?',
    a: 'Yes. Settings, Camera, Formats, Most Compatible. New photos will be JPG.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, faqSchema]) }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">
          Convert HEIC to JPG or WebP
        </h1>
        <p className="mt-3 text-ink-soft max-w-2xl">
          For the iPhone photos that will not open on Windows. Convert as many as
          you like at once, download them as a zip, and none of them leave your
          computer.
        </p>

        <div className="mt-10">
          <HeicConvert />
        </div>

        <section className="mt-20 max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
          <dl className="mt-6 space-y-7">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1.5 text-ink-soft leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}

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
    a: 'iPhones have saved photos as HEIC since iOS 11 in 2017. It is a better format than JPG, smaller for the same quality, but Windows needs a codec pack that is not installed by default, and plenty of websites and older programs still will not accept it.',
  },
  {
    q: 'How many photos can I convert at once?',
    a: 'There is no limit. Drop the whole camera roll if you like. They convert one after another so the page stays responsive, and you can download the finished set as a single zip.',
  },
  {
    q: 'Are my photos uploaded to a server?',
    a: 'No. The conversion runs inside your browser, so the photos never leave your computer. That matters more here than with most file types, because these are personal photos.',
  },
  {
    q: 'Should I pick JPG or WebP?',
    a: 'JPG if anything at all needs to open it, including old software and printing services. WebP if it is for the web, since the files are meaningfully smaller at the same quality and every current browser reads them.',
  },
  {
    q: 'Can I stop my iPhone making HEIC files in the first place?',
    a: 'Yes. Settings, then Camera, then Formats, then choose Most Compatible. New photos will be JPG. It uses more storage, and it does nothing to the photos you have already taken.',
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

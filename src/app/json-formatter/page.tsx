import type { Metadata } from 'next';
import { SITE, toolBySlug } from '@/lib/site';
import CodeFormatter from '@/components/CodeFormatter';

const tool = toolBySlug('json-formatter')!;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: `${SITE.url}/json-formatter` },
  openGraph: { title: tool.title, description: tool.description, url: `${SITE.url}/json-formatter` },
};

const FAQ = [
  {
    "q": "Why does it tell me the line and column for JSON?",
    "a": "Because \"Unexpected token\" on its own is useless in a four thousand line file. The position is pulled out of the parser error and turned into a line and column, which is the whole reason to use this rather than pressing prettify in an editor."
  },
  {
    "q": "Is my code uploaded?",
    "a": "No. It is formatted in your browser, which matters if what you are pasting is a config file or an API response with real data in it."
  },
  {
    "q": "What does minify actually do here?",
    "a": "It removes whitespace and nothing else. It will not rename variables or drop unused code, because those need to understand the program and belong in a build step. A minifier that changes behaviour is worse than no minifier."
  },
  {
    "q": "Is there a size limit?",
    "a": "No. Very large files take a moment to format because the work happens on your machine, but nothing is capped."
  }
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: tool.name,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/json-formatter`,
              description: tool.description,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]),
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Format and validate code</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">JSON, HTML, XML, CSS and JavaScript. Beautify to read it, minify to ship it, and get told exactly where the error is.</p>

        <div className="mt-10">
          <CodeFormatter initial="json" />
        </div>

        <section className="mt-20 max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
          <dl className="mt-6 space-y-7">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}

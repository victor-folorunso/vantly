import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allArticles, articleBySlug } from '@/lib/learn';
import { SITE } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allArticles().map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: `${SITE.url}/learn/${a.slug}` },
    openGraph: {
      type: 'article',
      title: a.title,
      description: a.description,
      url: `${SITE.url}/learn/${a.slug}`,
      modifiedTime: a.updated,
    },
  };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) notFound();

  const related = allArticles()
    .filter((x) => x.slug !== a.slug)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: a.title,
            description: a.description,
            dateModified: a.updated,
            mainEntityOfPage: `${SITE.url}/learn/${a.slug}`,
            publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <article>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-[2.25rem]">
            {a.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">{a.description}</p>
          <p className="mt-4 text-xs tabular-nums text-ink-faint">
            {a.minutes} min read
          </p>

          {/* The tool this exists to support, offered early. Somebody who
              already knows what they need should not have to read the article
              to reach it. */}
          {a.tool?.live && (
            <Link
              href={`/${a.tool.slug}`}
              className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-[1.02]"
            >
              Open the {a.tool.name.toLowerCase()}
            </Link>
          )}

          <div
            className="prose-vantly mt-10"
            dangerouslySetInnerHTML={{ __html: a.html }}
          />
        </article>

        {related.length > 0 && (
          <section className="mt-16 border-t border-line pt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Also worth reading
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/learn/${r.slug}`} className="group block">
                    <span className="font-medium transition-colors group-hover:text-accent">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-soft">
                      {r.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

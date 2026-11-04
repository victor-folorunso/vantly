import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';
import { allGuides, guideBySlug } from '@/lib/guides';

/**
 * A guide at /learn/<slug>. guides.ts says what makes something a guide
 * rather than a tool's doc.
 *
 * Laid out like the docs under each tool, prose with the contents in a rail,
 * so the two read as one body of writing. The foot of the page leads to the
 * tool the guide is about, because somebody who has just learned to read solfa
 * on a keyboard usually wants a song to try it on.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return allGuides().map((g) => ({ guide: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ guide: string }> }): Promise<Metadata> {
  const guide = guideBySlug((await params).guide);
  if (!guide) return {};
  const url = `${SITE.url}/learn/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: guide.title, description: guide.description, url },
  };
}

/** The h2s, each given an id to jump to. Same as ToolDocs. */
function outline(html: string) {
  const items: { id: string; text: string }[] = [];
  const withIds = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    items.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: withIds, items };
}

export default async function Page({ params }: { params: Promise<{ guide: string }> }) {
  const guide = guideBySlug((await params).guide);
  if (!guide) notFound();

  const { html, items } = outline(guide.html);
  const url = `${SITE.url}/learn/${guide.slug}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      dateModified: guide.updated || undefined,
      mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Learn', item: `${SITE.url}/learn` },
        { '@type': 'ListItem', position: 2, name: guide.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <article className="mx-auto w-full max-w-6xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          <Link href="/learn" className="hover:underline">
            Learn
          </Link>{' '}
          · {guide.minutes} min
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{guide.title}</h1>
        {guide.lede && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{guide.lede}</p>}

        <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_200px]">
          <div className="min-w-0">
            <div className="prose-vantly" dangerouslySetInnerHTML={{ __html: html }} />

            <aside className="mt-16 max-w-[78ch] rounded-2xl border border-line bg-accent-soft p-6 sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight">Try it with a song you know</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{guide.tool.description}</p>
              <Link
                href={`/${guide.tool.slug}`}
                className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-sm"
              >
                {guide.tool.name}
              </Link>
            </aside>
          </div>

          {items.length > 2 && (
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">On this page</p>
                <ul className="mt-3 space-y-2">
                  {items.map((i) => (
                    <li key={i.id}>
                      <a
                        href={`#${i.id}`}
                        className="block text-sm leading-snug text-ink-soft transition-colors hover:text-accent"
                      >
                        {i.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
        </div>
      </article>
    </>
  );
}

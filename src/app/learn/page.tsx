import type { Metadata } from 'next';
import Link from 'next/link';
import { allDocs } from '@/lib/docs';
import { allGuides } from '@/lib/guides';
import { SITE, CATEGORIES } from '@/lib/site';
import ToolHeader from '@/components/ToolHeader';

const title = 'Learn';
const description =
  'Every guide on Vantly, tool by tool. Why a file will not open, which format to pick, and what a conversion costs you.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/learn` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/learn` },
};

/**
 * A compilation of every doc, arranged tool by tool.
 *
 * Titles and summaries only, each linking to the doc where it lives, on the
 * tool's own page. Reprinting the bodies here would put this page in
 * competition with the pages it points at, and duplicate content splits a
 * ranking rather than doubling it.
 *
 * Two columns, matching the docs themselves. A centred column of text in a wide
 * window wastes both margins, and the fix for empty space beside prose is a
 * second column rather than a longer line. The rail carries the category jumps
 * and a way into the tools that have no guide, since somebody browsing here is
 * usually looking for a tool rather than a reading list.
 */
export default function Page() {
  const docs = allDocs();

  /* Docs link to the tool page they sit on; guides have pages of their own.
     Both are filed under the category of the tool they are about, so a reader
     looking at Media sees the solfa guides beside the solfa tools' docs. */
  const entries = [
    ...docs.map((d) => ({
      href: `/${d.tool.slug}#docs`,
      title: d.title,
      description: d.description,
      meta: `${d.tool.name} · ${d.minutes} min`,
      category: d.tool.category,
    })),
    ...allGuides().map((g) => ({
      href: `/learn/${g.slug}`,
      title: g.title,
      description: g.description,
      meta: `Guide · ${g.minutes} min`,
      category: g.tool.category,
    })),
  ];

  const groups = CATEGORIES.map((category) => ({
    category,
    anchor: category.toLowerCase(),
    docs: entries.filter((d) => d.category === category),
  })).filter((g) => g.docs.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <ToolHeader slug="learn" lede="Every guide on the site, grouped by what it is about.">Learn</ToolHeader>

      <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="max-w-2xl">
          {docs.length === 0 ? (
            <p className="text-ink-soft">Nothing written yet.</p>
          ) : (
            groups.map((g) => (
              <section key={g.category} id={g.anchor} className="scroll-mt-24 [&+section]:mt-12">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  {g.category}
                </h2>
                <ul className="mt-4 space-y-6">
                  {g.docs.map((d) => (
                    <li key={d.href}>
                      <Link href={d.href} className="group block">
                        <span className="text-lg font-medium transition-colors group-hover:text-accent">
                          {d.title}
                        </span>
                        <span className="mt-1 block leading-relaxed text-ink-soft">
                          {d.description}
                        </span>
                        <span className="mt-1.5 block text-xs tabular-nums text-ink-faint">
                          {d.meta}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            {groups.length > 1 && (
              <nav aria-label="Categories">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Jump to
                </p>
                <ul className="mt-3 space-y-2">
                  {groups.map((g) => (
                    <li key={g.anchor}>
                      <a
                        href={`#${g.anchor}`}
                        className="block text-sm text-ink-soft transition-colors hover:text-accent"
                      >
                        {g.category}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}

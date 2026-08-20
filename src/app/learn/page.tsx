import type { Metadata } from 'next';
import Link from 'next/link';
import { allDocs } from '@/lib/docs';
import { SITE, CATEGORIES, TOOLS } from '@/lib/site';

const title = 'Learn';
const description =
  'Every guide on Vantly, tool by tool. Why a file will not open, which format to pick, and what a conversion costs you.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/learn` },
  openGraph: { title, description, url: `${SITE.url}/learn` },
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

  const groups = CATEGORIES.map((category) => ({
    category,
    anchor: category.toLowerCase(),
    docs: docs.filter((d) => d.tool.category === category),
  })).filter((g) => g.docs.length > 0);

  const documented = new Set(docs.map((d) => d.tool.slug));
  const undocumented = TOOLS.filter((t) => t.live && !documented.has(t.slug)).slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learn</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
        Every guide on the site, grouped by what it is about.
      </p>

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
                    <li key={d.tool.slug}>
                      <Link href={`/${d.tool.slug}#docs`} className="group block">
                        <span className="text-lg font-medium transition-colors group-hover:text-accent">
                          {d.title}
                        </span>
                        <span className="mt-1 block leading-relaxed text-ink-soft">
                          {d.description}
                        </span>
                        <span className="mt-1.5 block text-xs tabular-nums text-ink-faint">
                          {d.tool.name} · {d.minutes} min
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

            {/* Most tools have no guide, and most never will, because nobody
                searches a question behind a UUID generator. Somebody browsing
                here is usually after a tool anyway, so the rail offers a few
                rather than pretending the guides are the whole site. */}
            {undocumented.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  No guide needed
                </p>
                <ul className="mt-3 space-y-2">
                  {undocumented.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/${t.slug}`}
                        className="block truncate text-sm text-ink-soft transition-colors hover:text-accent"
                      >
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/all"
                  className="mt-3 inline-block text-sm text-accent underline underline-offset-4"
                >
                  Every tool
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

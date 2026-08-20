import type { Metadata } from 'next';
import Link from 'next/link';
import { allDocs } from '@/lib/docs';
import { SITE, CATEGORIES } from '@/lib/site';

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
 * competition with the pages it is pointing at, and duplicate content splits
 * the ranking rather than doubling it.
 *
 * So this is an index that happens to read like a contents page, which is what
 * it should have been from the start.
 */
export default function Page() {
  const docs = allDocs();

  const groups = CATEGORIES.map((category) => ({
    category,
    docs: docs.filter((d) => d.tool.category === category),
  })).filter((g) => g.docs.length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learn</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
        Every guide on the site, grouped by what it is about. Each one lives on
        the page of the tool it explains.
      </p>

      {docs.length === 0 ? (
        <p className="mt-10 text-ink-soft">Nothing written yet.</p>
      ) : (
        groups.map((g) => (
          <section key={g.category} className="mt-12">
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
  );
}

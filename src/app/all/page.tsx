import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, TOOLS, CATEGORIES } from '@/lib/site';
import { CONVERSIONS, FORMATS } from '@/lib/conversions';

/**
 * Everything, in one page, grouped by source format.
 *
 * The footer only carries a slice, and search needs somebody to type. This is
 * the page that links to all of it at once, which matters for two different
 * readers: a crawler that cannot use a search box, and a person who wants to
 * know whether the thing they need exists before they bother trying.
 *
 * Unbuilt pairs are listed too, and marked. Hiding them would make the site
 * look smaller than it is, and pretending they work would be worse.
 */

const title = 'Every conversion and tool';
const description = `Every tool on Vantly: viewers, converters, editors, calculators and generators, grouped by what you are working with.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/all` },
  openGraph: { title, description, url: `${SITE.url}/all` },
};

export default function Page() {
  const kinds = ['image', 'document', 'data', 'media'] as const;
  const liveCount = CONVERSIONS.filter((c) => c.live).length + TOOLS.filter((t) => t.live).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything here</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Grouped by what you are starting from. Anything greyed out is not built
        yet.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
        {CATEGORIES.map((category) => {
          const inCat = TOOLS.filter((t) => t.category === category);
          if (!inCat.length) return null;
          return (
            <div key={category} id={category.toLowerCase()} className="mt-8 scroll-mt-24">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {category}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {inCat.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className={`inline-block rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        t.live
                          ? 'border-line bg-surface hover:border-accent hover:text-accent'
                          : 'border-dashed border-line text-ink-faint hover:border-ink-faint'
                      }`}
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section id="conversions" className="mt-16 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">Conversions</h2>
        {kinds.map((kind) => {
          const sources = FORMATS.filter(
            (f) => f.kind === kind && CONVERSIONS.some((c) => c.from.id === f.id),
          );
          if (!sources.length) return null;
          return (
            <div key={kind} className="mt-10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {kind === 'data' ? 'Data' : kind === 'media' ? 'Audio and video' : `${kind}s`}
              </h3>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((f) => {
                  const list = CONVERSIONS.filter((c) => c.from.id === f.id);
                  return (
                    <div key={f.id}>
                      <p className="text-sm font-medium">From {f.label}</p>
                      <ul className="mt-2 space-y-0.5">
                        {list.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/${c.slug}`}
                              className={`block truncate py-0.5 text-sm transition-colors hover:text-accent ${
                                c.live ? 'text-ink-soft' : 'text-ink-faint'
                              }`}
                            >
                              {c.from.label} to {c.to.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

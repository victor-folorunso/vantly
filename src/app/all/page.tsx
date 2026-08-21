import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, TOOLS, CATEGORIES } from '@/lib/site';
import { CONVERSIONS, FORMATS } from '@/lib/conversions';

/**
 * Everything, on one page, at a density that survives growth.
 *
 * Two readers need this: a crawler, which cannot type into a search box, and a
 * person checking whether the thing they want exists before they bother.
 *
 * Both are served by text links in columns rather than cards. A card costs a
 * title, a sentence and padding, so a hundred of them is a scroll and a
 * thousand is unusable. A link costs one line.
 *
 * Conversions were the worst of it: a flat run of a hundred chips with no
 * structure, which at a thousand would be a wall. They are grouped by source
 * format now, one row each, so the page grows sideways in small blocks instead
 * of downwards forever.
 */

const title = 'Every conversion and tool';
const description =
  'Every tool on Vantly: viewers, converters, editors, calculators and generators, grouped by what you are working with.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/all` },
  openGraph: { title, description, url: `${SITE.url}/all` },
};

function Rule() {
  return <span className="mr-2.5 inline-block h-4 w-1 translate-y-0.5 rounded-full bg-accent" />;
}

export default function Page() {
  /* Conversions keyed by source, so each format is one compact block. */
  const bySource = FORMATS.map((f) => ({
    format: f,
    items: CONVERSIONS.filter((c) => c.from.id === f.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Toolbox</h1>

      {/* Jump links, because this page is long by design and scrolling to
          Generators past ten other sections is not navigation. */}
      <nav className="mt-6 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <a
            key={c}
            href={`#${c.toLowerCase()}`}
            className="rounded-md border border-line px-2.5 py-2 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent sm:py-1"
          >
            {c}
          </a>
        ))}
        <a
          href="#conversions"
          className="rounded-md border border-accent bg-accent-soft px-2.5 py-1 text-xs text-accent"
        >
          Conversions
        </a>
      </nav>

      <section className="mt-10">
        {CATEGORIES.map((category) => {
          const inCat = TOOLS.filter((t) => t.category === category);
          if (!inCat.length) return null;
          return (
            <div key={category} id={category.toLowerCase()} className="mt-8 scroll-mt-24 first:mt-0">
              <h2 className="text-base font-semibold tracking-tight">
                <Rule />
                {category}
              </h2>
              <ul className="mt-2.5 grid gap-x-6 gap-y-1 sm:gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {inCat.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className={`block truncate py-2 text-sm transition-colors hover:text-accent sm:py-1 ${
                        t.live ? 'text-ink-soft' : 'text-ink-faint'
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

      <section id="conversions" className="mt-14 scroll-mt-24">
        <h2 className="text-base font-semibold tracking-tight">
          <Rule />
          Conversions
        </h2>

        {/* One block per source format. The source is stated once as a heading
            rather than repeated in every link, which is what made the flat list
            unreadable: a hundred rows all starting with the same two words. */}
        <div className="mt-3 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bySource.map((g) => (
            <div key={g.format.id} className="rounded-lg border border-line bg-surface p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                From {g.format.label}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.slug}`}
                      title={`${c.from.label} to ${c.to.label}`}
                      className={`inline-block rounded border border-line px-2 py-2 text-xs transition-colors hover:border-accent hover:text-accent sm:py-0.5 ${
                        c.live ? 'text-ink-soft' : 'text-ink-faint'
                      }`}
                    >
                      {c.to.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

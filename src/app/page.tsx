import Link from 'next/link';
import FilePicker from '@/components/FilePicker';
import { TOOLS, CATEGORIES } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

/**
 * Built for a thousand tools, not the forty that exist.
 *
 * Every decision here answers one question: does this still work when a section
 * holds two hundred entries. Listing every category in full failed it. So did
 * fanning every tool into the footer, and so did a flat wall of conversions.
 *
 * What survives is a sample plus a way through. Five per category, a link into
 * the full section, one link to everything. The page is the same length at
 * forty tools or four thousand.
 *
 * Only the first five categories get a row. After that the page changes shape
 * rather than scrolling on, because eleven identical blocks is a list
 * pretending to be a layout.
 */

const PER_SECTION = 5;
const FEATURED_CATEGORIES = CATEGORIES.slice(0, 5);

/**
 * A stable pick that still varies as the site grows.
 *
 * Deliberately not shuffled in the browser. Swapping the cards after hydration
 * is the same visible correction that made the Cladior dashboard feel broken,
 * and here it would land on the first thing anybody sees.
 */
function sample<T>(items: T[], count: number, seed: number): T[] {
  if (items.length <= count) return items;
  const start = seed % items.length;
  return Array.from({ length: count }, (_, i) => items[(start + i) % items.length]);
}

function Rule() {
  return <span className="mr-2.5 inline-block h-3.5 w-1 translate-y-0.5 rounded-full bg-accent" />;
}

export default function Home() {
  const sections = FEATURED_CATEGORIES.map((category, i) => {
    const all = TOOLS.filter((t) => t.category === category);
    const live = all.filter((t) => t.live);
    const rest = all.filter((t) => !t.live);
    return {
      category,
      anchor: category.toLowerCase(),
      tools: sample([...live, ...rest], PER_SECTION, TOOLS.length + i * 3),
    };
  }).filter((s) => s.tools.length > 0);

  const others = [
    ...CATEGORIES.slice(5).map((category) => ({
      label: category,
      anchor: category.toLowerCase(),
      count: TOOLS.filter((t) => t.category === category).length,
    })),
    { label: 'Conversions', anchor: 'conversions', count: CONVERSIONS.length },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="pt-8 pb-12 sm:pt-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tools you can just use.
        </h1>

        <div className="mt-6">
          <FilePicker />
        </div>
      </section>

      <div className="space-y-11">
        {sections.map((s) => (
          <section key={s.category}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-base font-semibold tracking-tight">
                <Rule />
                {s.category}
              </h2>
              <Link
                href={`/all#${s.anchor}`}
                className="shrink-0 text-sm text-ink-faint transition-colors hover:text-accent"
              >
                View more
              </Link>
            </div>

            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {s.tools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/${t.slug}`}
                    className={`block h-full rounded-lg border border-line p-3.5 transition-colors ${
                      t.live ? 'bg-surface hover:border-accent' : 'hover:border-ink-faint'
                    }`}
                  >
                    <span className={`text-sm font-medium ${t.live ? '' : 'text-ink-faint'}`}>
                      {t.name}
                    </span>
                    <span
                      className={`mt-0.5 block text-sm leading-snug ${
                        t.live ? 'text-ink-soft' : 'text-ink-faint'
                      }`}
                    >
                      {t.blurb}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* The page changes shape here rather than repeating the block six more
          times. Categories as destinations, not another wall of cards. */}
      <section className="mt-12">
        <h2 className="text-base font-semibold tracking-tight">
          <Rule />
          Also here
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((c) => (
            <li key={c.label}>
              <Link
                href={`/all#${c.anchor}`}
                className="inline-flex items-baseline gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
              >
                {c.label}
                <span className="text-xs tabular-nums text-ink-faint">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <Link
          href="/all"
          className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-[1.02]"
        >
          View all tools
        </Link>
      </div>
    </div>
  );
}

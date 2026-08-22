import Link from 'next/link';
import FilePicker from '@/components/FilePicker';
import ShuffledTools from '@/components/ShuffledTools';
import { TOOLS, CATEGORIES } from '@/lib/site';

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
 * What the server renders, before the browser reshuffles it.
 *
 * Has to be deterministic so the HTML and the first paint agree. The variety
 * comes from ShuffledTools once the page is interactive.
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
      all: [...live, ...rest],
      tools: sample([...live, ...rest], PER_SECTION, TOOLS.length + i * 3),
    };
  }).filter((s) => s.tools.length > 0);

  const others = [
    ...CATEGORIES.slice(5).map((category) => ({
      label: category,
      anchor: category.toLowerCase(),
    })),
    { label: 'Conversions', anchor: 'conversions' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="pt-6 pb-12 sm:pt-8">
        {/* The visible tagline moved to the header, but the page still needs
            one h1 for search. Hidden rather than duplicated on screen. */}
        <h1 className="sr-only">Everyday tools for everyone</h1>

        <div>
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
                className="-my-3 shrink-0 py-3 text-sm text-ink-faint transition-colors hover:text-accent"
              >
                View more
              </Link>
            </div>

            <ShuffledTools tools={s.all} count={PER_SECTION} initial={s.tools} />
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
                className="inline-block rounded-lg border border-line bg-surface px-3.5 py-3 text-sm transition-colors hover:border-accent hover:text-accent"
              >
                {c.label}
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

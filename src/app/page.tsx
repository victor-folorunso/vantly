import Link from 'next/link';
import FilePicker from '@/components/FilePicker';
import { TOOLS, CATEGORIES } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

/**
 * One row per category, and a way into the rest.
 *
 * Three cards is exactly one row on a wide screen, so a category costs a single
 * line whatever it contains. View all goes to the matching section of /all
 * rather than a generic index, so the click lands where the reader was looking.
 *
 * Nothing here announces what is or is not finished. Unfinished tools are grey
 * and that is the whole treatment: no badge, no count, no label.
 */

/** One row on a wide screen. */
const PER_ROW = 3;

export default function Home() {
  const sections = CATEGORIES.map((category) => {
    const all = TOOLS.filter((t) => t.category === category);
    return {
      category,
      anchor: category.toLowerCase(),
      // Working ones first, so a three item row is never all grey.
      row: [...all].sort((a, b) => Number(b.live) - Number(a.live)).slice(0, PER_ROW),
      total: all.length,
    };
  }).filter((s) => s.row.length > 0);

  const someConversions = CONVERSIONS.filter((c) => c.live).slice(0, PER_ROW * 4);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="pt-10 pb-10 sm:pt-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.75rem]">
          Free tools. No sign up.
        </h1>

        <div className="mt-6 max-w-3xl">
          <FilePicker />
        </div>
      </section>

      {sections.map((s) => (
        <section key={s.category} className="border-t border-line py-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight">{s.category}</h2>
            <Link
              href={`/all#${s.anchor}`}
              className="shrink-0 text-sm text-accent underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.row.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${t.slug}`}
                  className={`block h-full rounded-xl border border-line p-4 transition-colors ${
                    t.live ? 'bg-surface hover:border-accent' : 'hover:border-ink-faint'
                  }`}
                >
                  <span className={`font-medium ${t.live ? '' : 'text-ink-faint'}`}>{t.name}</span>
                  <span
                    className={`mt-1 block text-sm leading-relaxed ${
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

      <section className="border-t border-line py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold tracking-tight">Conversions</h2>
          <Link
            href="/all#conversions"
            className="shrink-0 text-sm text-accent underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {someConversions.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/${c.slug}`}
                className="inline-block rounded-lg border border-line bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
              >
                {c.from.label} to {c.to.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

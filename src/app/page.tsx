import Link from 'next/link';
import FilePicker from '@/components/FilePicker';
import { TOOLS, CATEGORIES, SITE } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

/**
 * Short on purpose.
 *
 * Two earlier versions were too long. The first listed every category in full
 * with a running commentary on what was finished. The second cut the commentary
 * but still gave eleven categories a row of cards each, which came to four
 * thousand pixels of scrolling before the footer.
 *
 * Cards are expensive: each one costs a title, a sentence and padding. So only
 * a handful of tools get one, and everything else is a text link in a dense
 * column, which is how a site with a hundred and sixty pages stays navigable.
 *
 * Nothing announces what is or is not built. Unfinished things are grey.
 */

/** Shown as cards. Deliberately short, and ordered by what people arrive for. */
const FEATURED = [
  'remove-background',
  'image-compressor',
  'heic-to-jpg',
  'image-enhancer',
  'json-formatter',
  'password-generator',
];

export default function Home() {
  const featured = FEATURED.map((slug) => TOOLS.find((t) => t.slug === slug)).filter(
    (t): t is NonNullable<typeof t> => Boolean(t),
  );

  const columns = CATEGORIES.map((category) => ({
    category,
    tools: [...TOOLS.filter((t) => t.category === category)].sort(
      (a, b) => Number(b.live) - Number(a.live),
    ),
  })).filter((c) => c.tools.length > 0);

  const someConversions = CONVERSIONS.filter((c) => c.live).slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="pt-10 pb-10 sm:pt-14">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem]">
            Start with your file.{' '}
            <span className="text-ink-soft">Open it, convert it, or change it.</span>
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
            Viewers, converters, editors and a pile of small utilities. No
            account, no watermark, and nothing capped at a size that makes the
            result useless.
          </p>
        </div>

        <div className="mt-7 max-w-3xl">
          <FilePicker />
        </div>
      </section>

      <section className="border-t border-line py-8">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="block h-full rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"
              >
                <span className="font-medium">{t.name}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                  {t.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line py-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Everything else</h2>
          <Link href="/all" className="shrink-0 text-sm text-accent underline underline-offset-4">
            Full list
          </Link>
        </div>

        <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <Link href={`/all#${col.category.toLowerCase()}`} className="hover:text-ink">
                  {col.category}
                </Link>
              </h3>
              <ul className="mt-2 space-y-0.5">
                {col.tools.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className={`block truncate py-0.5 text-sm transition-colors hover:text-accent ${
                        t.live ? 'text-ink-soft' : 'text-ink-faint'
                      }`}
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Convert a file</h2>
          <Link
            href="/all#conversions"
            className="shrink-0 text-sm text-accent underline underline-offset-4"
          >
            All {CONVERSIONS.length}
          </Link>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
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

      <section className="max-w-2xl border-t border-line py-10">
        <h2 className="text-lg font-semibold tracking-tight">Why these are free</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Most of them cost us nothing to run, because your browser does the
          work. So when another site hands you a 612 pixel preview and wants{' '}
          {'$'}15 a month for the real one, that cap isn&rsquo;t technical. They
          just decided to charge you there.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          {SITE.name} has nothing to recover, so there&rsquo;s nothing to cap.
        </p>
      </section>
    </div>
  );
}

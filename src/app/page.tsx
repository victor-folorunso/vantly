import Link from 'next/link';
import FilePicker from '@/components/FilePicker';
import { LIVE_TOOLS, TOOLS, byCategory, SITE } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

export default function Home() {
  const groups = byCategory(TOOLS);
  const liveConversions = CONVERSIONS.filter((c) => c.live).length;
  const readyNow = CONVERSIONS.filter((c) => c.live).slice(0, 9);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      {/* The picker is the product, so it has to be on screen without scrolling.
          A hero big enough to push it under the fold is a hero working against
          the page it introduces. */}
      <section className="pt-10 pb-10 sm:pt-14">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem]">
            Start with your file.{' '}
            <span className="text-ink-soft">Open it, convert it, or change it.</span>
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
            Viewers, converters and editors, {CONVERSIONS.length + TOOLS.length} of
            them. No account, no watermark, and no export capped at a size that
            makes the result useless.
          </p>
        </div>

        {/* Two columns on desktop because the picker alone left the right half
            of the screen empty. The panel beside it is not decoration: it is
            the shortest path to the pages that work, and it puts real links
            above the fold where both readers and crawlers find them first. */}
        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <FilePicker />

          <aside className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Ready to use
            </h2>
            <ul className="mt-3 space-y-1">
              {readyNow.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    className="group flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-alt"
                  >
                    <span className="truncate">
                      {c.from.label} to {c.to.label}
                    </span>
                    {/* No trailing format label here. It restated the target
                        that the link text already ends with, so every row read
                        "JPG to PNG ... PNG". */}
                    <span className="shrink-0 text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-faint tabular-nums">
              {liveConversions + LIVE_TOOLS.length} of {CONVERSIONS.length + TOOLS.length} ready
              today. The rest have a page and a plan, not a date.
            </p>
          </aside>
        </div>
      </section>

      <section id="tools" className="scroll-mt-24 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">Tools</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          The ones that are not simply turning one format into another.
        </p>

        {groups.map((group) => (
          <div key={group.category} className="mt-10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {group.category}
            </h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/${t.slug}`}
                    className={`block h-full rounded-xl border p-5 transition-all ${
                      t.live
                        ? 'border-line bg-surface shadow-sm hover:border-accent hover:shadow-md'
                        : 'border-dashed border-line hover:border-ink-faint'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-lg font-medium ${t.live ? '' : 'text-ink-faint'}`}
                      >
                        {t.name}
                      </span>
                      {!t.live && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">
                          Soon
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1.5 block text-sm leading-relaxed ${
                        t.live ? 'text-ink-soft' : 'text-ink-faint'
                      }`}
                    >
                      {t.blurb}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="max-w-2xl py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Why these are free</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Most of these cost nothing to run. The work happens on your computer,
          in your browser, using capabilities it already has. When a site caps
          your export at 500 pixels and asks for {'$'}15 a month for the sharp
          one, that limit is a business decision rather than a technical one.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          {SITE.name} does not have the cost, so it does not have the cap.
        </p>
      </section>
    </div>
  );
}

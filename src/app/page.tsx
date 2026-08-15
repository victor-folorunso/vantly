import Link from 'next/link';
import FilePicker from '@/components/FilePicker';
import { LIVE_TOOLS, TOOLS, byCategory, SITE } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

export default function Home() {
  const groups = byCategory(TOOLS);
  const liveConversions = CONVERSIONS.filter((c) => c.live).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      {/* The picker is the product, so it has to be on screen without scrolling.
          A hero big enough to push it under the fold is a hero working against
          the page it introduces. */}
      <section className="pt-10 pb-10 sm:pt-14">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem]">
            Start with your file.{' '}
            <span className="text-ink-soft">We will tell you what it can become.</span>
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
            Over {CONVERSIONS.length} conversions and a set of small tools. No
            account, no watermark, and no export capped at a size that makes the
            result useless.
          </p>
        </div>

        <div className="mt-7 max-w-3xl">
          <FilePicker />
        </div>

        {/* Ready over total, not ready plus planned. The conversion list already
            contains the live ones, so adding the two together counted them
            twice and advertised more than exists. */}
        <p className="mt-4 text-sm text-ink-faint tabular-nums">
          {liveConversions + LIVE_TOOLS.length} of {CONVERSIONS.length + TOOLS.length} ready today.
        </p>
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

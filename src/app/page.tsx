import Link from 'next/link';
import { LIVE_TOOLS, SOON_TOOLS, TOOLS, byCategory, SITE } from '@/lib/site';

export default function Home() {
  const groups = byCategory(TOOLS);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="max-w-3xl py-20 sm:py-28">
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Small tools that do one thing, without asking for anything.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          No account, no watermark, no export capped at a size that makes the
          result useless. Everything runs in your browser, so your files stay on
          your machine.
        </p>
        <p className="mt-4 text-sm text-ink-faint tabular-nums">
          {LIVE_TOOLS.length} ready, {SOON_TOOLS.length} on the way.
        </p>
      </section>

      <section id="tools" className="scroll-mt-20 pb-8">
        {groups.map((group) => (
          <div key={group.category} className="mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {group.category}
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((t) =>
                t.live ? (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className="block h-full rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent"
                    >
                      <span className="text-lg font-medium">{t.name}</span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
                        {t.blurb}
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className="block h-full rounded-lg border border-dashed border-line p-5 transition-colors hover:border-ink-faint"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-lg font-medium text-ink-faint">{t.name}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">
                          Soon
                        </span>
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-faint">
                        {t.blurb}
                      </span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </section>

      <section className="max-w-2xl py-16">
        <h2 className="text-xl font-semibold tracking-tight">Why these are free</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Most of these tools cost nothing to run. The work happens on your
          computer, in your browser, using capabilities it already has. When a
          site caps your export at 500 pixels and asks for {'$'}15 a month for the
          sharp one, that limit is a business decision rather than a technical
          one.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          {SITE.name} does not have the cost, so it does not have the cap.
        </p>
      </section>
    </div>
  );
}

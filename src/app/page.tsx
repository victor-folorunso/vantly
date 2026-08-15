import Link from 'next/link';
import { LIVE_TOOLS, TOOLS, SITE } from '@/lib/site';

export default function Home() {
  const soon = TOOLS.filter((t) => !t.live);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="py-20 sm:py-28 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
          Small tools that do one thing, without asking for anything.
        </h1>
        <p className="mt-5 text-lg text-ink-soft leading-relaxed">
          No account, no watermark, no export capped at a size that makes the
          result useless. Everything runs in your browser, so your files stay on
          your machine.
        </p>
      </section>

      <section id="tools" className="pb-8 scroll-mt-20">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Tools
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {LIVE_TOOLS.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="block rounded-lg border border-line bg-surface p-6 hover:border-accent transition-colors h-full"
              >
                <span className="font-medium text-lg">{t.name}</span>
                <span className="mt-1.5 block text-sm text-ink-soft leading-relaxed">
                  {t.blurb}
                </span>
              </Link>
            </li>
          ))}

          {soon.map((t) => (
            <li
              key={t.slug}
              className="rounded-lg border border-line border-dashed p-6 h-full"
            >
              <span className="font-medium text-lg text-ink-faint">{t.name}</span>
              <span className="mt-1.5 block text-sm text-ink-faint leading-relaxed">
                {t.blurb}
              </span>
              <span className="mt-3 inline-block text-xs uppercase tracking-wider text-ink-faint">
                Soon
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-20 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">
          Why these are free
        </h2>
        <p className="mt-4 text-ink-soft leading-relaxed">
          Most of these tools cost nothing to run. The work happens on your
          computer, in your browser, using capabilities it already has. When a
          site caps your export at 500 pixels and asks for {'$'}15 a month for
          the sharp one, that limit is a business decision rather than a
          technical one.
        </p>
        <p className="mt-4 text-ink-soft leading-relaxed">
          {SITE.name} does not have the cost, so it does not have the cap.
        </p>
      </section>
    </div>
  );
}

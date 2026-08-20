import Link from 'next/link';
import Search from '@/components/Search';
import { TOOLS } from '@/lib/site';

/**
 * The 404, which is a real page rather than a dead end.
 *
 * With output: export this becomes 404.html, which the host serves for any path
 * that was not built. That happens more than it sounds: this site has a hundred
 * and sixty addresses and people guess at them. /learn/heic-to-jpg is a
 * perfectly sensible guess, and it is not a real URL, because the article is
 * named for the question rather than for the tool.
 *
 * So the page offers the search box and a few working tools instead of a
 * shrug.
 */
export default function NotFound() {
  const live = TOOLS.filter((t) => t.live).slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        That page is not here.
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        It may have been renamed, or the address may be a near miss. Search for
        what you were after.
      </p>

      <div className="mt-6">
        <Search placeholder="Search tools…" />
      </div>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Or start here
      </h2>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {live.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/${t.slug}`}
              className="block rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-accent"
            >
              <span className="text-sm font-medium">{t.name}</span>
              <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{t.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 flex gap-5 text-sm">
        <Link href="/all" className="text-accent underline underline-offset-4">
          Every tool
        </Link>
        <Link href="/learn" className="text-accent underline underline-offset-4">
          Learn
        </Link>
      </p>
    </div>
  );
}

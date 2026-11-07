'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Tool } from '@/lib/site';

/**
 * A different five each time the page loads.
 *
 * The site is a static export, so every visitor is handed the same HTML. A
 * genuine reshuffle can therefore only happen in the browser, and the first
 * paint has to be something valid rather than empty.
 *
 * So the server picks a stable set, and the shuffle happens once on mount. The
 * cards are a fixed size and the grid does not reflow, so what changes is the
 * text inside five boxes rather than the shape of the page. That is a different
 * thing from the dashboard problem, where the layout itself moved after
 * hydration.
 *
 * Working tools are weighted to the front of the draw. A random five that
 * happened to be five unbuilt ones would make the site look dead.
 */
export default function ShuffledTools({
  tools,
  count,
  initial,
}: {
  tools: Tool[];
  count: number;
  /** What the server rendered, so the first paint matches the HTML exactly. */
  initial: Tool[];
}) {
  const [shown, setShown] = useState<Tool[]>(initial);

  useEffect(() => {
    const live = tools.filter((t) => t.live);
    const rest = tools.filter((t) => !t.live);

    // Fisher-Yates on a copy. Math.random is fine here: nothing depends on the
    // result being unguessable.
    const shuffle = <T,>(xs: T[]) => {
      const a = [...xs];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Fill from what works first, then top up. At most one unbuilt tool gets in
    // while there are enough live ones to avoid it.
    const picked = [...shuffle(live), ...shuffle(rest)].slice(0, count);
    setShown(shuffle(picked));
  }, [tools, count]);

  return (
    <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((t) => (
        <li key={t.slug}>
          <Link
            href={`/${t.slug}`}
            className={`group relative block h-full rounded-xl border border-line p-4 pr-10 transition duration-200 ${
              t.live
                ? 'bg-surface hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]'
                : 'hover:border-ink-faint'
            }`}
          >
            <span className={`text-sm font-semibold tracking-tight ${t.live ? '' : 'text-ink-faint'}`}>
              {t.name}
            </span>
            {/* The arrow says "open" on hover. Hidden on unbuilt tools, which
                open a notice rather than a tool. */}
            {t.live && (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="absolute right-3.5 top-4 size-4 -translate-x-1 text-accent opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            )}
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
  );
}

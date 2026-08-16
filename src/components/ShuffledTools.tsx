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
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { barPosition } from '@/lib/solfa/notation';

/**
 * The melody on a staff, drawn by abcjs from ABC notation.
 *
 * abcjs is about 120 kB gzipped, so it is imported only when somebody turns
 * staff notation on, not with the page. The bar being played is lit the same
 * way as the current syllable, and clicking a bar jumps the song there.
 *
 * abcjs tags every note with its line and its bar within that line
 * (abcjs-l2 abcjs-m1), which is how a click is turned back into a bar number
 * and how the current bar is found to light it. toAbc writes four bars a
 * line, which barPosition mirrors.
 */
export default function StaffView({
  abc,
  currentBar = -1,
  onBar,
}: {
  abc: string;
  /** The bar being played, or -1. */
  currentBar?: number;
  onBar?: (bar: number) => void;
}) {
  const target = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [drawn, setDrawn] = useState(0);
  // A ref, so a new handler from the parent does not redraw the whole staff.
  const onBarRef = useRef(onBar);
  useEffect(() => {
    onBarRef.current = onBar;
  }, [onBar]);

  useEffect(() => {
    let cancelled = false;
    import('abcjs')
      .then(({ default: abcjs }) => {
        if (cancelled || !target.current) return;
        abcjs.renderAbc(target.current, abc, {
          add_classes: true,
          responsive: 'resize',
          foregroundColor: 'currentColor',
          paddingtop: 0,
          paddingbottom: 0,
          paddingleft: 0,
          paddingright: 0,
          clickListener: (element) => {
            const classes = [...(element.abselem?.elemset?.[0]?.classList ?? [])];
            const line = Number(classes.find((c) => /^abcjs-l\d+$/.test(c))?.slice(7));
            const measure = Number(classes.find((c) => /^abcjs-m\d+$/.test(c))?.slice(7));
            if (Number.isFinite(line) && Number.isFinite(measure)) onBarRef.current?.(line * 4 + measure);
          },
        });
        setFailed(false);
        setDrawn((n) => n + 1);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [abc]);

  useEffect(() => {
    const root = target.current;
    if (!root) return;
    root.querySelectorAll('.now-bar').forEach((el) => el.classList.remove('now-bar'));
    if (currentBar < 0) return;
    const { line, measure } = barPosition(currentBar);
    root
      .querySelectorAll(
        `.abcjs-note.abcjs-l${line}.abcjs-m${measure}, .abcjs-rest.abcjs-l${line}.abcjs-m${measure}`,
      )
      .forEach((el) => el.classList.add('now-bar'));
  }, [currentBar, drawn]);

  return (
    <>
      {failed && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">
          The staff could not be drawn. The downloads still work.
        </p>
      )}
      <div ref={target} className="staff-view my-3 text-ink" aria-label="The melody in staff notation" />
    </>
  );
}

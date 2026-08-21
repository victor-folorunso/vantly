'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { claim } from '@/lib/handoff';

/**
 * Picks up files chosen on the home page.
 *
 * The tool works out which handoff belongs to it from its own address, so
 * nothing has to be threaded through the page component. A handoff addressed
 * to the JPG to PNG page is ignored by the PDF reader even if somebody lands
 * there instead.
 *
 * Runs once. The ref is not decoration: in development React mounts effects
 * twice on purpose, and without the guard the second run would claim an
 * already emptied handoff and, worse, a future change that did not clear on
 * read would load the same file twice.
 */
export function useHandoff(receive: (files: File[]) => void): void {
  const pathname = usePathname();
  const done = useRef(false);
  const latest = useRef(receive);
  latest.current = receive;

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const slug = (pathname ?? '').split('/').filter(Boolean)[0];
    if (!slug) return;
    const files = claim(slug);
    if (files.length) latest.current(files);
  }, [pathname]);
}

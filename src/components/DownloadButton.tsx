'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A download button that admits it is doing something.
 *
 * The bug this fixes: a plain download link looks identical before and after
 * it is pressed. On a 6MB file the browser takes a couple of seconds to write
 * it, nothing on the page changes, so people press it again. Every press is
 * another download, and they end up with four copies and no idea why.
 *
 * So the button has four states and always leaves one of them on screen:
 *
 *   idle     Download
 *   working  Preparing, and it ignores further presses
 *   done     Saved, held for a few seconds
 *   again    Download again, so a second copy is still one press away
 *
 * Two ways to use it. Give it `href` when the file already exists, and it
 * behaves as a link with the state added. Give it `prepare` when the file has
 * to be made on the press, and it will build the blob, save it, and revoke the
 * object URL afterwards.
 */

type State = 'idle' | 'working' | 'done';

export default function DownloadButton({
  filename,
  href,
  prepare,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  filename: string;
  /** When the file already exists. */
  href?: string;
  /** When it has to be made first. Returning null means it failed. */
  prepare?: () => Promise<Blob | null>;
  children?: React.ReactNode;
  variant?: 'primary' | 'quiet';
  disabled?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<State>('idle');
  const [pressed, setPressed] = useState(false);
  const timer = useRef<number | null>(null);

  /* The guard has to be a ref, not the state above.
     React batches state updates, so five presses inside one tick all read
     state as 'idle', all pass a state based check, and all download. That is
     exactly the bug this button exists to fix, and the first version of it
     still had it: measured five presses, five files. A ref updates the moment
     it is assigned. */
  const inFlight = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  /* The file changed underneath us, so the last result no longer describes
     what this button would give you. */
  useEffect(() => {
    inFlight.current = false;
    setState('idle');
    setPressed(false);
  }, [href, filename]);

  const save = useCallback((blob: Blob | string, name: string) => {
    const url = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Only revoke what was made here. Revoking a URL the caller still holds
    // would break the preview it is showing.
    if (typeof blob !== 'string') {
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  }, []);

  const run = useCallback(async () => {
    if (inFlight.current || disabled) return;
    inFlight.current = true;

    setState('working');
    try {
      if (prepare) {
        const blob = await prepare();
        if (!blob) {
          // Nothing to save, so the guard has to come off here too. Leaving
          // it on would lock the button for good after one failed attempt.
          inFlight.current = false;
          setState('idle');
          return;
        }
        save(blob, filename);
      } else if (href) {
        save(href, filename);
      }
      setPressed(true);
      setState('done');
      if (timer.current) window.clearTimeout(timer.current);
      // Stays shut while it says Saved. Somebody who wants a second copy can
      // have one two and a half seconds later, by which point they are asking
      // for it rather than repeating themselves.
      timer.current = window.setTimeout(() => {
        inFlight.current = false;
        setState('idle');
      }, 2500);
    } catch {
      inFlight.current = false;
      setState('idle');
    }
  }, [disabled, prepare, href, filename, save]);

  const label =
    state === 'working'
      ? 'Preparing…'
      : state === 'done'
        ? 'Saved'
        : pressed
          ? 'Download again'
          : (children ?? 'Download');

  const base =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60';
  const look =
    variant === 'primary'
      ? 'bg-accent text-accent-ink'
      : 'border border-accent text-accent';

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={disabled || state === 'working'}
      aria-live="polite"
      className={`${base} ${look} ${className}`}
    >
      {state === 'working' && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {label}
    </button>
  );
}

'use client';

/**
 * Says that what is on screen came back from a previous visit.
 *
 * A tool that silently refills itself is unsettling: you cannot tell whether
 * you left it there or the site did, and on a shared machine that matters. So
 * anything restored says so, and offers to throw it away in one press.
 *
 * Quiet on purpose. This is a fact about the page, not a warning, and it
 * disappears the moment anything is typed.
 */
export default function RestoredNotice({
  onClear,
  what = 'what you had here last time',
}: {
  onClear: () => void;
  what?: string;
}) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
      <span>Kept {what}, on this device.</span>
      <button
        onClick={onClear}
        className="underline underline-offset-4 transition-colors hover:text-accent"
      >
        Clear it
      </button>
    </p>
  );
}

'use client';

/**
 * The shape every tool uses: settings on the left, the work on the right.
 *
 * Written once rather than per tool for the boring reason that a layout copied
 * forty times becomes forty slightly different layouts. It also puts three
 * decisions in one place instead of leaving them to whoever writes the next
 * tool.
 *
 * The card. Settings live inside a bordered panel. Controls floating loose on
 * the page read as page furniture rather than as the thing you operate, and
 * the merge tool shipped exactly that way.
 *
 * The order. A left rail becomes a block above everything else on a phone,
 * which puts a column of settings in front of somebody who has not chosen a
 * file yet. So the order flips below the breakpoint: the work comes first and
 * the settings sit under it.
 *
 * The rail sticks. A long list of files scrolls past while the settings stay
 * where they were put.
 */

export default function ToolLayout({
  settings,
  children,
  /** Sits at the top right of the work area, where downloads belong. */
  actions,
  /** Small text at the top left of the work area: a count, a size, a status. */
  status,
  title = 'Settings',
}: {
  /** Null when the tool has none. The rail is dropped rather than left empty. */
  settings: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  status?: React.ReactNode;
  title?: string;
}) {
  /* Some tools have nothing to configure, and a few change shape between
     modes and only have settings in one of them. An empty 300px card is worse
     than no card, so the rail is dropped and the work takes the full width. */
  if (!settings) {
    return (
      <div>
        {(status || actions) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 text-sm text-ink-soft">{status}</div>
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="order-2 rounded-2xl border border-line bg-surface p-5 shadow-sm lg:order-1 lg:sticky lg:top-20">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          {title}
        </h2>
        <div className="mt-4 space-y-5">{settings}</div>
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        {(status || actions) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 text-sm text-ink-soft">{status}</div>
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

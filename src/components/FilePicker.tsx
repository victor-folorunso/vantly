'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  targetsFor,
  normaliseExtension,
  FORMAT_BY_ID,
  CONVERSION_BY_SLUG,
} from '@/lib/conversions';
import { stash, viewerFor } from '@/lib/handoff';
import { toolBySlug } from '@/lib/site';
import FilePreview from '@/components/FilePreview';

/**
 * Pick the files first, then decide what they become.
 *
 * Every converter asks the opposite way round: choose the conversion from a
 * menu, then supply a file that had better match. That is backwards from how
 * anybody arrives. They already have the file. What they do not know is what it
 * can turn into, which is the one thing a list of extensions is bad at saying.
 *
 * Each row carries its own target, because a queue is rarely one kind of file
 * and forcing a single output on all of them is how you end up converting a
 * spreadsheet to JPG. The bar underneath sets every row at once, which is what
 * people actually want most of the time, so both exist rather than either.
 *
 * Only the filename is read here. Nothing is decoded or held, because the only
 * question at this point is which page this person should be on.
 */

type Row = {
  id: string;
  file: File;
  ext: string;
  target: string | null;
};

let counter = 0;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FilePicker() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const add = useCallback((files: FileList | File[]) => {
    const next: Row[] = Array.from(files).map((file) => {
      const dot = file.name.lastIndexOf('.');
      const ext = normaliseExtension(dot > -1 ? file.name.slice(dot + 1) : '');
      const options = targetsFor(ext);
      return {
        id: `f${counter++}`,
        file,
        ext,
        // Preselect when there is an obvious answer, so a queue of one photo is
        // two clicks rather than three.
        target: options.length ? options[0].to.id : null,
      };
    });
    setRows((prev) => [...prev, ...next]);
  }, []);

  const setTarget = useCallback((id: string, target: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, target } : r)));
  }, []);

  const remove = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /**
   * Formats every file in the queue can actually reach. An intersection rather
   * than a union, because a bulk control that silently skips half the list is
   * worse than one that admits there is no shared answer.
   */
  const sharedTargets = useMemo(() => {
    if (!rows.length) return [];
    const sets = rows.map((r) => new Set(targetsFor(r.ext).map((c) => c.to.id)));
    const [first, ...rest] = sets;
    return [...first].filter((id) => rest.every((s) => s.has(id)));
  }, [rows]);

  const applyToAll = useCallback(
    (target: string) => {
      setRows((prev) =>
        prev.map((r) =>
          targetsFor(r.ext).some((c) => c.to.id === target) ? { ...r, target } : r,
        ),
      );
    },
    [],
  );

  /* What pressing Convert would do. All rows heading to the same place means one
     page can serve them; a mixed queue has no single page to go to yet. */
  const plan = useMemo(() => {
    const usable = rows.filter((r) => r.target);
    if (!usable.length) return null;
    const slugs = new Set(usable.map((r) => `${r.ext}-to-${r.target}`));
    if (slugs.size !== 1) return { kind: 'mixed' as const };
    const slug = [...slugs][0];
    const conversion = CONVERSION_BY_SLUG.get(slug);
    if (!conversion) return { kind: 'unknown' as const };
    return conversion.live
      ? { kind: 'ready' as const, slug }
      : { kind: 'soon' as const, slug };
  }, [rows]);

  /* Where these could simply be opened. Plenty of people arrive with a PDF
     because they want to read it, and the only thing on offer until now was
     turning it into something else. */
  const viewPlan = useMemo(() => {
    if (!rows.length) return null;
    const slugs = new Set(rows.map((r) => viewerFor(r.ext) ?? ''));
    if (slugs.size !== 1) return null;
    const slug = [...slugs][0];
    if (!slug) return null;
    return toolBySlug(slug)?.live ? slug : null;
  }, [rows]);

  /* Carry the files across. Without this, pressing convert lands you on the
     tool with an empty drop zone and the same file to choose again. */
  const goTo = useCallback(
    (slug: string) => {
      stash(rows.map((r) => r.file), slug);
      router.push(`/${slug}`);
    },
    [rows, router],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
      }}
      className={`overflow-hidden rounded-2xl border transition-all ${
        dragging
          ? 'border-accent bg-accent-soft shadow-lg shadow-black/5'
          : 'border-line bg-surface shadow-sm'
      }`}
    >
      {rows.length === 0 ? (
        /*
          The pattern sits behind the empty state only. Once files are queued
          this becomes a list, and a texture behind rows of filenames is noise.

          There is no scrim over the whole zone. Veiling the artwork to make one
          line of text readable wastes the artwork. Instead the icon and the
          label share a single solid panel, so the pattern stays at full
          strength everywhere around it and the label sits on its own ground.
        */
        <div className="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-2xl px-6 py-16 text-center sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: "image-set(url('/puzzle-bg.webp') type('image/webp'), url('/puzzle-bg.jpg') type('image/jpeg'))" }}
          />

          {/* The panel is the control, not just a label beside one. It is the
              biggest thing in the zone, so it is what people aim at, and a
              large target that does nothing reads as broken. The button below
              stays for anyone who needs an obvious one. */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Choose files"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-9 py-7 shadow-sm transition-transform hover:scale-[1.02] active:scale-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-12 text-accent"
              aria-hidden="true"
            >
              <path d="M12 16V4m0 0L8 8m4-4 4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <p className="text-xl font-medium tracking-tight">Drop your files</p>
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-transform hover:scale-[1.02] active:scale-100"
          >
            Choose files
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-accent"
            >
              + Add more files
            </button>
            <button
              onClick={() => setRows([])}
              className="text-sm text-ink-faint underline underline-offset-4 hover:text-ink"
            >
              Clear
            </button>
          </div>

          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const options = targetsFor(row.ext);
              const known = FORMAT_BY_ID.get(row.ext);
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  {/* A name is not enough to tell one screenshot from forty
                      others named after the day they were taken. */}
                  <FilePreview file={row.file} size="row" className="shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.file.name}</p>
                    <p className="text-xs text-ink-faint tabular-nums">
                      {formatBytes(row.file.size)}
                      {known ? ` · ${known.label}` : ''}
                    </p>
                  </div>

                  {options.length > 0 ? (
                    <label className="flex items-center gap-2 text-xs text-ink-faint">
                      Output
                      <select
                        value={row.target ?? ''}
                        onChange={(e) => setTarget(row.id, e.target.value)}
                        className="rounded-lg border border-line bg-ground px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-accent"
                      >
                        {options.map((c) => (
                          <option key={c.slug} value={c.to.id}>
                            {c.to.label}
                            {c.live ? ' ✓' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="text-xs text-ink-faint">Not supported yet</span>
                  )}

                  <button
                    onClick={() => remove(row.id)}
                    aria-label={`Remove ${row.file.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-alt px-5 py-4">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              Convert all ({rows.length}) to
              <select
                defaultValue=""
                disabled={sharedTargets.length === 0}
                onChange={(e) => e.target.value && applyToAll(e.target.value)}
                className="rounded-lg border border-line bg-ground px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="" disabled>
                  {sharedTargets.length ? 'Choose' : 'No shared format'}
                </option>
                {sharedTargets.map((id) => (
                  <option key={id} value={id}>
                    {FORMAT_BY_ID.get(id)?.label ?? id}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {viewPlan && (
                <button
                  onClick={() => goTo(viewPlan)}
                  className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
                >
                  View
                </button>
              )}
              <button
                onClick={() => plan?.kind === 'ready' && goTo(plan.slug)}
                disabled={plan?.kind !== 'ready'}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-transform enabled:hover:scale-[1.02] disabled:opacity-50"
              >
                Convert
              </button>
            </div>
          </div>

          {plan && plan.kind !== 'ready' && (
            <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-ink-faint">
              {plan.kind === 'mixed' &&
                'Your files are heading to different formats. Set them all to the same one, or convert them in separate batches.'}
              {plan.kind === 'soon' &&
                'That conversion is not built yet. The ones marked with a tick are ready to use today.'}
              {plan.kind === 'unknown' && 'That combination is not on the list.'}
            </p>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) add(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

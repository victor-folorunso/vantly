'use client';

import { useCallback, useEffect, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import PdfDrop from '@/components/PdfDrop';
import { rasterisePdf } from '@/lib/pdfRaster';

/**
 * Flatten a PDF, two ways.
 *
 * Forms     pdf-lib draws each field's current answer into the page and
 *           removes the field. Text stays text, the file stays small, and
 *           comments and highlights are left as they were.
 * Pictures  every page becomes an image of itself, so form answers,
 *           comments, highlights and stamps are all burned in. Nothing can be
 *           edited or selected afterwards, which is sometimes the point.
 *
 * Forms is the default because it is the one people usually mean, and it does
 * not cost the document its text.
 */

type Method = 'forms' | 'pictures';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfFlatten() {
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<Method>('forms');
  const [dpi, setDpi] = useState(150);
  const [fields, setFields] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);

  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);

  const open = useCallback(async (f: File) => {
    setError(null);
    setNotice(null);
    setOut(null);
    setBusy('Reading');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await f.arrayBuffer());
      const count = doc.getForm().getFields().length;
      setFields(count);
      // Nothing to flatten the cheap way, so start on the way that works.
      setMethod(count ? 'forms' : 'pictures');
      setFile(f);
    } catch (e) {
      setError(
        e instanceof Error && /encrypt|password/i.test(e.message)
          ? 'That PDF has a password. Remove it first with Unlock PDF.'
          : 'That file could not be read as a PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, []);

  const run = useCallback(async () => {
    if (!file) return;
    setError(null);
    setNotice(null);
    setBusy('Working');
    try {
      let blob: Blob;
      if (method === 'forms') {
        const { PDFDocument } = await import('pdf-lib');
        const doc = await PDFDocument.load(await file.arrayBuffer());
        const form = doc.getForm();
        // A field without an appearance would flatten to nothing, so the
        // appearances are rebuilt from the current answers first.
        form.updateFieldAppearances();
        form.flatten();
        const bytes = await doc.save();
        blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      } else {
        blob = await rasterisePdf(await file.arrayBuffer(), {
          dpi,
          onPage: (n, total) => setBusy(`Page ${n} of ${total}`),
        });
      }
      setOut((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), size: blob.size };
      });
    } catch {
      setError(
        method === 'forms'
          ? 'The form could not be flattened that way. Try As pictures, which works on any PDF.'
          : 'Something went wrong drawing the pages.',
      );
    } finally {
      setBusy(null);
    }
  }, [file, method, dpi]);

  if (!file) {
    return (
      <PdfDrop
        onFile={(f) => void open(f)}
        hint="Fixes the form answers and comments into the page so they stop being editable."
        busy={busy}
        error={error}
      />
    );
  }

  return (
    <ToolLayout
      settings={
        <>
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">How</legend>
            {(
              [
                ['forms', 'Form fields only', 'Answers become part of the page. Text stays selectable and the file stays small.'],
                ['pictures', 'Everything, as pictures', 'Answers, comments and highlights are burned in. Text can no longer be selected.'],
              ] as const
            ).map(([id, label, note]) => (
              <label
                key={id}
                className={`mt-2 block cursor-pointer rounded-lg border p-3 text-sm ${
                  method === id ? 'border-accent bg-accent-soft' : 'border-line'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="flatten-method"
                    checked={method === id}
                    onChange={() => { setMethod(id); setOut(null); }}
                  />
                  {label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{note}</span>
              </label>
            ))}
          </fieldset>

          {method === 'forms' && fields === 0 && (
            <p className="text-xs leading-relaxed text-accent">
              This PDF has no form fields, so there is nothing to flatten this way. Use As pictures to burn in comments
              and highlights.
            </p>
          )}

          {method === 'pictures' && (
            <label className="block text-sm">
              <span className="flex justify-between">
                Sharpness
                <span className="tabular-nums text-ink-faint">{dpi} dpi</span>
              </span>
              <input
                type="range" min={96} max={300} step={12} value={dpi}
                onChange={(e) => { setDpi(Number(e.target.value)); setOut(null); }}
                className="mt-1.5 w-full"
              />
              <span className="mt-1 block text-xs text-ink-faint">150 reads well on screen. 300 is for printing.</span>
            </label>
          )}

          <button
            onClick={() => void run()}
            disabled={busy !== null || (method === 'forms' && fields === 0)}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ?? 'Flatten'}
          </button>
        </>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {formatBytes(file.size)}
            {fields !== null && `, ${fields} form field${fields === 1 ? '' : 's'}`}
          </p>
        </div>
      }
      actions={
        <>
          {out && (
            <DownloadButton href={out.url} filename={file.name.replace(/\.pdf$/i, '') + '-flattened.pdf'} variant="quiet">
              Download PDF, {formatBytes(out.size)}
            </DownloadButton>
          )}
          <button
            onClick={() => { setFile(null); setOut(null); setFields(null); }}
            className="text-sm text-ink-faint underline underline-offset-4"
          >
            Use another PDF
          </button>
        </>
      }
    >
      {notice && <p className="mt-4 text-sm text-ink-soft">{notice}</p>}
      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
      {!out && !error && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Choose how on the left, then flatten. The original file is not changed.
        </p>
      )}
      {out && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Done. Open the download to check it before you send it on.
        </p>
      )}
    </ToolLayout>
  );
}

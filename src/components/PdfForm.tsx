'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';

/**
 * Fills in a PDF form without a PDF reader.
 *
 * The fields are real form fields, read out of the file with pdf-lib, so this
 * types into the boxes the author made rather than stamping text on top and
 * hoping it lands in the right place.
 *
 * Flattening is offered and defaults to on. A filled form that is still a form
 * can be edited by whoever receives it, and every so often that matters a
 * great deal, so the choice is in front of the person rather than assumed.
 */

type Field =
  | { kind: 'text'; name: string; value: string }
  | { kind: 'check'; name: string; value: boolean }
  | { kind: 'choice'; name: string; value: string; options: string[] };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [flatten, setFlatten] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const load = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setNotice(null);
    setOutUrl(null);
    setBusy(true);
    try {
      const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } =
        await import('pdf-lib');
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const form = doc.getForm();
      const found: Field[] = [];

      for (const field of form.getFields()) {
        const name = field.getName();
        if (field instanceof PDFTextField) {
          found.push({ kind: 'text', name, value: field.getText() ?? '' });
        } else if (field instanceof PDFCheckBox) {
          found.push({ kind: 'check', name, value: field.isChecked() });
        } else if (field instanceof PDFDropdown) {
          found.push({
            kind: 'choice',
            name,
            value: field.getSelected()[0] ?? '',
            options: field.getOptions(),
          });
        } else if (field instanceof PDFRadioGroup) {
          found.push({
            kind: 'choice',
            name,
            value: field.getSelected() ?? '',
            options: field.getOptions(),
          });
        }
      }

      setFields(found);
      if (found.length === 0) {
        setNotice(
          'That PDF has no form fields in it. Plenty of forms are just a picture of a form, and those need text stamped on instead.',
        );
      }
    } catch {
      setError('That file could not be read as a PDF.');
    } finally {
      setBusy(false);
    }
  }, []);

  const save = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } =
        await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const form = doc.getForm();

      for (const f of fields) {
        const field = form.getFieldMaybe(f.name);
        if (!field) continue;
        if (f.kind === 'text' && field instanceof PDFTextField) field.setText(f.value);
        if (f.kind === 'check' && field instanceof PDFCheckBox) {
          f.value ? field.check() : field.uncheck();
        }
        if (f.kind === 'choice' && f.value) {
          if (field instanceof PDFDropdown) field.select(f.value);
          if (field instanceof PDFRadioGroup) field.select(f.value);
        }
      }

      if (flatten) form.flatten();

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setOutSize(blob.size);
      setOutUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setError('The form could not be saved.');
    } finally {
      setBusy(false);
    }
  }, [file, fields, flatten]);

  const set = (name: string, value: string | boolean) =>
    setFields((prev) => prev.map((f) => (f.name === name ? ({ ...f, value } as Field) : f)));

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void load(f); }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">Drop a form here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          The boxes it contains appear as fields you can type into.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a PDF
        </button>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <ToolLayout
      settings={
        fields.length > 0 ? (
          <>
            <button
              onClick={() => void save()}
              disabled={busy}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save the filled form'}
            </button>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              Lock the answers in
            </label>
          </>
        ) : (
          <p className="text-sm text-ink-soft">Nothing to fill in yet.</p>
        )
      }
      status={
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs tabular-nums text-ink-faint">
              {busy ? 'Working…' : `${fields.length} field${fields.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </>
      }
      actions={
        <>
          {outUrl && (
            <DownloadButton href={outUrl} filename={file.name.replace(/\.pdf$/i, '') + '-filled.pdf'} variant="quiet">
              Download, {formatBytes(outSize)}
            </DownloadButton>
          )}
          <button
            onClick={() => { setFile(null); setFields([]); setOutUrl(null); setNotice(null); }}
            className="text-sm text-ink-faint underline underline-offset-4"
          >
            Use another PDF
          </button>
        </>
      }
    >
      {notice && (
        <p className="mt-5 max-w-2xl rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft">
          {notice}
        </p>
      )}

      {fields.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.name} className="block text-sm">
              <span className="block truncate text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {f.name}
              </span>
              {f.kind === 'text' && (
                <input
                  value={f.value}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                />
              )}
              {f.kind === 'check' && (
                <span className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={f.value}
                    onChange={(e) => set(f.name, e.target.checked)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <span className="text-ink-soft">{f.value ? 'Ticked' : 'Not ticked'}</span>
                </span>
              )}
              {f.kind === 'choice' && (
                <select
                  value={f.value}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                >
                  <option value="">Not chosen</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}
    </ToolLayout>
  );
}

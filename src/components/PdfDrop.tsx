'use client';

import { useRef, useState } from 'react';
import { useHandoff } from '@/components/useHandoff';
import DropIcon from '@/components/DropIcon';

/**
 * The empty state for the single-PDF tools: a drop zone and a button.
 *
 * The older PDF tools each carry their own copy of this. The newer ones share
 * it, so the wording, the accepted types and the home page handoff stay the
 * same everywhere.
 */
export default function PdfDrop({
  onFile,
  hint,
  busy,
  error,
}: {
  onFile: (file: File) => void;
  hint: string;
  busy?: string | null;
  error?: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (files: FileList | File[] | null | undefined) => {
    const f = Array.from(files ?? []).find((x) => x.type === 'application/pdf' || /\.pdf$/i.test(x.name));
    if (f) onFile(f);
  };

  // Files chosen on the home page, if that is how you arrived.
  useHandoff((files) => take(files));

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files); }}
      className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
      }`}
    >
      <DropIcon />
      <p className="text-lg font-medium">Drop a PDF here</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">{hint}</p>
      <button
        onClick={() => inputRef.current?.click()}
        className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
      >
        Choose a PDF
      </button>
      {busy && <p className="mt-4 text-sm text-ink-faint">{busy}…</p>}
      {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

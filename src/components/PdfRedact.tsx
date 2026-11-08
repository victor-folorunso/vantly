'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import PdfDrop from '@/components/PdfDrop';
import { loadPdfJs, rasterisePdf } from '@/lib/pdfRaster';

/**
 * Redact a PDF so the hidden part is actually gone.
 *
 * Drag boxes over what has to go, then every page is rebuilt as a picture of
 * itself with the boxes painted solid black. That is deliberately blunt. The
 * common failure, in court filings and leaked reports, is a black rectangle
 * drawn over text that is still in the file underneath: select, copy, paste,
 * and there it is. Here there is no text underneath, on any page, because
 * there is no text at all.
 *
 * The cost is that the whole document stops being searchable or selectable,
 * which the page says before you start.
 *
 * Boxes are stored as fractions of the page as displayed, so they land in the
 * same place whatever resolution the page is finally drawn at.
 */

type Box = { x: number; y: number; w: number; h: number };
type Thumb = { url: string; width: number; height: number };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function PageCanvas({
  thumb,
  label,
  boxes,
  onAdd,
  onRemove,
}: {
  thumb: Thumb;
  label: string;
  boxes: Box[];
  onAdd: (b: Box) => void;
  onRemove: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const at = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  return (
    <figure>
      <div
        ref={ref}
        className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-md shadow-sm"
        style={{ aspectRatio: `${thumb.width} / ${thumb.height}` }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).dataset.box) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          start.current = at(e);
          setDraft({ ...start.current, w: 0, h: 0 });
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const p = at(e);
          const s = start.current;
          setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
        }}
        onPointerUp={() => {
          // A click, or a box too thin to cover a line of text, is not kept.
          if (draft && draft.w > 0.01 && draft.h > 0.006) onAdd(draft);
          start.current = null;
          setDraft(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb.url} alt="" draggable={false} className="block size-full" />
        {boxes.map((b, i) => (
          <button
            key={i}
            data-box="1"
            onClick={() => onRemove(i)}
            title="Remove this box"
            aria-label={`Remove box ${i + 1} on ${label}`}
            className="group absolute bg-black"
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
          >
            <span data-box="1" className="absolute right-0.5 top-0.5 hidden rounded bg-white/90 px-1 text-[10px] leading-4 text-black group-hover:block">
              ×
            </span>
          </button>
        ))}
        {draft && (
          <div
            className="pointer-events-none absolute border border-accent bg-black/70"
            style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
          />
        )}
      </div>
      <figcaption className="mt-1.5 text-center text-xs text-ink-faint tabular-nums">
        {label}
        {boxes.length ? `, ${boxes.length} box${boxes.length === 1 ? '' : 'es'}` : ''}
      </figcaption>
    </figure>
  );
}

export default function PdfRedact() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [boxes, setBoxes] = useState<Box[][]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);

  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);

  const open = useCallback(async (f: File) => {
    setError(null);
    setBusy('Reading');
    try {
      const data = await f.arrayBuffer();
      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument({ data: data.slice(0) });
      const doc = await task.promise;
      const next: Thumb[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        setBusy(`Drawing page ${i} of ${doc.numPages}`);
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        // Large enough to place a box over a single word.
        const viewport = page.getViewport({ scale: 1100 / Math.max(base.width, base.height) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
        next.push({ url: canvas.toDataURL('image/jpeg', 0.85), width: canvas.width, height: canvas.height });
      }
      await task.destroy();
      setBytes(data);
      setThumbs(next);
      setBoxes(next.map(() => []));
      setOut(null);
      setFile(f);
    } catch (e) {
      setError(
        e instanceof Error && /password/i.test(e.message)
          ? 'That PDF has a password. Remove it first with Unlock PDF.'
          : 'That file could not be read as a PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, []);

  const total = boxes.reduce((n, b) => n + b.length, 0);

  const run = useCallback(async () => {
    if (!bytes || !file) return;
    setError(null);
    try {
      const blob = await rasterisePdf(bytes, {
        dpi: 150,
        onPage: (n, t) => setBusy(`Page ${n} of ${t}`),
        paint: (ctx, i, w, h) => {
          ctx.fillStyle = '#000000';
          for (const b of boxes[i] ?? []) {
            // Rounded outwards, so a box never stops a pixel short of what it
            // was drawn over.
            const x = Math.floor(b.x * w);
            const y = Math.floor(b.y * h);
            ctx.fillRect(x, y, Math.ceil((b.x + b.w) * w) - x, Math.ceil((b.y + b.h) * h) - y);
          }
        },
      });
      setOut((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), size: blob.size };
      });
    } catch {
      setError('Something went wrong drawing the pages.');
    } finally {
      setBusy(null);
    }
  }, [bytes, file, boxes]);

  if (!file) {
    return (
      <PdfDrop
        onFile={(f) => void open(f)}
        hint="Drag boxes over what has to go. The saved copy has nothing underneath them."
        busy={busy}
        error={error}
      />
    );
  }

  return (
    <ToolLayout
      title="Redact"
      settings={
        <>
          <p className="text-sm leading-relaxed text-ink-soft">
            Drag across anything that has to go. Click a box to take it off again.
          </p>
          <button
            onClick={() => void run()}
            disabled={!total || busy !== null}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ?? `Redact, ${total} box${total === 1 ? '' : 'es'}`}
          </button>
          {total > 0 && (
            <button
              onClick={() => { setBoxes(thumbs.map(() => [])); setOut(null); }}
              className="self-start text-sm text-ink-faint underline underline-offset-4"
            >
              Remove every box
            </button>
          )}
          <p className="text-xs leading-relaxed text-ink-faint">
            Every page is saved as a picture, so nothing hidden survives anywhere in the file. The trade is that the text
            of the whole document can no longer be selected or searched.
          </p>
        </>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {thumbs.length} page{thumbs.length === 1 ? '' : 's'}, {formatBytes(file.size)}
          </p>
        </div>
      }
      actions={
        <>
          {out && (
            <DownloadButton href={out.url} filename={file.name.replace(/\.pdf$/i, '') + '-redacted.pdf'} variant="quiet">
              Download PDF, {formatBytes(out.size)}
            </DownloadButton>
          )}
          <button
            onClick={() => { setFile(null); setThumbs([]); setBoxes([]); setOut(null); }}
            className="text-sm text-ink-faint underline underline-offset-4"
          >
            Use another PDF
          </button>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {thumbs.map((t, i) => (
          <PageCanvas
            key={i}
            thumb={t}
            label={`Page ${i + 1}`}
            boxes={boxes[i] ?? []}
            onAdd={(b) => { setOut(null); setBoxes((all) => all.map((list, j) => (j === i ? [...list, b] : list))); }}
            onRemove={(k) => { setOut(null); setBoxes((all) => all.map((list, j) => (j === i ? list.filter((_, n) => n !== k) : list))); }}
          />
        ))}
      </div>
      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
    </ToolLayout>
  );
}

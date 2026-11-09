'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import PdfDrop from '@/components/PdfDrop';
import { loadPdfJs } from '@/lib/pdfRaster';

/**
 * Marking up a PDF and editing one: the same surface with different tools.
 *
 * annotate  highlight, draw, outline and leave notes
 * edit      change existing text, add text, white out, add pictures, and
 *           turn, move and delete pages
 *
 * Every mark is kept in the coordinates of the page as it is displayed, top
 * left at the origin, in PDF points. Only when saving is it mapped onto the
 * page as stored, through the page's rotation and crop box, which is the step
 * that otherwise puts a note sideways on a scanned page stored on its side.
 *
 * The marks are written into the page content, so every reader shows them
 * and prints them. The rest of the document is untouched: text stays text and
 * nothing is re-encoded.
 *
 * Changing existing text cannot be done by editing the PDF's own text in
 * place: a PDF stores positioned glyphs in a font that is usually a subset
 * holding only the letters already used. So a changed line is covered with
 * the colour behind it, sampled from the page, and written again on top in
 * the nearest standard font. The page says so.
 */

export type MarkupMode = 'annotate' | 'edit';

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Family = 'sans' | 'serif' | 'mono';
/** A run of text already on the page, in view coordinates. */
type Run = Rect & { str: string; size: number; base: number; family: Family; bg: string; ink: string };
type PageInfo = { url: string; vw: number; vh: number; runs: Run[] };

type Item = { id: number; page: number } & (
  | { kind: 'highlight'; rects: Rect[]; color: string }
  | ({ kind: 'box'; color: string; width: number } & Rect)
  | { kind: 'ink'; points: Pt[]; color: string; width: number }
  | ({ kind: 'text'; text: string; size: number; color: string; note: boolean } & Rect)
  | ({ kind: 'cover'; fill: string } & Rect)
  | ({ kind: 'replace'; text: string; size: number; base: number; family: Family; fill: string; color: string; original: string } & Rect)
  | ({ kind: 'image'; src: string; ratio: number } & Rect)
);

type Tool = 'select' | 'highlight' | 'pen' | 'box' | 'note' | 'edit' | 'text' | 'cover' | 'image';

const TOOLS: Record<MarkupMode, { id: Tool; label: string; hint: string }[]> = {
  annotate: [
    { id: 'highlight', label: 'Highlight', hint: 'Drag across text. It snaps to the lines it covers.' },
    { id: 'pen', label: 'Draw', hint: 'Draw freehand with a mouse, finger or pen.' },
    { id: 'box', label: 'Box', hint: 'Drag to draw a rectangle around something.' },
    { id: 'note', label: 'Note', hint: 'Click where the note should go, then type it on the left.' },
    { id: 'select', label: 'Move', hint: 'Drag a mark to move it, or click it to change or delete it.' },
  ],
  edit: [
    { id: 'edit', label: 'Edit text', hint: 'Click a line of text on the page to change it.' },
    { id: 'text', label: 'Add text', hint: 'Click where the text should go, then type it on the left.' },
    { id: 'cover', label: 'White out', hint: 'Drag over something to cover it with the colour behind it.' },
    { id: 'image', label: 'Picture', hint: 'Click where the picture should go and choose one.' },
    { id: 'select', label: 'Move', hint: 'Drag anything you added to move it, or click it to change it.' },
  ],
};

const HIGHLIGHTS = ['#ffe14d', '#8ee59a', '#ff9fd0', '#8fd0ff'];
const INKS = ['#e11d48', '#1d4ed8', '#111111', '#15803d'];
const FONT_CSS: Record<Family, string> = {
  sans: 'Helvetica, Arial, sans-serif',
  serif: '"Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace',
};
const NOTE_PAD = 4;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
const parseHex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

/* Arial has Helvetica's metrics, so text wrapped by measuring Arial in the
   browser wraps at the same words as Helvetica in the saved PDF. */
let measureCtx: CanvasRenderingContext2D | null = null;
function wrap(text: string, size: number, width: number): string[] {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  const ctx = measureCtx!;
  ctx.font = `${size}px Helvetica, Arial, sans-serif`;
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/(\s+)/)) {
      const next = line + word;
      if (line && ctx.measureText(next.trimEnd()).width > width) {
        out.push(line.trimEnd());
        line = word.trimStart();
      } else line = next;
    }
    out.push(line.trimEnd());
  }
  return out;
}
const lineHeight = (size: number) => size * 1.25;
function textHeight(it: { text: string; size: number; w: number; note: boolean }) {
  const pad = it.note ? NOTE_PAD : 0;
  return wrap(it.text, it.size, it.w - pad * 2).length * lineHeight(it.size) + pad * 2;
}

/**
 * View coordinates (top left origin, as displayed) to the page as stored,
 * for a page shown with /Rotate r. w and h are the unrotated crop box.
 */
function fromView(vx: number, vy: number, r: number, w: number, h: number): Pt {
  if (r === 90) return { x: w - vy, y: vx };
  if (r === 180) return { x: w - vx, y: h - vy };
  if (r === 270) return { x: vy, y: h - vx };
  return { x: vx, y: vy };
}

/* ── Reading the pages ─────────────────────────────────────────────────── */

/** The colour of a few pixels, middle of each channel, to shrug off noise. */
function median(samples: number[][]): number[] {
  return [0, 1, 2].map((c) => samples.map((s) => s[c]).sort((a, b) => a - b)[Math.floor(samples.length / 2)]);
}

async function readPages(
  bytes: ArrayBuffer,
  withRuns: boolean,
  onPage: (i: number, n: number) => void,
  task: { current: { destroy: () => Promise<void> } | null },
): Promise<PageInfo[]> {
  const pdfjs = await loadPdfJs();
  const loading = pdfjs.getDocument({ data: bytes.slice(0) });
  task.current = loading;
  const doc = await loading.promise;
  const pages: PageInfo[] = [];
  const S = 1.6;
  for (let i = 1; i <= doc.numPages; i++) {
    onPage(i, doc.numPages);
    const page = await doc.getPage(i);
    const v1 = page.getViewport({ scale: 1 });
    const v = page.getViewport({ scale: S });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.width);
    canvas.height = Math.round(v.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport: v }).promise;

    const runs: Run[] = [];
    if (withRuns) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const px = (x: number, y: number) => {
        const cx = Math.max(0, Math.min(canvas.width - 1, Math.round(x * S)));
        const cy = Math.max(0, Math.min(canvas.height - 1, Math.round(y * S)));
        const o = (cy * canvas.width + cx) * 4;
        return [img[o], img[o + 1], img[o + 2]];
      };
      const content = await page.getTextContent();
      for (const raw of content.items) {
        if (!('str' in raw) || !raw.str.trim()) continue;
        const t = pdfjs.Util.transform(v1.transform, raw.transform);
        // Only text that reads left to right as displayed. Rotated or
        // vertical runs are left alone rather than replaced crooked.
        if (Math.abs(t[1]) > 1e-3 || Math.abs(t[2]) > 1e-3 || t[0] <= 0) continue;
        const size = Math.abs(t[3]);
        if (size < 2 || raw.width <= 0) continue;
        const style = content.styles[raw.fontName];
        const family: Family = /mono/i.test(style?.fontFamily ?? '') ? 'mono' : /serif/i.test(style?.fontFamily ?? '') && !/sans/i.test(style?.fontFamily ?? '') ? 'serif' : 'sans';
        const ascent = style?.ascent && style.ascent > 0.5 && style.ascent < 1.2 ? style.ascent : 0.85;
        const descent = style?.descent && style.descent < 0 && style.descent > -0.5 ? style.descent : -0.22;
        const run: Run = { x: t[4], y: t[5] - size * ascent, w: raw.width, h: size * (ascent - descent), str: raw.str, size, base: t[5], family, bg: '#ffffff', ink: '#000000' };
        const m = 1.5;
        const bg = median([px(run.x - m, run.y - m), px(run.x + run.w + m, run.y - m), px(run.x - m, run.y + run.h + m), px(run.x + run.w + m, run.y + run.h + m), px(run.x + run.w / 2, run.y - m)]);
        run.bg = hex(bg[0], bg[1], bg[2]);
        // The ink is the pixel inside the box least like the background.
        let best = bg;
        let far = -1;
        for (let gx = 0; gx < 12; gx++)
          for (let gy = 1; gy < 5; gy++) {
            const p = px(run.x + ((gx + 0.5) / 12) * run.w, run.y + (gy / 5) * run.h);
            const d = Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]);
            if (d > far) { far = d; best = p; }
          }
        run.ink = hex(best[0], best[1], best[2]);
        runs.push(run);
      }
    }
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    pages.push({ url: blob ? URL.createObjectURL(blob) : '', vw: v1.width, vh: v1.height, runs });
    canvas.width = canvas.height = 0;
    page.cleanup();
  }
  return pages;
}

/* ── One page ─────────────────────────────────────────────────────────── */

function itemBox(it: Item): Rect | null {
  if (it.kind === 'ink' || it.kind === 'highlight') return null;
  if (it.kind === 'text') return { x: it.x, y: it.y, w: it.w, h: textHeight(it) };
  return { x: it.x, y: it.y, w: it.w, h: it.h };
}

function PageView({
  info,
  index,
  turn,
  items,
  tool,
  selected,
  draftColor,
  penWidth,
  onSelect,
  onCreate,
  onMoveStart,
  onMove,
  onRun,
  onImageAt,
}: {
  info: PageInfo;
  index: number;
  turn: number;
  items: Item[];
  tool: Tool;
  selected: number | null;
  draftColor: string;
  penWidth: number;
  onSelect: (id: number | null) => void;
  onCreate: (draft: { kind: 'rect' | 'ink' | 'click'; rect?: Rect; points?: Pt[] }) => void;
  onMoveStart: () => void;
  onMove: (id: number, dx: number, dy: number, resize: boolean) => void;
  onRun: (run: Run) => void;
  onImageAt: (p: Pt) => void;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [ink, setInk] = useState<Pt[] | null>(null);
  const start = useRef<Pt | null>(null);
  const drag = useRef<{ id: number; last: Pt; resize: boolean } | null>(null);
  const { vw, vh } = info;

  /** Pointer to view coordinates, undoing the preview's turn. */
  const toView = (e: React.PointerEvent): Pt => {
    const r = outer.current!.getBoundingClientRect();
    const cx = e.clientX - (r.left + r.width / 2);
    const cy = e.clientY - (r.top + r.height / 2);
    const a = (-turn * Math.PI) / 180;
    const x = cx * Math.cos(a) - cy * Math.sin(a);
    const y = cx * Math.sin(a) + cy * Math.cos(a);
    const side = turn % 180 !== 0;
    const iw = side ? r.height : r.width;
    const ih = side ? r.width : r.height;
    return { x: Math.max(0, Math.min(vw, ((x + iw / 2) / iw) * vw)), y: Math.max(0, Math.min(vh, ((y + ih / 2) / ih) * vh)) };
  };

  const down = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement | SVGElement;
    const id = target.closest('[data-id]')?.getAttribute('data-id');
    const handle = target.closest('[data-handle]')?.getAttribute('data-handle');
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    const p = toView(e);
    if (tool === 'select') {
      const hit = handle ?? id;
      if (hit) {
        onSelect(Number(hit));
        onMoveStart();
        drag.current = { id: Number(hit), last: p, resize: !!handle };
      } else onSelect(null);
      return;
    }
    if (tool === 'edit') {
      if (id) { onSelect(Number(id)); return; }
      const run = target.closest('[data-run]')?.getAttribute('data-run');
      if (run !== undefined && run !== null) onRun(info.runs[Number(run)]);
      else onSelect(null);
      return;
    }
    if (tool === 'note' || tool === 'text') { onCreate({ kind: 'click', rect: { ...p, w: 0, h: 0 } }); return; }
    if (tool === 'image') { onImageAt(p); return; }
    start.current = p;
    if (tool === 'pen') setInk([p]);
    else setDraft({ ...p, w: 0, h: 0 });
  };

  const move = (e: React.PointerEvent) => {
    const p = toView(e);
    if (drag.current) {
      onMove(drag.current.id, p.x - drag.current.last.x, p.y - drag.current.last.y, drag.current.resize);
      drag.current.last = p;
      return;
    }
    if (!start.current) return;
    // Functional, because pointer moves can arrive faster than renders and
    // each would otherwise extend the same stale stroke, dropping points.
    if (ink) { setInk((s) => (s ? [...s, p] : s)); return; }
    const s = start.current;
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };

  const up = () => {
    drag.current = null;
    if (ink && ink.length) onCreate({ kind: 'ink', points: ink });
    else if (draft && draft.w > 3 && draft.h > 3) onCreate({ kind: 'rect', rect: draft });
    else if (draft && tool === 'highlight' && draft.w > 3) onCreate({ kind: 'rect', rect: { ...draft, h: Math.max(draft.h, 1) } });
    start.current = null;
    setInk(null);
    setDraft(null);
  };

  const side = turn % 180 !== 0;
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;
  const live = tool !== 'select' && tool !== 'edit';

  return (
    <div
      ref={outer}
      className="relative mx-auto w-full overflow-hidden rounded-md bg-white shadow-sm"
      style={{ aspectRatio: side ? `${vh} / ${vw}` : `${vw} / ${vh}` }}
    >
      <div
        className={`absolute left-1/2 top-1/2 touch-none select-none ${live || tool === 'edit' ? 'cursor-crosshair' : ''}`}
        style={{
          width: side ? `${(vw / vh) * 100}%` : '100%',
          aspectRatio: `${vw} / ${vh}`,
          transform: `translate(-50%, -50%) rotate(${turn}deg)`,
          containerType: 'inline-size',
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={info.url} alt={`Page ${index + 1}`} draggable={false} className="pointer-events-none block size-full" />

        <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none" className="absolute inset-0 size-full" style={{ pointerEvents: 'none' }}>
          {items.map((it) => {
            const on = tool === 'select' ? 'auto' : 'none';
            const sel = it.id === selected;
            if (it.kind === 'highlight')
              return (
                <g key={it.id} data-id={it.id} style={{ pointerEvents: on, mixBlendMode: 'multiply' }}>
                  {it.rects.map((r, i) => (
                    <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={it.color} opacity={0.55} stroke={sel ? '#f97316' : 'none'} strokeWidth={1} />
                  ))}
                </g>
              );
            if (it.kind === 'box')
              return <rect key={it.id} data-id={it.id} x={it.x} y={it.y} width={it.w} height={it.h} fill="transparent" stroke={it.color} strokeWidth={it.width} style={{ pointerEvents: on, outline: sel ? '2px dashed #f97316' : 'none' }} />;
            if (it.kind === 'ink')
              return (
                <polyline
                  key={it.id}
                  data-id={it.id}
                  points={it.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={it.color}
                  strokeWidth={sel ? it.width + 1.5 : it.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: on === 'auto' ? 'stroke' : 'none', opacity: sel ? 0.7 : 1 }}
                />
              );
            if (it.kind === 'cover' || it.kind === 'replace')
              return <rect key={it.id} data-id={it.id} x={it.x - 0.5} y={it.y - 0.5} width={it.w + 1} height={it.h + 1} fill={it.fill} style={{ pointerEvents: tool === 'select' || tool === 'edit' ? 'auto' : 'none' }} stroke={sel ? '#f97316' : 'none'} strokeWidth={0.8} />;
            if (it.kind === 'image')
              return <image key={it.id} data-id={it.id} href={it.src} x={it.x} y={it.y} width={it.w} height={it.h} preserveAspectRatio="none" style={{ pointerEvents: on, outline: sel ? '2px dashed #f97316' : 'none' }} />;
            return null;
          })}
          {draft && tool === 'highlight' && <rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill={draftColor} opacity={0.45} />}
          {draft && tool === 'box' && <rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="none" stroke={draftColor} strokeWidth={penWidth} />}
          {draft && tool === 'cover' && <rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="#ffffff" stroke="#f97316" strokeWidth={0.8} strokeDasharray="3 2" />}
          {ink && <polyline points={ink.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={draftColor} strokeWidth={penWidth} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>

        {/* Text sits in HTML so it wraps and edits like text; sizes are in
            container units, so it scales with the page. */}
        {items.map((it) => {
          if (it.kind !== 'text' && it.kind !== 'replace') return null;
          const sel = it.id === selected;
          const lines = it.kind === 'text' ? wrap(it.text, it.size, it.w - (it.note ? NOTE_PAD * 2 : 0)) : [it.text];
          const pad = it.kind === 'text' && it.note ? NOTE_PAD : 0;
          return (
            <div
              key={it.id}
              data-id={it.id}
              className="absolute whitespace-pre"
              style={{
                left: pct(it.x, vw),
                top: it.kind === 'replace' ? pct(it.base - it.size * 0.95, vh) : pct(it.y, vh),
                width: it.kind === 'text' ? pct(it.w, vw) : undefined,
                padding: pad ? `${(pad / vw) * 100}cqw` : 0,
                background: it.kind === 'text' && it.note ? '#fff2a8' : undefined,
                border: it.kind === 'text' && it.note ? '1px solid #e0c64a' : undefined,
                color: it.color,
                fontFamily: FONT_CSS[it.kind === 'replace' ? it.family : 'sans'],
                fontSize: `${(it.size / vw) * 100}cqw`,
                lineHeight: it.kind === 'replace' ? 1.2 : 1.25,
                pointerEvents: tool === 'select' || (tool === 'edit' && it.kind === 'replace') ? 'auto' : 'none',
                outline: sel ? '2px dashed #f97316' : undefined,
                outlineOffset: 2,
                cursor: tool === 'select' ? 'move' : undefined,
              }}
            >
              {lines.map((l, i) => (
                <div key={i}>{l || ' '}</div>
              ))}
            </div>
          );
        })}

        {tool === 'select' &&
          items.map((it) => {
            const b = it.id === selected ? itemBox(it) : null;
            if (!b || it.kind === 'replace') return null;
            return (
              <span
                key={`h${it.id}`}
                data-handle={it.id}
                title="Drag to resize"
                className="absolute size-3 translate-x-[-50%] translate-y-[-50%] cursor-nwse-resize rounded-sm border border-white bg-accent"
                style={{ left: pct(b.x + b.w, vw), top: pct(b.y + b.h, vh) }}
              />
            );
          })}

        {tool === 'edit' &&
          info.runs.map((r, i) => (
            <span
              key={i}
              data-run={i}
              title="Click to change this text"
              className="absolute cursor-text rounded-[2px] hover:bg-accent/20 hover:outline hover:outline-1 hover:outline-accent"
              style={{ left: pct(r.x, vw), top: pct(r.y, vh), width: pct(r.w, vw), height: pct(r.h, vh) }}
            />
          ))}
      </div>
    </div>
  );
}

/* ── The tool ─────────────────────────────────────────────────────────── */

type PageSlot = { src: number; turn: number };

export default function PdfMarkup({ mode }: { mode: MarkupMode }) {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [slots, setSlots] = useState<PageSlot[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [past, setPast] = useState<Item[][]>([]);
  const [tool, setTool] = useState<Tool>(TOOLS[mode][0].id);
  const [selected, setSelected] = useState<number | null>(null);
  const [hl, setHl] = useState(HIGHLIGHTS[0]);
  const [inkColor, setInkColor] = useState(INKS[0]);
  const [penWidth, setPenWidth] = useState(2);
  const [textSize, setTextSize] = useState(12);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);
  const nextId = useRef(1);
  const task = useRef<{ destroy: () => Promise<void> } | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const imageAt = useRef<{ page: number; p: Pt } | null>(null);
  const textBox = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);
  useEffect(() => () => { void task.current?.destroy(); }, []);
  useEffect(() => () => pages.forEach((p) => URL.revokeObjectURL(p.url)), [pages]);

  const open = useCallback(async (f: File) => {
    setError(null);
    setBusy('Reading');
    try {
      const data = await f.arrayBuffer();
      void task.current?.destroy();
      const info = await readPages(data, true, (i, n) => setBusy(`Drawing page ${i} of ${n}`), task);
      setBytes(data);
      setPages(info);
      setSlots(info.map((_, i) => ({ src: i, turn: 0 })));
      setItems([]);
      setPast([]);
      setSelected(null);
      setOut(null);
      setFile(f);
    } catch (e) {
      setError(e instanceof Error && /password/i.test(e.message) ? 'That PDF has a password. Remove it first with Unlock PDF.' : 'That file could not be read as a PDF.');
    } finally {
      setBusy(null);
    }
  }, []);

  /** Every change that should be undoable goes through here. */
  const commit = useCallback((next: Item[]) => {
    setPast((p) => [...p.slice(-60), items]);
    setItems(next);
    setOut(null);
  }, [items]);

  const undo = () => {
    if (!past.length) return;
    setItems(past[past.length - 1]);
    setPast(past.slice(0, -1));
    setSelected(null);
    setOut(null);
  };

  const sel = items.find((i) => i.id === selected) ?? null;
  const update = (patch: Partial<Item>, record = false) => {
    if (!sel) return;
    const next = items.map((i) => (i.id === sel.id ? ({ ...i, ...patch } as Item) : i));
    if (record) commit(next);
    else { setItems(next); setOut(null); }
  };
  const remove = useCallback(() => {
    if (selected === null) return;
    commit(items.filter((i) => i.id !== selected));
    setSelected(null);
  }, [commit, items, selected]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected !== null) { e.preventDefault(); remove(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const create = (page: number, d: { kind: 'rect' | 'ink' | 'click'; rect?: Rect; points?: Pt[] }) => {
    const id = nextId.current++;
    const info = pages[page];
    let item: Item | null = null;
    if (d.kind === 'ink' && d.points) {
      item = { id, page, kind: 'ink', points: d.points, color: inkColor, width: penWidth };
    } else if (d.kind === 'rect' && d.rect) {
      const r = d.rect;
      if (tool === 'highlight') {
        // Snap to the text the drag crossed: one bar per line, from where the
        // drag started to where it ended, like selecting text.
        const hit = info.runs.filter((run) => run.x < r.x + r.w && run.x + run.w > r.x && run.y < r.y + r.h && run.y + run.h > r.y);
        const lines = new Map<number, Rect>();
        for (const run of hit) {
          const key = Math.round(run.base);
          const x0 = Math.max(run.x, r.x);
          const x1 = Math.min(run.x + run.w, r.x + r.w);
          const top = run.base - run.size * 0.85;
          const prev = lines.get(key);
          const box = { x: x0, y: top, w: x1 - x0, h: run.size * 1.1 };
          lines.set(key, prev ? { x: Math.min(prev.x, box.x), y: Math.min(prev.y, box.y), w: Math.max(prev.x + prev.w, box.x + box.w) - Math.min(prev.x, box.x), h: Math.max(prev.h, box.h) } : box);
        }
        const rects = lines.size && r.h < 40 ? [...lines.values()] : [r];
        item = { id, page, kind: 'highlight', rects, color: hl };
      } else if (tool === 'box') item = { id, page, kind: 'box', ...r, color: inkColor, width: penWidth };
      else if (tool === 'cover') {
        // The colour behind the area, from the text runs it touches, or white.
        const run = info.runs.find((x) => x.x < r.x + r.w && x.x + x.w > r.x && x.y < r.y + r.h && x.y + x.h > r.y);
        item = { id, page, kind: 'cover', ...r, fill: run?.bg ?? '#ffffff' };
      }
    } else if (d.kind === 'click' && d.rect) {
      const w = Math.min(mode === 'annotate' ? 180 : 220, info.vw - d.rect.x - 8);
      item = {
        id, page, kind: 'text', x: d.rect.x, y: d.rect.y, w: Math.max(60, w),
        h: 0, text: mode === 'annotate' ? 'Note' : 'Text', size: textSize,
        color: mode === 'annotate' ? '#222222' : inkColor === INKS[0] ? '#111111' : inkColor, note: mode === 'annotate',
      };
      setTool('select');
      setTimeout(() => { textBox.current?.focus(); textBox.current?.select(); }, 50);
    }
    if (!item) return;
    commit([...items, item]);
    if (item.kind === 'text') setSelected(id);
  };

  const editRun = (page: number, run: Run) => {
    const existing = items.find((i) => i.kind === 'replace' && i.page === page && Math.abs(i.x - run.x) < 0.5 && Math.abs(i.base - run.base) < 0.5);
    if (existing) { setSelected(existing.id); return; }
    const id = nextId.current++;
    commit([...items, { id, page, kind: 'replace', x: run.x, y: run.y, w: run.w, h: run.h, base: run.base, size: run.size, family: run.family, fill: run.bg, color: run.ink, text: run.str, original: run.str }]);
    setSelected(id);
    setTimeout(() => { textBox.current?.focus(); textBox.current?.select(); }, 50);
  };

  const moveItem = (id: number, dx: number, dy: number, resize: boolean) => {
    setItems((all) =>
      all.map((it) => {
        if (it.id !== id) return it;
        if (resize) {
          if (it.kind === 'image') { const w = Math.max(12, it.w + dx); return { ...it, w, h: w / it.ratio }; }
          if (it.kind === 'text') return { ...it, w: Math.max(40, it.w + dx) };
          if (it.kind === 'box' || it.kind === 'cover') return { ...it, w: Math.max(4, it.w + dx), h: Math.max(4, it.h + dy) };
          return it;
        }
        if (it.kind === 'ink') return { ...it, points: it.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
        if (it.kind === 'highlight') return { ...it, rects: it.rects.map((r) => ({ ...r, x: r.x + dx, y: r.y + dy })) };
        if (it.kind === 'replace') return it;
        return { ...it, x: it.x + dx, y: it.y + dy };
      }),
    );
    setOut(null);
  };

  const addImage = async (f: File) => {
    const at = imageAt.current;
    if (!at) return;
    const url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => null);
    if (!img.naturalWidth) { setError('That picture could not be read. Use a PNG or JPG.'); return; }
    // Anything that is not already PNG or JPG is redrawn as PNG, the two
    // formats a PDF can carry directly.
    let src = url;
    if (!/^data:image\/(png|jpe?g)/.test(url)) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      src = c.toDataURL('image/png');
    }
    const info = pages[at.page];
    const ratio = img.naturalWidth / img.naturalHeight;
    const w = Math.min(info.vw * 0.35, info.vw - at.p.x);
    const id = nextId.current++;
    commit([...items, { id, page: at.page, kind: 'image', x: at.p.x, y: at.p.y, w, h: w / ratio, ratio, src }]);
    setSelected(id);
    setTool('select');
  };

  const pageOp = (i: number, op: 'up' | 'down' | 'turn' | 'delete') => {
    setOut(null);
    setSlots((s) => {
      const next = [...s];
      if (op === 'turn') next[i] = { ...next[i], turn: (next[i].turn + 90) % 360 };
      else if (op === 'delete') next.splice(i, 1);
      else {
        const j = op === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= next.length) return s;
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  const save = useCallback(async () => {
    if (!bytes || !file) return;
    setBusy('Saving');
    setError(null);
    try {
      const { PDFDocument, rgb, degrees, StandardFonts, BlendMode, LineCapStyle } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes.slice(0));
      const fonts = {
        sans: await doc.embedFont(StandardFonts.Helvetica),
        serif: await doc.embedFont(StandardFonts.TimesRoman),
        mono: await doc.embedFont(StandardFonts.Courier),
      };
      const all = doc.getPages();
      const colour = (h: string) => rgb(...parseHex(h));
      const images = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();

      for (const it of items) {
        const page = all[it.page];
        const info = pages[it.page];
        const r = ((page.getRotation().angle % 360) + 360) % 360;
        const cb = page.getCropBox();
        const at = (vx: number, vy: number) => {
          const p = fromView(vx, info.vh - vy, r, cb.width, cb.height);
          return { x: p.x + cb.x, y: p.y + cb.y };
        };
        const rect = (b: Rect) => {
          const a = at(b.x, b.y);
          const c = at(b.x + b.w, b.y + b.h);
          return { x: Math.min(a.x, c.x), y: Math.min(a.y, c.y), width: Math.abs(c.x - a.x), height: Math.abs(c.y - a.y) };
        };
        const rot = degrees(r);

        if (it.kind === 'highlight')
          for (const b of it.rects) page.drawRectangle({ ...rect(b), color: colour(it.color), opacity: 0.45, blendMode: BlendMode.Multiply });
        else if (it.kind === 'box') page.drawRectangle({ ...rect(it), borderColor: colour(it.color), borderWidth: it.width });
        else if (it.kind === 'cover') page.drawRectangle({ ...rect({ x: it.x - 0.5, y: it.y - 0.5, w: it.w + 1, h: it.h + 1 }), color: colour(it.fill) });
        else if (it.kind === 'ink') {
          if (it.points.length === 1) page.drawCircle({ ...at(it.points[0].x, it.points[0].y), size: it.width / 2, color: colour(it.color) });
          for (let i = 1; i < it.points.length; i++)
            page.drawLine({ start: at(it.points[i - 1].x, it.points[i - 1].y), end: at(it.points[i].x, it.points[i].y), thickness: it.width, color: colour(it.color), lineCap: LineCapStyle.Round });
        } else if (it.kind === 'replace') {
          // Unchanged lines are left exactly as they were.
          if (it.text === it.original) continue;
          page.drawRectangle({ ...rect({ x: it.x - 0.5, y: it.y - 0.5, w: it.w + 1, h: it.h + 1 }), color: colour(it.fill) });
          page.drawText(it.text, { ...at(it.x, it.base), size: it.size, font: fonts[it.family], color: colour(it.color), rotate: rot });
        } else if (it.kind === 'text') {
          const pad = it.note ? NOTE_PAD : 0;
          const lines = wrap(it.text, it.size, it.w - pad * 2);
          if (it.note) page.drawRectangle({ ...rect({ x: it.x, y: it.y, w: it.w, h: textHeight(it) }), color: rgb(1, 0.949, 0.659), borderColor: rgb(0.878, 0.776, 0.29), borderWidth: 0.75 });
          lines.forEach((line, i) => {
            if (!line) return;
            // Where the browser puts the baseline of line i: half the
            // leading, then Arial's ascent (0.905em in a 1.117em box).
            const base = it.y + pad + i * lineHeight(it.size) + it.size * 0.97;
            page.drawText(line, { ...at(it.x + pad, base), size: it.size, font: fonts.sans, color: colour(it.color), rotate: rot });
          });
        } else if (it.kind === 'image') {
          let embedded = images.get(it.src);
          if (!embedded) {
            const data = await (await fetch(it.src)).arrayBuffer();
            embedded = it.src.startsWith('data:image/png') ? await doc.embedPng(data) : await doc.embedJpg(data);
            images.set(it.src, embedded);
          }
          // Anchored at the picture's bottom left as displayed and turned with
          // the page, the same way text is, so it stands upright on screen.
          page.drawImage(embedded, { ...at(it.x, it.y + it.h), width: it.w, height: it.h, rotate: rot });
        }
      }

      // Pages: turns first, then order and deletions.
      if (mode === 'edit') {
        slots.forEach((s) => {
          if (!s.turn) return;
          const p = all[s.src];
          p.setRotation(degrees((p.getRotation().angle + s.turn) % 360));
        });
        const identity = slots.length === all.length && slots.every((s, i) => s.src === i);
        if (!identity) {
          for (let i = all.length - 1; i >= 0; i--) doc.removePage(i);
          for (const s of slots) doc.addPage(all[s.src]);
        }
      }

      const saved = await doc.save();
      const blob = new Blob([saved as BlobPart], { type: 'application/pdf' });
      setOut((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), size: blob.size };
      });
    } catch (e) {
      const bad = e instanceof Error && e.message.match(/WinAnsi cannot encode "(.+?)"/);
      setError(
        bad
          ? `Text added to a PDF here can only use Western European letters for now, and "${bad[1]}" is not one of them.`
          : e instanceof Error && /encrypt/i.test(e.message)
            ? 'This PDF is protected against changes. Remove the protection with Unlock PDF first.'
            : 'Something went wrong writing the PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, [bytes, file, items, pages, slots, mode]);

  const counts = useMemo(() => {
    const changed = items.filter((i) => i.kind !== 'replace' || i.text !== i.original).length;
    return changed;
  }, [items]);

  if (!file) {
    return (
      <PdfDrop
        onFile={(f) => void open(f)}
        hint={
          mode === 'annotate'
            ? 'Highlight, draw, box and leave notes, then save a copy with the marks in it.'
            : 'Change text, add text and pictures, white things out, and turn, move or delete pages.'
        }
        busy={busy}
        error={error}
      />
    );
  }

  const toolInfo = TOOLS[mode].find((t) => t.id === tool)!;
  const swatches = tool === 'highlight' || sel?.kind === 'highlight' ? HIGHLIGHTS : INKS;
  const activeColour =
    sel && 'color' in sel ? sel.color : tool === 'highlight' ? hl : inkColor;
  const showColours = ['highlight', 'pen', 'box', 'text'].includes(tool) || (sel && ['highlight', 'ink', 'box', 'text', 'replace'].includes(sel.kind) && !(sel.kind === 'text' && sel.note));
  const showWidth = tool === 'pen' || tool === 'box' || sel?.kind === 'ink' || sel?.kind === 'box';
  const order = mode === 'edit' ? slots : pages.map((_, i) => ({ src: i, turn: 0 }));

  return (
    <ToolLayout
      title="Tools"
      settings={
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {TOOLS[mode].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTool(t.id); if (t.id !== 'select' && t.id !== 'edit') setSelected(null); }}
                aria-pressed={tool === t.id}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${tool === t.id ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-soft'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-ink-faint">{toolInfo.hint}</p>

          {showColours && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Colour</span>
              <div className="mt-2 flex gap-2">
                {swatches.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      if (sel && 'color' in sel) update({ color: c } as Partial<Item>, true);
                      else if (tool === 'highlight') setHl(c);
                      else setInkColor(c);
                    }}
                    aria-label={`Colour ${c}`}
                    aria-pressed={activeColour === c}
                    className={`size-7 rounded-full border-2 ${activeColour === c ? 'border-ink' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}
          {showWidth && (
            <label className="block text-sm">
              <span className="flex justify-between">Line width <span className="tabular-nums text-ink-faint">{sel && (sel.kind === 'ink' || sel.kind === 'box') ? sel.width : penWidth}</span></span>
              <input
                type="range" min={0.5} max={8} step={0.5}
                value={sel && (sel.kind === 'ink' || sel.kind === 'box') ? sel.width : penWidth}
                onChange={(e) => { const v = Number(e.target.value); if (sel && (sel.kind === 'ink' || sel.kind === 'box')) update({ width: v } as Partial<Item>); else setPenWidth(v); }}
                className="mt-1.5 w-full"
              />
            </label>
          )}

          {sel && (sel.kind === 'text' || sel.kind === 'replace') && (
            <div className="space-y-3 rounded-xl border border-accent/40 bg-accent-soft/40 p-3">
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  {sel.kind === 'replace' ? 'Change the text' : sel.note ? 'Note' : 'Text'}
                </span>
                <textarea
                  ref={textBox}
                  value={sel.text}
                  onChange={(e) => update({ text: sel.kind === 'replace' ? e.target.value.replace(/\n/g, ' ') : e.target.value } as Partial<Item>)}
                  onBlur={() => commit([...items])}
                  rows={sel.kind === 'replace' ? 2 : 4}
                  className="mt-1.5 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="flex justify-between">Size <span className="tabular-nums text-ink-faint">{Math.round(sel.size * 10) / 10}pt</span></span>
                <input type="range" min={5} max={48} step={0.5} value={sel.size} onChange={(e) => { update({ size: Number(e.target.value) } as Partial<Item>); setTextSize(Number(e.target.value)); }} className="mt-1.5 w-full" />
              </label>
              {sel.kind === 'replace' && (
                <p className="text-xs leading-relaxed text-ink-faint">
                  The old line is covered and the new one written over it in {sel.family === 'serif' ? 'Times' : sel.family === 'mono' ? 'Courier' : 'Helvetica'},
                  the nearest standard font. A longer line will run past where the old one ended.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <button onClick={undo} disabled={!past.length} className="text-ink-soft underline underline-offset-4 disabled:opacity-40">Undo</button>
            {sel && <button onClick={remove} className="text-accent underline underline-offset-4">Delete this</button>}
          </div>

          <button
            onClick={() => void save()}
            disabled={busy !== null || (!counts && (mode === 'annotate' || slots.every((s, i) => s.src === i && !s.turn) && slots.length === pages.length))}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ?? 'Save PDF'}
          </button>
          {error && <p className="text-xs leading-relaxed text-accent">{error}</p>}
          <input
            ref={imageInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void addImage(f); e.target.value = ''; }}
          />
        </>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {order.length} page{order.length === 1 ? '' : 's'}, {counts} change{counts === 1 ? '' : 's'}
          </p>
        </div>
      }
      actions={
        <>
          {out && (
            <DownloadButton href={out.url} filename={file.name.replace(/\.pdf$/i, '') + (mode === 'annotate' ? '-annotated.pdf' : '-edited.pdf')}>
              Download PDF, {formatBytes(out.size)}
            </DownloadButton>
          )}
          <button onClick={() => { setFile(null); setOut(null); setPages([]); }} className="text-sm text-ink-faint underline underline-offset-4">
            Use another PDF
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {order.map((slot, i) => (
          <section key={slot.src} className="rounded-2xl border border-line bg-surface-alt p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="tabular-nums text-ink-faint">
                Page {i + 1}
                {slot.src !== i ? ` (was ${slot.src + 1})` : ''}
              </span>
              {mode === 'edit' && (
                <span className="flex gap-1.5">
                  {(
                    [
                      ['up', 'Move up', i === 0],
                      ['down', 'Move down', i === order.length - 1],
                      ['turn', 'Turn', false],
                      ['delete', 'Delete', order.length === 1],
                    ] as const
                  ).map(([op, text, off]) => (
                    <button
                      key={op}
                      onClick={() => pageOp(i, op)}
                      disabled={off}
                      className={`rounded-md border border-line px-2 py-1 text-xs disabled:opacity-30 ${op === 'delete' ? 'text-accent' : 'text-ink-soft'}`}
                    >
                      {text}
                    </button>
                  ))}
                </span>
              )}
            </div>
            <div className="mx-auto max-w-3xl">
              <PageView
                info={pages[slot.src]}
                index={slot.src}
                turn={slot.turn}
                items={items.filter((it) => it.page === slot.src)}
                tool={tool}
                selected={selected}
                draftColor={tool === 'highlight' ? hl : inkColor}
                penWidth={penWidth}
                onSelect={setSelected}
                onCreate={(d) => create(slot.src, d)}
                onMoveStart={() => setPast((p) => [...p.slice(-60), items])}
                onMove={moveItem}
                onRun={(run) => editRun(slot.src, run)}
                onImageAt={(p) => { imageAt.current = { page: slot.src, p }; imageInput.current?.click(); }}
              />
            </div>
          </section>
        ))}
      </div>
      {mode === 'edit' && (
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Changed text is covered with the colour behind it and written again in a standard font, because a PDF only
          carries the letters it already uses. Everything you do not touch stays exactly as it was.
        </p>
      )}
    </ToolLayout>
  );
}

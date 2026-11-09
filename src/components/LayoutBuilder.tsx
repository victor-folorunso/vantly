'use client';

import { useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

/**
 * Flexbox and grid, set with controls and shown live on real boxes.
 *
 * The preview is the CSS that is printed, applied to the boxes as an inline
 * style, so what you see cannot drift from what you copy. Only the
 * properties that differ from the browser default are printed: a block of
 * twelve declarations, nine of them defaults, teaches nothing.
 */

export type LayoutKind = 'flex' | 'grid';

const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
const select = 'mt-1.5 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent';

function Choice<T extends string>({ name, value, options, onChange, hint }: { name: string; value: T; options: readonly T[]; onChange: (v: T) => void; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-mono text-[13px]">{name}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={select}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

function Num({ name, value, onChange, min = 0, max = 12, unit }: { name: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between">
        <span className="font-mono text-[13px]">{name}</span>
        <span className="tabular-nums text-ink-faint">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full" />
    </label>
  );
}

function CssOut({ css }: { css: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between">
        <span className={label}>CSS</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(css);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="text-sm text-accent underline underline-offset-4"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface-alt p-4 font-mono text-[13px] leading-relaxed">{css}</pre>
    </div>
  );
}

/** A declaration block, minus the defaults, as text and as a style object. */
function rule(selector: string, decls: [string, string, string?][]): { text: string; style: Record<string, string> } {
  const kept = decls.filter(([, v, def]) => v !== def);
  const style: Record<string, string> = {};
  for (const [k, v] of decls) style[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  return { text: `${selector} {\n${kept.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`, style };
}

const BOX = ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#a855f7', '#ef4444', '#14b8a6', '#ec4899'];

/* ── Flexbox ─────────────────────────────────────────────────────────────── */

function Flexbox() {
  const [direction, setDirection] = useState<'row' | 'row-reverse' | 'column' | 'column-reverse'>('row');
  const [wrap, setWrap] = useState<'nowrap' | 'wrap' | 'wrap-reverse'>('wrap');
  const [justify, setJustify] = useState<'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'>('flex-start');
  const [align, setAlign] = useState<'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline'>('stretch');
  const [content, setContent] = useState<'normal' | 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'stretch'>('normal');
  const [gap, setGap] = useState(12);
  const [count, setCount] = useState(5);
  const [grow, setGrow] = useState<number | null>(null);
  const [sizes, setSizes] = useState<'mixed' | 'same'>('mixed');

  const container = rule('.container', [
    ['display', 'flex'],
    ['flex-direction', direction, 'row'],
    ['flex-wrap', wrap, 'nowrap'],
    ['justify-content', justify, 'flex-start'],
    ['align-items', align, 'stretch'],
    ['align-content', content, 'normal'],
    ['gap', `${gap}px`, '0px'],
  ]);
  const css = container.text + (grow !== null ? `\n\n.container > :nth-child(${grow + 1}) {\n  flex-grow: 1;\n}` : '');
  const vertical = direction.startsWith('column');

  return (
    <ToolLayout
      title="Container"
      settings={
        <>
          <Choice name="flex-direction" value={direction} onChange={setDirection} options={['row', 'row-reverse', 'column', 'column-reverse']} />
          <Choice name="flex-wrap" value={wrap} onChange={setWrap} options={['nowrap', 'wrap', 'wrap-reverse']} />
          <Choice
            name="justify-content" value={justify} onChange={setJustify}
            options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']}
            hint={vertical ? 'Along the column, top to bottom.' : 'Along the row, left to right.'}
          />
          <Choice
            name="align-items" value={align} onChange={setAlign}
            options={['stretch', 'flex-start', 'center', 'flex-end', 'baseline']}
            hint={vertical ? 'Across the column, left to right.' : 'Across the row, top to bottom.'}
          />
          <Choice
            name="align-content" value={content} onChange={setContent}
            options={['normal', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'stretch']}
            hint={wrap === 'nowrap' ? 'Only does anything once items wrap onto more than one line.' : 'Spaces the wrapped lines themselves.'}
          />
          <Num name="gap" value={gap} onChange={setGap} max={48} unit="px" />
          <div className="border-t border-line pt-4">
            <Num name="Items" value={count} onChange={(v) => { setCount(v); if (grow !== null && grow >= v) setGrow(null); }} min={1} max={12} />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sizes === 'mixed'} onChange={(e) => setSizes(e.target.checked ? 'mixed' : 'same')} /> Items of different sizes
            </label>
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">Click an item to let it grow into the spare room.</p>
          </div>
        </>
      }
    >
      <div
        className="min-h-[340px] resize overflow-auto rounded-2xl border border-dashed border-line bg-surface-alt p-3"
        style={container.style}
      >
        {Array.from({ length: count }, (_, i) => {
          const w = sizes === 'mixed' ? [72, 120, 56, 96, 140, 64][i % 6] : 88;
          const h = sizes === 'mixed' ? [56, 84, 40, 100, 64, 72][i % 6] : 64;
          return (
            <button
              key={i}
              onClick={() => setGrow(grow === i ? null : i)}
              className={`grid shrink-0 place-items-center rounded-lg text-sm font-semibold text-white ${grow === i ? 'ring-4 ring-ink/40' : ''}`}
              style={{
                background: BOX[i % BOX.length],
                minWidth: vertical ? undefined : w,
                minHeight: vertical ? h : align === 'stretch' ? undefined : h,
                width: vertical && align !== 'stretch' ? w : undefined,
                height: !vertical && align !== 'stretch' ? h : undefined,
                flexGrow: grow === i ? 1 : 0,
                paddingTop: align === 'baseline' ? (i % 3) * 10 : undefined,
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-faint">Drag the bottom right corner to resize the box and watch it reflow.</p>
      <CssOut css={css} />
    </ToolLayout>
  );
}

/* ── Grid ────────────────────────────────────────────────────────────────── */

type Track = 'fr' | 'auto' | 'px' | 'minmax';

function track(kind: Track, px: number): string {
  if (kind === 'fr') return '1fr';
  if (kind === 'auto') return 'auto';
  if (kind === 'px') return `${px}px`;
  return `minmax(${px}px, 1fr)`;
}

function tracks(list: string[]): string {
  // repeat() for a run of identical tracks reads better than the list.
  return list.length > 1 && list.every((t) => t === list[0]) ? `repeat(${list.length}, ${list[0]})` : list.join(' ');
}

function TrackEditor({ list, set, name }: { list: { kind: Track; px: number }[]; set: (v: { kind: Track; px: number }[]) => void; name: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={label}>{name}</span>
        <span className="flex gap-3 text-sm">
          <button onClick={() => set(list.slice(0, -1))} disabled={list.length <= 1} className="text-ink-soft underline underline-offset-4 disabled:opacity-40">Fewer</button>
          <button onClick={() => set([...list, { kind: 'fr', px: 120 }])} disabled={list.length >= 6} className="text-ink-soft underline underline-offset-4 disabled:opacity-40">More</button>
        </span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {list.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-4 text-xs tabular-nums text-ink-faint">{i + 1}</span>
            <select
              value={t.kind}
              onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, kind: e.target.value as Track } : x)))}
              className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
              aria-label={`${name} ${i + 1}`}
            >
              <option value="fr">1fr</option>
              <option value="auto">auto</option>
              <option value="px">fixed</option>
              <option value="minmax">at least</option>
            </select>
            {(t.kind === 'px' || t.kind === 'minmax') && (
              <input
                type="number" min={10} max={800} value={t.px}
                onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, px: Number(e.target.value) || 0 } : x)))}
                className="w-20 rounded-md border border-line bg-surface px-2 py-1 text-sm tabular-nums"
                aria-label={`${name} ${i + 1} size in pixels`}
              />
            )}
            {(t.kind === 'px' || t.kind === 'minmax') && <span className="text-xs text-ink-faint">px</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Grid() {
  const [cols, setCols] = useState<{ kind: Track; px: number }[]>([
    { kind: 'px', px: 200 },
    { kind: 'fr', px: 120 },
    { kind: 'fr', px: 120 },
  ]);
  const [rows, setRows] = useState<{ kind: Track; px: number }[]>([
    { kind: 'auto', px: 80 },
    { kind: 'px', px: 160 },
    { kind: 'auto', px: 80 },
  ]);
  const [colGap, setColGap] = useState(12);
  const [rowGap, setRowGap] = useState(12);
  const [areas, setAreas] = useState(true);
  const [responsive, setResponsive] = useState(false);
  const [min, setMin] = useState(180);

  // Named areas make a page layout readable at a glance: a header across the
  // top, a sidebar, the main column, a footer. Built for three by three, the
  // shape people most often want, and dropped for any other.
  const canArea = !responsive && cols.length === 3 && rows.length === 3;
  const useAreas = areas && canArea;
  const AREAS = ['header header header', 'sidebar main main', 'footer footer footer'];
  const ITEMS = ['header', 'sidebar', 'main', 'footer'];

  const colText = responsive ? `repeat(auto-fill, minmax(${min}px, 1fr))` : tracks(cols.map((c) => track(c.kind, c.px)));
  const container = rule('.container', [
    ['display', 'grid'],
    ['grid-template-columns', colText],
    ['grid-template-rows', responsive ? '' : tracks(rows.map((r) => track(r.kind, r.px))), ''],
    ['grid-template-areas', useAreas ? AREAS.map((a) => `"${a}"`).join('\n    ') : '', ''],
    ['column-gap', `${colGap}px`, '0px'],
    ['row-gap', `${rowGap}px`, '0px'],
  ]);
  const css = container.text.replace(/  column-gap: (\S+);\n  row-gap: \1;/, '  gap: $1;') + (useAreas ? '\n\n' + ITEMS.map((n) => `.${n} { grid-area: ${n}; }`).join('\n') : '');

  const cells = responsive ? 9 : useAreas ? 4 : cols.length * rows.length;

  return (
    <ToolLayout
      title="Grid"
      settings={
        <>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={responsive} onChange={(e) => setResponsive(e.target.checked)} />
            As many columns as fit
          </label>
          {responsive ? (
            <Num name="Smallest column" value={min} onChange={setMin} min={80} max={400} unit="px" />
          ) : (
            <>
              <TrackEditor list={cols} set={setCols} name="Columns" />
              <TrackEditor list={rows} set={setRows} name="Rows" />
              <label className={`flex items-center gap-2 text-sm ${canArea ? '' : 'opacity-50'}`}>
                <input type="checkbox" checked={useAreas} disabled={!canArea} onChange={(e) => setAreas(e.target.checked)} />
                Page layout with named areas
              </label>
              {!canArea && <p className="-mt-2 text-xs text-ink-faint">Named areas are offered for three columns by three rows.</p>}
            </>
          )}
          <Num name="column-gap" value={colGap} onChange={setColGap} max={48} unit="px" />
          <Num name="row-gap" value={rowGap} onChange={setRowGap} max={48} unit="px" />
        </>
      }
    >
      <div className="min-h-[360px] resize overflow-auto rounded-2xl border border-dashed border-line bg-surface-alt p-3" style={container.style}>
        {Array.from({ length: cells }, (_, i) => (
          <div
            key={i}
            className="grid min-h-[48px] place-items-center rounded-lg p-2 text-sm font-semibold text-white"
            style={{ background: BOX[i % BOX.length], gridArea: useAreas ? ITEMS[i] : undefined }}
          >
            {useAreas ? ITEMS[i] : i + 1}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">Drag the bottom right corner to resize the box and watch the tracks give.</p>
      <CssOut css={css} />
    </ToolLayout>
  );
}

export default function LayoutBuilder({ kind }: { kind: LayoutKind }) {
  return kind === 'flex' ? <Flexbox /> : <Grid />;
}


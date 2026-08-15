'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Background removal by colour, with no model and no download.
 *
 * The obvious approach is a segmentation model, and it is genuinely feasible in
 * the browser at around 45MB quantised. The problem is licensing: RMBG-1.4 is
 * non-commercial, and this site will eventually carry billing. That is exactly
 * the trap of discovering a licence after building on it, so the model tier
 * waits until a permissive one is confirmed.
 *
 * Meanwhile this covers the cases people actually bring most often: a logo, a
 * product shot on white, a screenshot, a scanned signature. All of those have a
 * flat background, and for a flat background a flood fill is not a worse answer
 * than a neural network. It is a better one. It is exact, instant, needs no
 * download, and runs on a phone.
 *
 * The fill starts from the edges rather than removing every matching pixel in
 * the image. Otherwise white eyes, white text and any white inside the subject
 * disappear too, which is the single most common failure of naive colour
 * keying.
 */

type Mode = 'auto' | 'pick';

function hexOf(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [tolerance, setTolerance] = useState(32);
  const [feather, setFeather] = useState(1);
  const [mode, setMode] = useState<Mode>('auto');
  const [pickedColor, setPickedColor] = useState<[number, number, number] | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removedPct, setRemovedPct] = useState<number | null>(null);
  const sourceRef = useRef<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const load = useCallback(async (f: File) => {
    const bitmap = await createImageBitmap(f);
    const c = document.createElement('canvas');
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    sourceRef.current = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    setFile(f);
    setPickedColor(null);
  }, []);

  const run = useCallback(async () => {
    const src = sourceRef.current;
    if (!src) return;
    setBusy(true);
    try {
      const { width: w, height: h } = src;
      const data = new Uint8ClampedArray(src.data);
      const visited = new Uint8Array(w * h);
      const stack: number[] = [];

      const seedColors: [number, number, number][] = [];
      if (mode === 'pick' && pickedColor) {
        seedColors.push(pickedColor);
        // Every edge pixel matching the chosen colour becomes a seed.
        for (let x = 0; x < w; x++) {
          stack.push(x, (h - 1) * w + x);
        }
        for (let y = 0; y < h; y++) {
          stack.push(y * w, y * w + w - 1);
        }
      } else {
        // Auto: assume the corners are background, which is true for a product
        // shot and a logo and false for a photo, which is what the tolerance
        // slider and the percentage readout are for.
        const corners = [0, w - 1, (h - 1) * w, h * w - 1];
        for (const i of corners) {
          const p = i * 4;
          seedColors.push([data[p], data[p + 1], data[p + 2]]);
          stack.push(i);
        }
        for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
        for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
      }

      const tol = tolerance * tolerance * 3;
      const matches = (i: number) => {
        const p = i * 4;
        for (const [r, g, b] of seedColors) {
          const dr = data[p] - r;
          const dg = data[p + 1] - g;
          const db = data[p + 2] - b;
          if (dr * dr + dg * dg + db * db <= tol) return true;
        }
        return false;
      };

      let removed = 0;
      while (stack.length) {
        const i = stack.pop()!;
        if (i < 0 || i >= w * h || visited[i]) continue;
        visited[i] = 1;
        if (!matches(i)) continue;
        data[i * 4 + 3] = 0;
        removed++;
        const x = i % w;
        if (x > 0) stack.push(i - 1);
        if (x < w - 1) stack.push(i + 1);
        if (i >= w) stack.push(i - w);
        if (i < w * (h - 1)) stack.push(i + w);
      }

      /* Feathering. A hard cut leaves a fringe of background-coloured pixels
         around the subject, which is the thing that makes a cutout look cheap.
         Any pixel next to a transparent one gets partial alpha. */
      if (feather > 0) {
        const alpha = new Uint8ClampedArray(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
        for (let pass = 0; pass < feather; pass++) {
          const next = new Uint8ClampedArray(alpha);
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const i = y * w + x;
              if (alpha[i] === 0) continue;
              const around =
                alpha[i - 1] + alpha[i + 1] + alpha[i - w] + alpha[i + w];
              if (around < 4 * 255) next[i] = Math.min(alpha[i], around / 4);
            }
          }
          alpha.set(next);
        }
        for (let i = 0; i < w * h; i++) data[i * 4 + 3] = alpha[i];
      }

      setRemovedPct(Math.round((removed / (w * h)) * 100));

      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      out.getContext('2d')!.putImageData(new ImageData(data, w, h), 0, 0);
      const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'));
      if (blob) {
        setOutUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }
    } finally {
      setBusy(false);
    }
  }, [tolerance, feather, mode, pickedColor]);

  useEffect(() => {
    if (sourceRef.current) void run();
  }, [run, file]);

  // Draw the original onto a canvas so a click can sample a colour from it.
  useEffect(() => {
    const src = sourceRef.current;
    const c = canvasRef.current;
    if (!src || !c || mode !== 'pick') return;
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')!.putImageData(src, 0, 0);
  }, [file, mode]);

  if (!file) {
    return (
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-16 text-center transition-colors hover:border-accent">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && void load(e.target.files[0])}
        />
        <span className="text-lg font-medium">Drop an image here</span>
        <span className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
          Works best on a flat background: a logo, a product on white, a
          screenshot, a scanned signature.
        </span>
      </label>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div
          className="overflow-hidden rounded-xl border border-line"
          style={{
            // Checkerboard, so transparency reads as transparency rather than
            // as white, which is the colour usually being removed.
            backgroundImage:
              'linear-gradient(45deg,#00000010 25%,transparent 25%,transparent 75%,#00000010 75%),linear-gradient(45deg,#00000010 25%,transparent 25%,transparent 75%,#00000010 75%)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0, 9px 9px',
          }}
        >
          {mode === 'pick' ? (
            <canvas
              ref={canvasRef}
              onClick={(e) => {
                const c = canvasRef.current!;
                const rect = c.getBoundingClientRect();
                const x = Math.floor(((e.clientX - rect.left) / rect.width) * c.width);
                const y = Math.floor(((e.clientY - rect.top) / rect.height) * c.height);
                const d = c.getContext('2d')!.getImageData(x, y, 1, 1).data;
                setPickedColor([d[0], d[1], d[2]]);
              }}
              className="block w-full cursor-crosshair"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            outUrl && <img src={outUrl} alt="Background removed" className="block w-full" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="tabular-nums text-ink-faint">
            {busy ? 'Working…' : removedPct !== null ? `${removedPct}% removed` : ''}
          </p>
          <button
            onClick={() => {
              setFile(null);
              sourceRef.current = null;
              setRemovedPct(null);
            }}
            className="text-ink-faint underline underline-offset-4"
          >
            Use another image
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex gap-2">
          {(['auto', 'pick'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                m === mode
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-line text-ink-soft hover:border-ink-faint'
              }`}
            >
              {m === 'auto' ? 'Automatic' : 'Pick a colour'}
            </button>
          ))}
        </div>

        {mode === 'pick' && (
          <p className="mt-3 flex items-center gap-2 text-xs leading-relaxed text-ink-faint">
            {pickedColor ? (
              <>
                <span
                  className="inline-block size-4 rounded border border-line"
                  style={{ background: hexOf(...pickedColor) }}
                />
                Removing {hexOf(...pickedColor)}. Click again to change it.
              </>
            ) : (
              'Click the background in the image to choose which colour to remove.'
            )}
          </p>
        )}

        <label className="mt-5 block text-sm">
          <span className="flex justify-between">
            Tolerance
            <span className="tabular-nums text-ink-faint">{tolerance}</span>
          </span>
          <input
            type="range"
            min={4}
            max={120}
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
          <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">
            How different a pixel can be and still count as background. Raise it
            for a photographed background, lower it if the subject starts
            disappearing.
          </span>
        </label>

        <label className="mt-4 block text-sm">
          <span className="flex justify-between">
            Soften edge
            <span className="tabular-nums text-ink-faint">{feather}</span>
          </span>
          <input
            type="range"
            min={0}
            max={4}
            value={feather}
            onChange={(e) => setFeather(Number(e.target.value))}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>

        {outUrl && (
          <a
            href={outUrl}
            download={file.name.replace(/\.[^.]+$/, '') + '-cutout.png'}
            className="mt-5 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-ink"
          >
            Download PNG
          </a>
        )}

        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          The fill starts at the edges, so white inside the subject is kept
          rather than punched out. PNG because JPG has no transparency and would
          hand the background straight back to you.
        </p>
      </div>
    </div>
  );
}

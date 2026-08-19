'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSegmenter, isModelCached, checkSupport, SEGMENT_MODEL_MB, type Support } from '@/lib/segment';

/**
 * Two ways to cut a background out, because they fail at opposite things.
 *
 * **Colour** floods inward from the edges and removes anything close enough to
 * the edge colour. Exact on a flat background, instant, nothing to download,
 * and hopeless on a photograph, because it has no idea what a person is.
 *
 * **Subject** runs BiRefNet, the model several commercial background removers
 * are built on. It understands what it is looking at, and it costs a 109MB
 * download the first time. Never fetched unless asked for.
 *
 * The licence question that blocked this earlier is settled. RMBG-1.4 is
 * smaller at 44MB and non-commercial only, so it is out for a site that will
 * bill. BiRefNet is MIT.
 *
 * The colour fill starts at the edges rather than deleting every matching pixel
 * anywhere. Otherwise white eyes, white text and any white gap inside the
 * subject go too, which is the commonest failure of naive colour keying.
 */

type Mode = 'auto' | 'pick' | 'subject';

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
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [support, setSupport] = useState<Support | null>(null);
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

  /**
   * The model path. Hands the whole image to BiRefNet and uses the alpha it
   * returns, rather than deciding anything about colour.
   */
  const runSubject = useCallback(async () => {
    const f = file;
    if (!f) return;
    setBusy(true);
    setModelError(null);
    try {
      const segment = await loadSegmenter(setModelProgress);
      setModelProgress(null);
      setModelReady(true);

      const url = URL.createObjectURL(f);
      try {
        const [result] = await segment(url);
        const mask = result.mask;

        const src = sourceRef.current!;
        const { width: w, height: h } = src;
        const data = new Uint8ClampedArray(src.data);

        /* The mask comes back at the model's own resolution, so it is sampled
           with nearest neighbour rather than assumed to match. Scaling the
           image down to the mask instead would hand back a smaller picture
           than the one that was uploaded, which is the thing every capped
           competitor already does. */
        let removed = 0;
        for (let y = 0; y < h; y++) {
          const my = Math.min(mask.height - 1, Math.floor((y * mask.height) / h));
          for (let x = 0; x < w; x++) {
            const mx = Math.min(mask.width - 1, Math.floor((x * mask.width) / w));
            const a = mask.data[my * mask.width + mx];
            data[(y * w + x) * 4 + 3] = a;
            if (a < 128) removed++;
          }
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
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setModelProgress(null);
      setModelError(
        e instanceof Error ? e.message : 'The model would not load. Colour mode still works.',
      );
    } finally {
      setBusy(false);
    }
  }, [file]);

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
    if (!sourceRef.current) return;
    if (mode === 'subject') void runSubject();
    else void run();
  }, [run, runSubject, mode, file]);

  /* Asked once on mount. Without this the only way to discover the browser
     cannot run the model is to download 109MB and watch it fail, which is what
     happened the first time. */
  useEffect(() => {
    void checkSupport().then(setSupport);
    void isModelCached().then(setModelReady);
  }, []);

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
          {(['subject', 'auto', 'pick'] as Mode[]).map((m) => {
            const blocked = m === 'subject' && support?.ok === false;
            return (
              <button
                key={m}
                onClick={() => !blocked && setMode(m)}
                disabled={blocked}
                title={blocked ? (support as { reason: string }).reason : undefined}
                className={`flex-1 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors ${
                  m === mode
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                } ${blocked ? 'cursor-not-allowed opacity-40 hover:border-line' : ''}`}
              >
                {m === 'subject' ? 'Subject' : m === 'auto' ? 'Colour' : 'Pick'}
              </button>
            );
          })}
        </div>

        {support?.ok === false && (
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            Subject mode needs WebGPU. {(support as { reason: string }).reason} Colour
            mode works everywhere.
          </p>
        )}

        {mode === 'subject' && (
          <div className="mt-3">
            {modelError ? (
              <p className="text-xs leading-relaxed text-accent">
                {modelError} Colour mode still works and needs no download.
              </p>
            ) : modelProgress !== null ? (
              <>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full bg-accent transition-[width]"
                    style={{ width: `${Math.round(modelProgress * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs tabular-nums text-ink-faint">
                  Downloading the model, {Math.round(modelProgress * 100)}%
                </p>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-ink-faint">
                {modelReady
                  ? 'Works on photographs, hair and anything with a busy background.'
                  : `Downloads a ${SEGMENT_MODEL_MB}MB model the first time, then it is cached. Colour mode needs no download.`}
              </p>
            )}
          </div>
        )}

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

        {/* Tolerance and softening belong to the colour path. The model has
            no threshold to tune, and a dead slider is worse than none. */}
        {mode !== 'subject' && (
        <>
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
        </>
        )}

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

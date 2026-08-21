'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Shows what a file is, before or after a tool touches it.
 *
 * Picking a file and seeing only its name is a small anxiety: you cannot tell
 * whether you chose the right screenshot out of forty named Screenshot
 * 2026-08-21. The same applies at the other end, where a download named
 * output.pdf could be anything.
 *
 * What it can actually show:
 *
 *   image   drawn directly, browsers decode these
 *   pdf     the first page, rendered with pdf.js
 *   text    the first few lines
 *   other   the extension and the size, which is all there is to say
 *
 * Size is capped in CSS rather than by resizing the image, so a 6000 pixel
 * photograph and a 60 pixel icon both sit inside the same box without either
 * being stretched. Contain rather than cover, because a preview that crops is
 * worse than useless: it hides the part you were checking.
 */

type Props = {
  file?: File | null;
  /** For a result that exists as a blob URL rather than a File. */
  url?: string | null;
  name?: string;
  /** Tall for a single prominent preview, short for a row in a list. */
  size?: 'row' | 'panel';
  className?: string;
};

const IMAGE = /\.(png|jpe?g|webp|avif|gif|bmp|svg|ico|tiff?)$/i;
const TEXT = /\.(txt|md|markdown|csv|tsv|json|xml|yaml|yml|html?|css|js|ts|srt|vtt|log)$/i;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FilePreview({
  file,
  url,
  name,
  size = 'panel',
  className = '',
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const made = useRef<string | null>(null);

  const label = name ?? file?.name ?? 'file';
  const box = size === 'row' ? 'h-16 w-16' : 'max-h-80 w-full';

  useEffect(() => {
    setSrc(null);
    setText(null);
    setFailed(false);

    // Anything made here is released here. Anything handed in belongs to the
    // caller, who may still be showing it somewhere else.
    const release = () => {
      if (made.current) {
        URL.revokeObjectURL(made.current);
        made.current = null;
      }
    };
    release();

    let cancelled = false;

    (async () => {
      try {
        if (url) {
          setSrc(url);
          return;
        }
        if (!file) return;

        if (IMAGE.test(file.name) || file.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(file);
          made.current = objectUrl;
          if (!cancelled) setSrc(objectUrl);
          return;
        }

        if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.mjs',
            import.meta.url,
          ).toString();
          const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
          const page = await doc.getPage(1);
          // Rendered at the width it will be shown at rather than full size,
          // since this is a thumbnail and a 300 page document should not pay
          // for a full resolution render of page one.
          const viewport = page.getViewport({ scale: size === 'row' ? 0.3 : 1.1 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.8));
          if (blob && !cancelled) {
            const objectUrl = URL.createObjectURL(blob);
            made.current = objectUrl;
            setSrc(objectUrl);
          }
          return;
        }

        if (TEXT.test(file.name) || file.type.startsWith('text/')) {
          // Only the head of it. Reading a 200MB log in full to show six lines
          // would freeze the page.
          const slice = await file.slice(0, 4000).text();
          if (!cancelled) setText(slice.split('\n').slice(0, 12).join('\n'));
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      release();
    };
  }, [file, url, size]);

  const frame =
    'flex items-center justify-center overflow-hidden rounded-lg border border-line bg-surface';

  if (src) {
    return (
      <figure className={`${frame} ${box} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          onError={() => setFailed(true)}
          className="max-h-full max-w-full object-contain"
        />
      </figure>
    );
  }

  if (text) {
    return (
      <pre
        className={`${frame} ${box} block overflow-auto whitespace-pre-wrap p-3 text-left font-mono text-[11px] leading-relaxed text-ink-soft ${className}`}
      >
        {text}
      </pre>
    );
  }

  return (
    <div className={`${frame} ${box} flex-col gap-1 text-center ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {failed ? 'no preview' : (label.split('.').pop() ?? 'file')}
      </span>
      {file && <span className="text-[11px] tabular-nums text-ink-faint">{formatBytes(file.size)}</span>}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import DropIcon from '@/components/DropIcon';

/**
 * Three small edits to a PDF that share one shape: load, change, save.
 *
 * text     pull the words out, page by page
 * unlock   open with a password, write back without one
 * mark     stamp a watermark across every page
 * number   write page numbers into a corner or the middle of the edge
 * protect  encrypt with a password, AES-256
 *
 * Built together because each is a few lines on top of the same load and save,
 * and three separate components would mean maintaining the drop zone, the error
 * handling and the memory cleanup three times.
 *
 * Unlocking needs saying plainly: this removes a password you already know. It
 * is not a crack. pdf-lib cannot open a file without the password, so a PDF you
 * cannot open stays closed, which is the correct behaviour rather than a
 * limitation.
 */

type Mode = 'text' | 'unlock' | 'mark' | 'number' | 'protect';

type NumberPlace = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
type NumberStyle = 'n' | 'page-n' | 'n-of-total' | 'page-n-of-total';

const PLACES: { id: NumberPlace; label: string }[] = [
  { id: 'top-left', label: 'Top left' },
  { id: 'top-center', label: 'Top middle' },
  { id: 'top-right', label: 'Top right' },
  { id: 'bottom-left', label: 'Bottom left' },
  { id: 'bottom-center', label: 'Bottom middle' },
  { id: 'bottom-right', label: 'Bottom right' },
];

const STYLES: { id: NumberStyle; label: (n: number, total: number) => string }[] = [
  { id: 'n', label: (n) => `${n}` },
  { id: 'page-n', label: (n) => `Page ${n}` },
  { id: 'n-of-total', label: (n, total) => `${n} of ${total}` },
  { id: 'page-n-of-total', label: (n, total) => `Page ${n} of ${total}` },
];

/**
 * Where on the page, in the page's own coordinates, a point the reader sees
 * at (vx, vy) actually is, for a page displayed with a /Rotate of r.
 *
 * Without this a page stored sideways and displayed upright gets its number
 * down the side of the paper, written vertically.
 */
function fromView(vx: number, vy: number, r: number, w: number, h: number): { x: number; y: number } {
  if (r === 90) return { x: w - vy, y: vx };
  if (r === 180) return { x: w - vx, y: h - vy };
  if (r === 270) return { x: vy, y: h - vx };
  return { x: vx, y: vy };
}

function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfEdit({ mode }: { mode: Mode }) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [text, setText] = useState('');
  const [markText, setMarkText] = useState('DRAFT');
  const [opacity, setOpacity] = useState(0.18);
  const [angle, setAngle] = useState(45);
  const [place, setPlace] = useState<NumberPlace>('bottom-center');
  const [style, setStyle] = useState<NumberStyle>('n');
  const [startAt, setStartAt] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [numberSize, setNumberSize] = useState(11);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [allowEdit, setAllowEdit] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const reset = () => {
    setFile(null); setText(''); setError(null); setOutUrl(null); setPassword('');
    setNewPassword(''); setConfirmPassword('');
  };

  /* ── Extract text, which is pdf.js rather than pdf-lib ─────────────── */
  const extract = useCallback(async (f: File) => {
    setBusy('Reading');
    setError(null);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString();

      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const parts: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setBusy(`Reading page ${i} of ${doc.numPages}`);
        const content = await (await doc.getPage(i)).getTextContent();

        /* pdf.js returns positioned fragments rather than lines, so a naive
           join runs every line together. Fragments carrying an end-of-line
           marker get a newline, and a gap in the vertical position starts a
           new paragraph. */
        let out = '';
        let lastY: number | null = null;
        for (const item of content.items as { str: string; transform: number[]; hasEOL?: boolean }[]) {
          const y = item.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 4) out += '\n';
          out += item.str;
          if (item.hasEOL) out += '\n';
          lastY = y;
        }
        parts.push(`--- Page ${i} ---\n${out.trim()}`);
      }

      const joined = parts.join('\n\n');
      setText(joined);
      if (!joined.replace(/--- Page \d+ ---/g, '').trim()) {
        setError(
          'No text found. This is probably a scan, which is a picture of words rather than words. Reading it needs OCR.',
        );
      }
    } catch (e) {
      setError(
        e instanceof Error && /password/i.test(e.message)
          ? 'That PDF is password protected.'
          : 'That file could not be read as a PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, []);

  /* ── Unlock and watermark, both pdf-lib ────────────────────────────── */
  const write = useCallback(async () => {
    if (!file) return;
    setBusy('Working');
    setError(null);
    try {
      if (mode === 'protect') {
        /* The fork rather than pdf-lib itself, because pdf-lib cannot encrypt.
           It is only fetched on this page. AES-256 is its default, the one
           cipher the current PDF standard still recommends. */
        const { PDFDocument: SecureDoc } = await import('@cantoo/pdf-lib');
        const doc = await SecureDoc.load(await file.arrayBuffer());
        doc.encrypt({
          userPassword: newPassword,
          // A separate, random owner password, so the restrictions below
          // actually hold: anyone with the owner password can lift them, and
          // nobody has this one.
          ownerPassword: randomPassword(),
          permissions: {
            printing: allowPrint ? 'highResolution' : false,
            copying: allowCopy,
            contentAccessibility: true,
            modifying: allowEdit,
            annotating: allowEdit,
            fillingForms: true,
            documentAssembly: allowEdit,
          },
        });
        const bytes = await doc.save();
        const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        setOutSize(blob.size);
        setOutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
        return;
      }

      const { PDFDocument, degrees, rgb, StandardFonts } = await import('pdf-lib');

      const doc = await PDFDocument.load(await file.arrayBuffer(), {
        // The only way pdf-lib opens an encrypted file. Without this it throws
        // rather than asking.
        ignoreEncryption: mode === 'unlock',
      });

      if (mode === 'mark') {
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          // Sized to the diagonal so the text spans the page whatever its
          // shape, and never overflows a narrow one.
          const size = Math.min(width, height) / (markText.length * 0.42 || 1);
          page.drawText(markText, {
            x: width / 2 - (font.widthOfTextAtSize(markText, size) / 2) * Math.cos((angle * Math.PI) / 180),
            y: height / 2 - (size / 2),
            size,
            font,
            color: rgb(0.5, 0.5, 0.5),
            opacity,
            rotate: degrees(angle),
          });
        }
      }

      if (mode === 'number') {
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const pages = doc.getPages();
        const counted = skipFirst ? pages.length - 1 : pages.length;
        const total = counted + startAt - 1;
        const label = STYLES.find((s) => s.id === style)!.label;
        pages.forEach((page, i) => {
          if (skipFirst && i === 0) return;
          const n = startAt + (skipFirst ? i - 1 : i);
          const words = label(n, total);
          const r = ((page.getRotation().angle % 360) + 360) % 360;
          const { width: w, height: h } = page.getSize();
          // The size the reader sees, which is turned when the page is.
          const vw = r === 90 || r === 270 ? h : w;
          const vh = r === 90 || r === 270 ? w : h;
          const textW = font.widthOfTextAtSize(words, numberSize);
          // Half an inch in from the edge, clear of most printers' margins.
          const margin = 36;
          const vx = place.endsWith('left') ? margin : place.endsWith('right') ? vw - margin - textW : (vw - textW) / 2;
          const vy = place.startsWith('top') ? vh - margin - numberSize * 0.75 : margin;
          const { x, y } = fromView(vx, vy, r, w, h);
          page.drawText(words, { x, y, size: numberSize, font, color: rgb(0.2, 0.2, 0.2), rotate: degrees(r) });
        });
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      setOutSize(blob.size);
      setOutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
    } catch (e) {
      /* The watermark is drawn in one of the fonts every PDF reader has built
         in, which covers Western European letters only. Anything else (Cyrillic,
         Chinese, Yoruba's underdotted letters) throws "WinAnsi cannot encode",
         and saying "something went wrong" left people retrying the same text. */
      const unencodable = e instanceof Error && e.message.match(/WinAnsi cannot encode "(.+?)"/);
      setError(
        unencodable
          ? `The watermark can only use Western European letters for now, and "${unencodable[1]}" is not one of them. Try the text without it.`
          : e instanceof Error && /encrypt|password/i.test(e.message)
          ? mode === 'protect' || mode === 'number'
            ? 'This PDF already has a password. Remove it first with Unlock PDF, then try again.'
            : 'This PDF is encrypted in a way that cannot be opened without the password. Open it in a reader with the password, print to PDF, and try again.'
          : 'Something went wrong writing the PDF.',
      );
    } finally {
      setBusy(null);
    }
  }, [file, mode, markText, opacity, angle, place, style, startAt, skipFirst, numberSize, newPassword, allowPrint, allowCopy, allowEdit]);

  const pick = (f: File) => {
    setFile(f);
    setOutUrl(null);
    setError(null);
    if (mode === 'text') void extract(f);
  };

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <DropIcon />
        <p className="text-lg font-medium">Drop a PDF here</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'text' && 'The text comes back page by page, ready to copy.'}
          {mode === 'unlock' && 'Removes a password you already know, so it stops asking every time.'}
          {mode === 'mark' && 'Stamps your text across every page.'}
          {mode === 'number' && 'Numbers every page, in the corner or edge you choose.'}
          {mode === 'protect' && 'Nobody can open the copy without the password you set.'}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a PDF
        </button>
        {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <ToolLayout
      settings={
        mode === 'text' ? null : (
          <>
            {mode === 'mark' && (
              <>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    Watermark text
                  </span>
                  <input
                    value={markText}
                    onChange={(e) => setMarkText(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                  />
                </label>
                <div className="rounded-xl border border-line bg-surface p-4">
                  <label className="block text-sm">
                    <span className="flex justify-between">
                      Opacity
                      <span className="tabular-nums text-ink-faint">{Math.round(opacity * 100)}%</span>
                    </span>
                    <input type="range" min={5} max={60} value={opacity * 100}
                      onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                      className="mt-1.5 w-full accent-[var(--accent)]" />
                  </label>
                  <label className="mt-3 block text-sm">
                    <span className="flex justify-between">
                      Angle
                      <span className="tabular-nums text-ink-faint">{angle}°</span>
                    </span>
                    <input type="range" min={0} max={90} step={15} value={angle}
                      onChange={(e) => setAngle(Number(e.target.value))}
                      className="mt-1.5 w-full accent-[var(--accent)]" />
                  </label>
                </div>
              </>
            )}
            {mode === 'number' && (
              <>
                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Where</legend>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {PLACES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setPlace(p.id); setOutUrl(null); }}
                        aria-pressed={place === p.id}
                        className={`rounded-md border px-2 py-2 text-xs ${
                          place === p.id ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-soft hover:border-ink-faint'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Style</span>
                  <select
                    value={style}
                    onChange={(e) => { setStyle(e.target.value as NumberStyle); setOutUrl(null); }}
                    className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5"
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label(3, 12)}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Start at</span>
                    <input
                      type="number" min={0} value={startAt}
                      onChange={(e) => { setStartAt(Math.max(0, Math.floor(Number(e.target.value) || 0))); setOutUrl(null); }}
                      className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Size</span>
                    <input
                      type="number" min={6} max={36} value={numberSize}
                      onChange={(e) => { setNumberSize(Math.min(36, Math.max(6, Number(e.target.value) || 11))); setOutUrl(null); }}
                      className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={skipFirst} onChange={(e) => { setSkipFirst(e.target.checked); setOutUrl(null); }} className="size-4" />
                  No number on the first page
                </label>
              </>
            )}
            {mode === 'protect' && (
              <>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Password</span>
                  <input
                    type="password" autoComplete="new-password" value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setOutUrl(null); }}
                    className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Same again</span>
                  <input
                    type="password" autoComplete="new-password" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setOutUrl(null); }}
                    className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
                  />
                </label>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-accent">The two passwords are different.</p>
                )}
                <fieldset className="space-y-2 text-sm">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Once it is open, allow</legend>
                  <label className="mt-2 flex items-center gap-2">
                    <input type="checkbox" checked={allowPrint} onChange={(e) => { setAllowPrint(e.target.checked); setOutUrl(null); }} className="size-4" />
                    Printing
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={allowCopy} onChange={(e) => { setAllowCopy(e.target.checked); setOutUrl(null); }} className="size-4" />
                    Copying text
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={allowEdit} onChange={(e) => { setAllowEdit(e.target.checked); setOutUrl(null); }} className="size-4" />
                    Editing and comments
                  </label>
                </fieldset>
                <p className="text-xs leading-relaxed text-ink-faint">
                  Keep the password somewhere safe. There is no way to recover it, here or anywhere else.
                </p>
              </>
            )}
            <button
              onClick={() => void write()}
              disabled={
                busy !== null ||
                (mode === 'mark' && !markText.trim()) ||
                (mode === 'protect' && (!newPassword || newPassword !== confirmPassword))
              }
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
            >
              {busy ??
                (mode === 'unlock'
                  ? 'Remove the password'
                  : mode === 'number'
                    ? 'Number the pages'
                    : mode === 'protect'
                      ? 'Add the password'
                      : 'Add the watermark')}
            </button>
          </>
        )
      }
      status={
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs tabular-nums text-ink-faint">
              {busy ?? formatBytes(file.size)}
            </p>
          </div>
        </>
      }
      actions={
        <>
          {outUrl && (
            <DownloadButton
              href={outUrl}
              filename={
                file.name.replace(/\.pdf$/i, '') +
                ({ unlock: '-unlocked', mark: '-marked', number: '-numbered', protect: '-protected', text: '' } as const)[mode] +
                '.pdf'
              }
              variant="quiet"
            >
              Download PDF, {formatBytes(outSize)}
            </DownloadButton>
          )}
          <button onClick={reset} className="text-sm text-ink-faint underline underline-offset-4">
            Use another PDF
          </button>
        </>
      }
    >
      {mode === 'text' && (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Text
            </span>
            {text && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy all'}
              </button>
            )}
          </div>
          <textarea
            value={text}
            readOnly
            rows={18}
            spellCheck={false}
            placeholder="The text appears here."
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>
      )}

      {mode === 'unlock' && (
        <p className="mt-5 max-w-2xl rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink-soft">
          This removes the password from a PDF you can already open. It is not a
          way into a file you do not have the password for, and it will not
          pretend otherwise.
        </p>
      )}

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}
    </ToolLayout>
  );
}

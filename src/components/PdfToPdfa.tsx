'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import PdfDrop from '@/components/PdfDrop';
import ToolLayout from '@/components/ToolLayout';
import { convertFile } from '@/lib/convert';

/**
 * A PDF made into PDF/A, the archival form.
 *
 * The conversion is Ghostscript on the server, because making a file PDF/A
 * means embedding every font it uses, and the fonts a PDF only names are not
 * in the browser to embed. What comes back is then checked here, for the
 * things an archive's validator rejects first: the colour profile, the
 * declaration of which PDF/A it is, and fonts left out.
 */

type Level = '1' | '2' | '3';
const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: '2', label: 'PDF/A-2b', hint: 'What most courts, universities and archives mean. Keeps transparency.' },
  { id: '1', label: 'PDF/A-1b', hint: 'The oldest part. Ask for it only if a portal names it, since transparency gets flattened.' },
  { id: '3', label: 'PDF/A-3b', hint: 'Like 2b, and allows other files attached inside. Used for e-invoices.' },
];

type Check = { label: string; ok: boolean; detail: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function inspect(blob: Blob, pagesBefore: number, level: Level): Promise<Check[]> {
  const { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFArray } = await import('pdf-lib');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const checks: Check[] = [];

  const pages = doc.getPageCount();
  checks.push({ label: 'Every page is there', ok: pages === pagesBefore, detail: `${pages} of ${pagesBefore}` });

  const intents = doc.catalog.lookup(PDFName.of('OutputIntents'));
  const hasIntent = intents instanceof PDFArray && intents.size() > 0;
  checks.push({ label: 'Colour profile attached', ok: hasIntent, detail: hasIntent ? 'sRGB output intent' : 'missing' });

  let declared = '';
  const meta = doc.catalog.lookup(PDFName.of('Metadata'));
  if (meta instanceof PDFRawStream) {
    const xml = new TextDecoder().decode(meta.contents);
    const part = xml.match(/pdfaid:part(?:>|="|=')\s*(\d)/)?.[1];
    const conf = xml.match(/pdfaid:conformance(?:>|="|=')\s*([A-Za-z])/)?.[1];
    if (part) declared = `PDF/A-${part}${(conf ?? '').toLowerCase()}`;
  }
  checks.push({ label: 'Declares itself PDF/A', ok: declared === `PDF/A-${level}b`, detail: declared || 'no declaration' });

  // Fonts: every font dictionary should have its program embedded, except
  // Type 3 fonts, whose glyphs are drawings inside the file already.
  let fonts = 0;
  let missing = 0;
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict) || obj.get(PDFName.of('Type')) !== PDFName.of('FontDescriptor')) continue;
    fonts++;
    if (!obj.has(PDFName.of('FontFile')) && !obj.has(PDFName.of('FontFile2')) && !obj.has(PDFName.of('FontFile3'))) missing++;
  }
  checks.push({
    label: 'Every font embedded',
    ok: missing === 0,
    detail: fonts ? `${fonts - missing} of ${fonts}` : 'no fonts, so nothing to embed',
  });
  return checks;
}

export default function PdfToPdfa() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesBefore, setPagesBefore] = useState(0);
  const [level, setLevel] = useState<Level>('2');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; size: number; name: string; checks: Check[] } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);

  const open = useCallback(async (f: File) => {
    setError(null);
    setOut(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await f.arrayBuffer(), { updateMetadata: false });
      setPagesBefore(doc.getPageCount());
      setFile(f);
    } catch (e) {
      setError(e instanceof Error && /encrypt/i.test(e.message) ? 'That PDF has a password. Remove it first with Unlock PDF, since PDF/A does not allow encryption.' : 'That file could not be read as a PDF.');
    }
  }, []);

  const convert = async () => {
    if (!file) return;
    setBusy('Converting');
    setError(null);
    setOut(null);
    abort.current?.abort();
    abort.current = new AbortController();
    const result = await convertFile(file, 'pdfa', abort.current.signal, { level });
    if (!result.ok) {
      setBusy(null);
      setError(result.error);
      return;
    }
    setBusy('Checking the result');
    try {
      const checks = await inspect(result.blob, pagesBefore, level);
      setOut({ url: URL.createObjectURL(result.blob), size: result.blob.size, name: result.filename, checks });
    } catch {
      setError('The converted file came back unreadable. Try again, or try PDF/A-2b.');
    } finally {
      setBusy(null);
    }
  };

  if (!file) {
    return <PdfDrop onFile={(f) => void open(f)} hint="The PDF is sent to the conversion server, converted and deleted. Nothing is kept." busy={null} error={error} />;
  }

  return (
    <ToolLayout
      title="PDF/A"
      settings={
        <>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Part</legend>
            <div className="mt-2 space-y-2">
              {LEVELS.map((l) => (
                <label key={l.id} className="flex gap-2 text-sm">
                  <input type="radio" name="level" checked={level === l.id} onChange={() => { setLevel(l.id); setOut(null); }} className="mt-1" />
                  <span>
                    {l.label}
                    <span className="block text-xs leading-relaxed text-ink-faint">{l.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <button onClick={() => void convert()} disabled={busy !== null} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60">
            {busy ?? 'Convert to PDF/A'}
          </button>
          {error && <p className="text-xs leading-relaxed text-accent">{error}</p>}
        </>
      }
      status={
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {pagesBefore} page{pagesBefore === 1 ? '' : 's'}, {formatBytes(file.size)}
          </p>
        </div>
      }
      actions={
        <>
          {out && (
            <DownloadButton href={out.url} filename={out.name}>
              Download PDF/A, {formatBytes(out.size)}
            </DownloadButton>
          )}
          <button onClick={() => { setFile(null); setOut(null); setError(null); }} className="text-sm text-ink-faint underline underline-offset-4">
            Use another PDF
          </button>
        </>
      }
    >
      {out ? (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Checked before you download</h2>
          <ul className="mt-3 divide-y divide-line">
            {out.checks.map((c) => (
              <li key={c.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <span className="flex items-baseline gap-2">
                  <span aria-hidden="true" className={c.ok ? 'text-green-600' : 'text-accent'}>{c.ok ? '✓' : '✕'}</span>
                  {c.label}
                </span>
                <span className="text-right text-ink-faint">{c.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            These are the things an archive&apos;s validator rejects first. A full validator such as veraPDF checks
            hundreds of rules; if a portal still refuses the file, the usual cause is something in the original that
            PDF/A forbids, like a video or a form script, and those are removed during conversion.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">
          <p>
            Converting embeds every font the PDF uses, attaches an sRGB colour profile, writes the PDF/A declaration
            and removes what the standard forbids: encryption, JavaScript, embedded media and links to outside files.
          </p>
          <p className="mt-3">The text stays text, and the pages look the same.</p>
        </div>
      )}
    </ToolLayout>
  );
}

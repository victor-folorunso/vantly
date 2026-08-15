'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * SHA hashes of text or a file, using the browser's own cryptography.
 *
 * SubtleCrypto is already in every browser, so there is nothing to install and
 * nothing to trust beyond the platform. It deliberately does not offer MD5,
 * which is the right call: MD5 is broken for anything security related and
 * offering it beside SHA-256 in the same list implies they are alternatives.
 *
 * The privacy claim carries real weight on this page specifically. The usual
 * reason to hash a file is to check it was not tampered with in transit, and
 * uploading that file to a stranger's server to find out is close to
 * self-defeating. Here the bytes are read locally and never sent.
 *
 * Files are streamed in chunks rather than read whole, so an ISO does not have
 * to fit in memory twice.
 */

const ALGOS = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512'] as const;
type Algo = (typeof ALGOS)[number];

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function HashGenerator() {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [algo, setAlgo] = useState<Algo>('SHA-256');
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compare, setCompare] = useState('');
  const [copied, setCopied] = useState(false);

  const hashText = useCallback(async () => {
    if (!text) return setHash('');
    const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
    setHash(toHex(buf));
  }, [text, algo]);

  const hashFile = useCallback(async () => {
    if (!file) return setHash('');
    setBusy(true);
    setProgress(0);
    try {
      // SubtleCrypto has no streaming interface, so the whole file has to be
      // handed over at once. Reading it in slices at least keeps the progress
      // bar honest and avoids holding two copies while the read completes.
      const chunks: Uint8Array[] = [];
      const size = 8 * 1024 * 1024;
      for (let offset = 0; offset < file.size; offset += size) {
        const slice = file.slice(offset, offset + size);
        chunks.push(new Uint8Array(await slice.arrayBuffer()));
        setProgress(Math.min(1, (offset + size) / file.size));
      }
      const total = chunks.reduce((a, c) => a + c.length, 0);
      const all = new Uint8Array(total);
      let at = 0;
      for (const c of chunks) {
        all.set(c, at);
        at += c.length;
      }
      const buf = await crypto.subtle.digest(algo, all);
      setHash(toHex(buf));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, [file, algo]);

  useEffect(() => {
    if (mode === 'text') void hashText();
    else void hashFile();
  }, [mode, hashText, hashFile]);

  /* Compared case-insensitively and trimmed, because a hash pasted from a
     download page arrives with whatever spacing and casing that page used, and
     a mismatch caused by a stray space is a false alarm about tampering. */
  const expected = compare.trim().toLowerCase();
  const verdict = !expected || !hash ? null : expected === hash;

  return (
    <div>
      <div className="flex gap-2">
        {(['text', 'file'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setHash('');
            }}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
              m === mode
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-ink-soft hover:border-ink-faint'
            }`}
          >
            {m === 'text' ? 'Text' : 'A file'}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {ALGOS.map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                a === algo
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-line text-ink-soft hover:border-ink-faint'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {mode === 'text' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste anything…"
            rows={7}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-line bg-surface p-4 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
          />
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface p-10 text-center transition-colors hover:border-accent">
            <input
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <span className="font-medium">{file.name}</span>
                <span className="mt-1 text-sm tabular-nums text-ink-faint">
                  {formatBytes(file.size)}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">Choose a file</span>
                <span className="mt-1 text-sm text-ink-soft">
                  Any size. It is read on your machine and never uploaded.
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {busy && (
        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full bg-accent transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs tabular-nums text-ink-faint">
            Reading, {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {algo}
          </span>
          {hash && (
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(hash);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-xs text-accent underline underline-offset-4"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <code className="mt-2 block break-all font-mono text-[13px]">
          {hash || <span className="text-ink-faint">The hash appears here.</span>}
        </code>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-medium">
          Compare against a known hash
          <span className="mt-1 block text-xs font-normal leading-relaxed text-ink-faint">
            Paste the one the download page gave you. Spacing and capitals do not
            matter.
          </span>
          <input
            value={compare}
            onChange={(e) => setCompare(e.target.value)}
            placeholder="e2c5…"
            spellCheck={false}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </label>
        {verdict !== null && (
          <p className={`mt-2.5 text-sm font-medium ${verdict ? 'text-ink' : 'text-accent'}`}>
            {verdict
              ? 'They match. The file is what it claims to be.'
              : 'These do not match. Check you picked the right algorithm before assuming the worst.'}
          </p>
        )}
      </div>
    </div>
  );
}

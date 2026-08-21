'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

/**
 * Moves subtitles earlier or later, and converts between SRT and VTT.
 *
 * Needs no video and no ffmpeg. A subtitle file is a list of timestamps and
 * some text, so the whole job is arithmetic on the timestamps.
 *
 * Handles both formats because they are the same file with two differences:
 * VTT separates seconds from milliseconds with a full stop where SRT uses a
 * comma, and VTT wants a WEBVTT line at the top. Mixing those up is why a
 * subtitle file loads with no subtitles in it.
 */

type Format = 'srt' | 'vtt';

type Cue = { index: number; start: number; end: number; text: string };

/** Reads 00:01:23,456 or 00:01:23.456, and the 01:23.456 shorthand VTT allows. */
function parseTime(value: string): number | null {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/.exec(value.trim());
  if (!m) return null;
  const [, h, mm, ss, ms] = m;
  return (
    Number(h ?? 0) * 3600000 +
    Number(mm) * 60000 +
    Number(ss) * 1000 +
    Number(ms.padEnd(3, '0'))
  );
}

function formatTime(ms: number, format: Format): string {
  const clamped = Math.max(0, Math.round(ms));
  const h = Math.floor(clamped / 3600000);
  const m = Math.floor((clamped % 3600000) / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const rest = clamped % 1000;
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  const separator = format === 'srt' ? ',' : '.';
  return `${pad(h)}:${pad(m)}:${pad(s)}${separator}${pad(rest, 3)}`;
}

function parse(source: string): { cues: Cue[]; error?: string } {
  // Strip a byte order mark and the VTT header, then split on blank lines.
  const cleaned = source.replace(/^﻿/, '').replace(/^WEBVTT.*\r?\n(?:.*\r?\n)*?\r?\n/, '');
  const blocks = cleaned.split(/\r?\n\s*\r?\n/).filter((b) => b.trim());
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    // A numbering line is optional in VTT and usual in SRT, so the timing line
    // is found rather than assumed to be second.
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at === -1) continue;

    const [from, to] = lines[at].split('-->').map((p) => p.trim().split(' ')[0]);
    const start = parseTime(from);
    const end = parseTime(to);
    if (start === null || end === null) {
      return { cues: [], error: `This timing line could not be read: "${lines[at].trim()}"` };
    }

    cues.push({
      index: cues.length + 1,
      start,
      end,
      text: lines.slice(at + 1).join('\n').trim(),
    });
  }

  if (cues.length === 0) return { cues: [], error: 'No subtitles were found in that.' };
  return { cues };
}

function write(cues: Cue[], format: Format, shiftMs: number, rate: number): string {
  const body = cues
    // A large negative shift pushes early subtitles before the start of the
    // film. Clamping both ends to zero would leave cues of no length, which
    // are in the file and never appear on screen, so they are dropped
    // instead and the count shown to the reader reflects it.
    .filter((c) => c.end * rate + shiftMs > 0)
    .map((c, i) => {
      const start = c.start * rate + shiftMs;
      const end = c.end * rate + shiftMs;
      const timing = `${formatTime(start, format)} --> ${formatTime(end, format)}`;
      return format === 'srt'
        ? `${i + 1}\n${timing}\n${c.text}`
        : `${timing}\n${c.text}`;
    })
    .join('\n\n');

  return format === 'vtt' ? `WEBVTT\n\n${body}\n` : `${body}\n`;
}

/* The classic pair. Film shot at 24 frames a second and played at 25 runs 4%
   fast, which is why a subtitle file can start in sync and drift a minute out
   by the end. Shifting alone never fixes that; the rate has to change. */
const RATES: { label: string; value: number }[] = [
  { label: 'Leave alone', value: 1 },
  { label: '23.976 to 25', value: 23.976 / 25 },
  { label: '25 to 23.976', value: 25 / 23.976 },
  { label: '24 to 25', value: 24 / 25 },
  { label: '25 to 24', value: 25 / 24 },
];

export default function SubtitleShifter() {
  const [source, setSource] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [rate, setRate] = useState(1);
  const [format, setFormat] = useState<Format>('srt');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { cues, error } = useMemo(() => (source.trim() ? parse(source) : { cues: [], error: undefined }), [source]);
  const output = useMemo(
    () => (cues.length ? write(cues, format, seconds * 1000, rate) : ''),
    [cues, format, seconds, rate],
  );

  // What survives the shift, which is what the reader actually gets.
  const kept = useMemo(
    () => cues.filter((c) => c.end * rate + seconds * 1000 > 0).length,
    [cues, rate, seconds],
  );

  const load = useCallback(async (file: File) => {
    setName(file.name);
    setFormat(/\.vtt$/i.test(file.name) ? 'vtt' : 'srt');
    setSource(await file.text());
  }, []);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <ToolLayout
      settings={
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Open a subtitle file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".srt,.vtt,text/plain"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }}
          />

          <label className="block text-sm">
            <span className={label}>Shift by</span>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={seconds}
                onChange={(e) => setSeconds(Number(e.target.value) || 0)}
                className="w-28 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
              />
              <span className="text-ink-soft">seconds</span>
            </div>
          </label>

          <label className="block text-sm">
            <span className={label}>Frame rate</span>
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-2 rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
            >
              {RATES.map((r) => (
                <option key={r.label} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
            {(['srt', 'vtt'] as Format[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={`rounded-md px-3 py-1.5 font-medium uppercase transition-colors ${
                  format === f ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      }
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <label className="block">
          <span className={label}>
            Subtitles in{name ? `, ${name}` : ''}
          </span>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={18}
            spellCheck={false}
            placeholder={'1\n00:00:02,000 --> 00:00:04,000\nPaste a subtitle file here.'}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={label}>
              {error
                ? 'Result'
                : kept === cues.length
                  ? `${cues.length} subtitle${cues.length === 1 ? '' : 's'}`
                  : `${kept} of ${cues.length}, the rest shifted before the start`}
            </span>
            {output && (
              <div className="flex gap-4 text-sm">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(output);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-accent underline underline-offset-4"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={URL.createObjectURL(new Blob([output], { type: 'text/plain' }))}
                  download={(name ?? 'subtitles').replace(/\.[^.]+$/, '') + '.' + format}
                  className="text-accent underline underline-offset-4"
                >
                  Download
                </a>
              </div>
            )}
          </div>

          {error ? (
            <p className="mt-2 rounded-xl border border-line bg-surface p-4 text-sm text-accent">{error}</p>
          ) : (
            <textarea
              value={output}
              readOnly
              rows={18}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
            />
          )}
        </div>
      </div>
    </ToolLayout>
  );
}

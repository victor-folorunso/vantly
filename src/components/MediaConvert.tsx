'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import { LICENCE_NOTE, LICENCE_URL, run, timecode } from '@/lib/ffmpeg';

/**
 * Audio and video work, all of it in the browser.
 *
 * One component behind every media page, because a format conversion, a trim
 * and a compress differ only in the arguments handed to ffmpeg and in which
 * controls are worth showing.
 *
 * The engine is downloaded the first time anything runs and cached afterwards.
 * That is said on the page before anybody starts, because a silent 30MB
 * download on a metered connection is a rude surprise, and because the wait
 * before the first conversion would otherwise look like a hang.
 */

export type Target = 'mp3' | 'wav' | 'ogg' | 'm4a' | 'mp4' | 'webm' | 'gif';
export type Mode = 'convert' | 'trim' | 'compress' | 'still';

const ACCEPT: Record<string, string> = {
  audio: 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus',
  video: 'video/*,.mp4,.mov,.webm,.mkv,.avi,.gifv',
  both: 'audio/*,video/*',
};

const MIME: Record<Target, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  gif: 'image/gif',
};

const AUDIO_TARGETS: Target[] = ['mp3', 'wav', 'ogg', 'm4a'];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaConvert({
  to,
  source = 'both',
  mode = 'convert',
}: {
  to: Target;
  source?: 'audio' | 'video' | 'both';
  mode?: Mode;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [ratio, setRatio] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  /* Options, only some of which are shown per mode. */
  const [bitrate, setBitrate] = useState('192k');
  const [quality, setQuality] = useState(28);
  const [width, setWidth] = useState(720);
  const [fps, setFps] = useState(12);
  const [from, setFrom] = useState(0);
  const [until, setUntil] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  /* The length is read by the browser rather than by ffmpeg, which is instant
     and avoids loading the engine just to fill in a trim box. */
  const readDuration = useCallback((f: File) => {
    const element = document.createElement(source === 'audio' ? 'audio' : 'video');
    element.preload = 'metadata';
    const url = URL.createObjectURL(f);
    element.onloadedmetadata = () => {
      if (Number.isFinite(element.duration)) {
        setDuration(element.duration);
        setUntil(element.duration);
      }
      URL.revokeObjectURL(url);
    };
    element.onerror = () => URL.revokeObjectURL(url);
    element.src = url;
  }, [source]);

  const pick = (f: File) => {
    setFile(f);
    setError(null);
    setOutUrl(null);
    setDuration(null);
    setFrom(0);
    setUntil(0);
    readDuration(f);
  };

  const args = useCallback(
    (input: string, output: string): string[] => {
      const seek = mode === 'trim' && (from > 0 || (duration !== null && until < duration))
        ? ['-ss', timecode(from), '-to', timecode(until)]
        : [];

      if (mode === 'still') {
        // A still picture plus audio. The picture is looped, the length comes
        // from the audio, and yuv420p is what players outside a browser need.
        return [
          '-loop', '1', '-i', 'cover.png', '-i', input,
          '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p',
          '-c:a', 'aac', '-b:a', bitrate, '-shortest', output,
        ];
      }

      if (to === 'gif') {
        return [
          ...seek, '-i', input,
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
          '-loop', '0', output,
        ];
      }

      if (AUDIO_TARGETS.includes(to)) {
        const codec =
          to === 'mp3' ? ['-c:a', 'libmp3lame', '-b:a', bitrate]
          : to === 'ogg' ? ['-c:a', 'libvorbis', '-q:a', '5']
          : to === 'm4a' ? ['-c:a', 'aac', '-b:a', bitrate]
          : []; // wav is uncompressed, so a bitrate would mean nothing
        return [...seek, '-i', input, '-vn', ...codec, output];
      }

      if (to === 'webm') {
        return [
          ...seek, '-i', input,
          '-c:v', 'libvpx', '-b:v', `${Math.round(4000 - quality * 100)}k`,
          '-c:a', 'libvorbis', output,
        ];
      }

      // mp4, whether converting or compressing. veryfast because this is
      // running in a browser tab and nobody is waiting twenty minutes for a
      // slightly smaller file.
      const scale = mode === 'compress' ? ['-vf', `scale=${width}:-2`] : [];
      return [
        ...seek, '-i', input,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(quality),
        ...scale, '-c:a', 'aac', '-b:a', '128k', output,
      ];
    },
    [mode, to, from, until, duration, bitrate, quality, width, fps],
  );

  const convert = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStage('Starting');
    setRatio(0);

    const result = await run(file, `out.${to}`, args, ({ stage: s, ratio: r }) => {
      setStage(s);
      setRatio(r);
    });

    setStage(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const blob = new Blob([result.data as BlobPart], { type: MIME[to] });
    setOutSize(blob.size);
    setOutUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  }, [file, to, args]);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
  const field =
    'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent';

  if (!file) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
        className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
        }`}
      >
        <p className="text-lg font-medium">
          Drop {source === 'audio' ? 'an audio file' : source === 'video' ? 'a video' : 'a file'} here
        </p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
          {mode === 'trim'
            ? 'Then choose where it should start and stop.'
            : mode === 'compress'
              ? 'Then pick how small you need it.'
              : `It comes back as ${to.toUpperCase()}.`}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Choose a file
        </button>
        <p className="mt-6 max-w-sm text-xs leading-relaxed text-ink-faint">
          The converter is about 30MB and downloads the first time you use it,
          then stays cached. Your file is not uploaded.
        </p>
        {error && <p className="mt-4 max-w-sm text-sm text-accent">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[source]}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs tabular-nums text-ink-faint">
            {formatBytes(file.size)}
            {duration !== null && ` · ${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`}
          </p>
        </div>
        <button
          onClick={() => { setFile(null); setOutUrl(null); setError(null); }}
          className="text-sm text-ink-faint underline underline-offset-4"
        >
          Use another file
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {mode === 'trim' && duration !== null && (
          <>
            <label className="block text-sm">
              <span className="flex justify-between">
                Start
                <span className="tabular-nums text-ink-faint">{timecode(from).slice(3)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={Math.floor(duration)}
                step={0.1}
                value={from}
                onChange={(e) => setFrom(Math.min(Number(e.target.value), until - 0.5))}
                className="mt-1.5 w-full accent-[var(--accent)]"
              />
            </label>
            <label className="block text-sm">
              <span className="flex justify-between">
                Stop
                <span className="tabular-nums text-ink-faint">{timecode(until).slice(3)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={Math.ceil(duration)}
                step={0.1}
                value={until}
                onChange={(e) => setUntil(Math.max(Number(e.target.value), from + 0.5))}
                className="mt-1.5 w-full accent-[var(--accent)]"
              />
            </label>
          </>
        )}

        {AUDIO_TARGETS.includes(to) && to !== 'wav' && (
          <label className="block text-sm">
            <span className={label}>Quality</span>
            <select value={bitrate} onChange={(e) => setBitrate(e.target.value)} className={field}>
              <option value="320k">320 kbps, best</option>
              <option value="256k">256 kbps</option>
              <option value="192k">192 kbps, good</option>
              <option value="128k">128 kbps, smaller</option>
              <option value="96k">96 kbps, speech</option>
            </select>
          </label>
        )}

        {(to === 'mp4' || to === 'webm') && (
          <label className="block text-sm">
            <span className="flex justify-between">
              Quality
              <span className="tabular-nums text-ink-faint">
                {quality <= 22 ? 'High' : quality <= 30 ? 'Balanced' : 'Small'}
              </span>
            </span>
            <input
              type="range"
              min={18}
              max={38}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>
        )}

        {(to === 'gif' || mode === 'compress') && (
          <label className="block text-sm">
            <span className={label}>Width</span>
            <select
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className={field}
            >
              {[1920, 1280, 960, 720, 480, 320].map((w) => (
                <option key={w} value={w}>
                  {w} pixels
                </option>
              ))}
            </select>
          </label>
        )}

        {to === 'gif' && (
          <label className="block text-sm">
            <span className="flex justify-between">
              Frames a second
              <span className="tabular-nums text-ink-faint">{fps}</span>
            </span>
            <input
              type="range"
              min={5}
              max={25}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={() => void convert()}
          disabled={stage !== null}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {stage ?? (mode === 'trim' ? 'Trim it' : mode === 'compress' ? 'Compress' : 'Convert')}
        </button>

        {outUrl && (
          <DownloadButton href={outUrl} filename={file.name.replace(/\.[^.]+$/, '') + '.' + to} variant="quiet">
            Download, {formatBytes(outSize)}
          </DownloadButton>
        )}

        {outUrl && mode === 'compress' && (
          <p className="text-sm tabular-nums text-ink-soft">
            {Math.max(0, Math.round((1 - outSize / file.size) * 100))}% smaller
          </p>
        )}
      </div>

      {stage && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs tabular-nums text-ink-faint">
            {stage}
            {ratio > 0 && ` · ${Math.round(ratio * 100)}%`}
          </p>
        </div>
      )}

      {error && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent">{error}</p>}

      {outUrl && (
        <div className="mt-6">
          <span className={label}>Result</span>
          {to === 'gif' ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={outUrl} alt="The converted result" className="mt-2 max-w-full rounded-xl border border-line" />
          ) : AUDIO_TARGETS.includes(to) ? (
            <audio src={outUrl} controls className="mt-2 w-full" />
          ) : (
            <video src={outUrl} controls className="mt-2 w-full rounded-xl border border-line" />
          )}
        </div>
      )}

      <p className="mt-8 max-w-2xl border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
        {LICENCE_NOTE}{' '}
        <a
          href={LICENCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4"
        >
          Its licence
        </a>
        .
      </p>
    </div>
  );
}

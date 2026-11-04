'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { rememberSong, solfaAvailable, songHref, uploadSong } from '@/lib/solfa/api';
import { NOTE_NAMES } from '@/lib/solfa/solfa';

/**
 * Choose a song and send it to be transcribed.
 *
 * One file, not a batch like the other drop zones on the site: each song
 * takes minutes of GPU time and opens in its own player, so a queue of ten
 * would only be ten pages to wait on. The player opens as soon as the upload
 * lands, and the song plays while the solfa fills in.
 *
 * The options are folded away. The defaults are right for nearly every song,
 * and three dropdowns in front of the button make a simple job look like a
 * form to fill in.
 */

const MAX_MB = 60;
const ACCEPT = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.webm,.mp4';

const field = 'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent';
const label = 'block text-sm text-ink-soft';

export default function SongUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [doKey, setDoKey] = useState('');
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function choose(f: File | null | undefined) {
    setError('');
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setError(`That file is ${(f.size / 1048576).toFixed(0)} MB. The limit is ${MAX_MB} MB.`);
      return;
    }
    setFile(f ?? null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const job = await uploadSong(file, { seconds, do: doKey, voiceOnly });
      rememberSong(job.id);
      router.push(songHref(job.id));
    } catch (e) {
      setError(`Upload failed: ${(e as Error).message}`);
      setUploading(false);
    }
  }

  if (!solfaAvailable) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <p className="font-medium">The transcription service is not switched on yet.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Turning a song into solfa needs a GPU server, which is being set up. The guides below
          work today, and so does the{' '}
          <Link href="/tonic-solfa-converter" className="text-accent underline underline-offset-4">
            tonic solfa converter
          </Link>{' '}
          for notes you already know.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label
        className={`grid cursor-pointer gap-1 rounded-2xl border-2 bg-surface px-6 py-7 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
          dragging || file ? 'border-solid border-accent' : 'border-dashed border-line hover:border-accent'
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer?.files[0]);
        }}
      >
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept={ACCEPT}
          onChange={(e) => choose(e.currentTarget.files?.[0])}
        />
        {file ? (
          <>
            <strong className="text-lg font-semibold [overflow-wrap:anywhere]">{file.name}</strong>
            <span className="text-sm text-ink-soft">
              {(file.size / 1048576).toFixed(1)} MB. Choose a different file
            </span>
          </>
        ) : (
          <>
            <strong className="text-lg font-semibold">Choose a song</strong>
            <span className="text-sm text-ink-soft">
              or drop it here. MP3, WAV, M4A, OGG or FLAC, up to {MAX_MB} MB
            </span>
          </>
        )}
      </label>

      <details className="group">
        <summary className="w-max cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
          Options
        </summary>
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          <label className={label}>
            How much of the song
            <select value={seconds} onChange={(e) => setSeconds(+e.target.value)} className={field}>
              <option value={0}>The whole song</option>
              <option value={60}>The first minute</option>
              <option value={120}>The first two minutes</option>
            </select>
          </label>
          <label className={label}>
            Key
            <select value={doKey} onChange={(e) => setDoKey(e.target.value)} className={field}>
              <option value="">Work it out for me</option>
              {NOTE_NAMES.map((name) => (
                <option key={name} value={name}>
                  do = {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={voiceOnly}
              onChange={(e) => setVoiceOnly(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Only a voice, no instruments
          </label>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="submit"
          disabled={!file || uploading}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-transform hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {uploading ? 'Uploading…' : 'Make the solfa'}
        </button>
        <p className="text-sm text-ink-faint">
          The song starts playing straight away. The solfa fills in as it is worked out.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

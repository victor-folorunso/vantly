'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  deleteJob,
  describeJob,
  forgetSong,
  listJobs,
  listsEverySong,
  rememberedSongs,
  solfaAvailable,
  songHref,
  type Job,
} from '@/lib/solfa/api';

/**
 * The songs uploaded from this browser, with where each one is.
 *
 * There are no accounts, so the list is the ids this browser remembers, and
 * the server is asked about those ids only. Against the local server every
 * song is shown, since every song there is yours.
 *
 * Deleting removes the song and its solfa from the server, which is what the
 * privacy page promises is possible.
 */

const when = (job: Job) =>
  new Date(job.created * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const progress = (job: Job) =>
  job.total_seconds ? Math.round((100 * (job.processed_seconds ?? 0)) / job.total_seconds) : 0;

export default function YourSongs() {
  const [jobs, setJobs] = useState<Job[] | null>(solfaAvailable ? null : []);
  const [offline, setOffline] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const ids = rememberedSongs();
    try {
      const found = await listJobs(listsEverySong ? 'all' : ids);
      // The browser's order, newest first; the server's for anything it adds.
      const order = new Map(ids.map((id, i) => [id, i]));
      found.sort(
        (a, b) => (order.get(a.id) ?? -1) - (order.get(b.id) ?? -1) || b.created - a.created,
      );
      setJobs(found);
      setOffline(false);
    } catch {
      setOffline(true); // server restarting or unreachable; the next tick retries
    }
  }, []);

  useEffect(() => {
    if (!solfaAvailable) return;
    const first = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 2000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function remove(id: string) {
    try {
      await deleteJob(id);
      forgetSong(id);
      setJobs((list) => list?.filter((j) => j.id !== id) ?? null);
    } catch (e) {
      alert(`Could not delete it: ${(e as Error).message}`);
    }
    setConfirming(null);
  }

  return (
    <>
      {offline && (
        <p role="status" className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm">
          Can&apos;t reach the transcription service. Retrying…
        </p>
      )}

      {jobs === null ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="text-ink-soft">
          No songs from this browser yet.{' '}
          <Link href="/song-to-tonic-solfa" className="text-accent underline underline-offset-4">
            Upload one
          </Link>{' '}
          to get its tonic solfa.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-start justify-between gap-4 py-4">
              <div className="grid min-w-0 flex-1 gap-1">
                {job.player_ready ? (
                  <Link
                    href={songHref(job.id)}
                    className="text-lg font-semibold [overflow-wrap:anywhere] hover:text-accent"
                  >
                    {job.name}
                  </Link>
                ) : (
                  <span className="text-lg font-semibold [overflow-wrap:anywhere]">{job.name}</span>
                )}
                <span
                  className={`text-sm ${job.status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-ink-soft'}`}
                >
                  {describeJob(job)}
                </span>
                {job.status === 'running' && (
                  <div
                    role="progressbar"
                    aria-valuenow={progress(job)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Transcribed so far"
                    className="h-1.5 max-w-sm overflow-hidden rounded bg-line"
                  >
                    <i className="block h-full bg-accent transition-[width] duration-500" style={{ width: `${progress(job)}%` }} />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <time dateTime={new Date(job.created * 1000).toISOString()} className="whitespace-nowrap text-sm text-ink-soft">
                  {when(job)}
                </time>
                {confirming === job.id ? (
                  <span className="flex gap-3 text-sm">
                    <button onClick={() => remove(job.id)} className="font-semibold text-red-700 dark:text-red-400">
                      Delete it
                    </button>
                    <button onClick={() => setConfirming(null)} className="text-ink-soft">
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirming(job.id)}
                    disabled={job.status === 'running' || job.status === 'queued'}
                    title={
                      job.status === 'running' || job.status === 'queued'
                        ? 'A song can be deleted once it has finished'
                        : undefined
                    }
                    className="text-sm text-ink-soft hover:text-accent disabled:opacity-40"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Calling the song to solfa service.
 *
 * The service separates the singer from the band and transcribes the voice
 * with a singing model, which needs a GPU, so this is one of the tools that
 * sends the file to a server (sendsFile in site.ts). The service lives in its
 * own repository, solfaflow: prototype/modal_app.py is the deployed one, on
 * Modal beside the conversion service, and prototype/server.py runs the same
 * API on one machine.
 *
 * NEXT_PUBLIC_SOLFA_URL wins when set. Otherwise a build uses the deployed
 * service (public anyway, as with convert.ts), and development uses the server
 * on this machine, so `npm run dev` beside a running server just works.
 *
 * There are no accounts, so "your songs" means the songs uploaded from this
 * browser. Their ids are remembered in localStorage, and the server only
 * answers for ids it is asked about: nobody can list anybody else's songs.
 */
import { formatTime, type SolfaResult } from './solfa';

const DEV_URL = 'http://127.0.0.1:8765';
const DEPLOYED_URL = 'https://victorfolorunsoofficial--solfaflow-web.us-east.modal.run';

export const SOLFA_URL = (
  process.env.NEXT_PUBLIC_SOLFA_URL ||
  (process.env.NODE_ENV === 'development' ? DEV_URL : DEPLOYED_URL)
).replace(/\/$/, '');

export const solfaAvailable = SOLFA_URL.length > 0;

/** Only the server on this machine lists every song (SOLFAFLOW_LIST_ALL); every song there is yours. */
export const listsEverySong = SOLFA_URL === DEV_URL;

export interface Job {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'done' | 'error';
  stage: string;
  created: number;
  started?: number;
  finished?: number;
  error?: string;
  player_ready?: boolean;
  chunk?: number;
  chunks?: number;
  processed_seconds?: number;
  total_seconds?: number;
  queue_position?: number | null;
  do?: string | null;
  notes?: number;
  audio_seconds?: number;
}

/** One line on where a song is in the queue or pipeline. */
export function describeJob(job: Job): string {
  if (job.status === 'done') {
    const length = job.audio_seconds ? `${formatTime(job.audio_seconds)} long, ` : '';
    return `Ready. ${length}do = ${job.do ?? '?'}`;
  }
  if (job.status === 'error') return job.error ?? 'Stopped before finishing.';
  if (job.status === 'queued')
    return `Waiting for ${job.queue_position === 1 ? 'the song ahead' : 'the songs ahead'} to finish`;
  if (job.total_seconds)
    return `Solfa ready up to ${formatTime(job.processed_seconds ?? 0)} of ${formatTime(job.total_seconds)}`;
  return 'Getting started';
}

/** A song the server knows about that has no solfa yet is still being worked on, not missing. */
export const isPending = (job: Job) => job.status === 'queued' || job.status === 'running';

export interface UploadOptions {
  seconds: number; // 0 = whole song
  do: string; // '' = detect
  voiceOnly: boolean;
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      detail = (await response.json()).detail ?? detail;
    } catch {
      // not JSON; keep the status text
    }
    throw new Error(detail);
  }
  return response.json();
}

/**
 * The songs with these ids. 'all' asks for every song, which the server only
 * answers when it is told to (a local server, where every song is yours).
 */
export async function listJobs(ids: string[] | 'all'): Promise<Job[]> {
  if (ids !== 'all' && ids.length === 0) return [];
  const query = ids === 'all' ? '' : `?ids=${ids.map(encodeURIComponent).join(',')}`;
  return json(await fetch(`${SOLFA_URL}/api/jobs${query}`));
}

export async function getJob(id: string): Promise<Job> {
  return json(await fetch(`${SOLFA_URL}/api/jobs/${encodeURIComponent(id)}`));
}

export async function deleteJob(id: string): Promise<void> {
  await json(await fetch(`${SOLFA_URL}/api/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}

export async function uploadSong(file: File, options: UploadOptions): Promise<Job> {
  const body = new FormData();
  body.append('file', file);
  body.append('seconds', String(options.seconds));
  body.append('do', options.do);
  body.append('skip_separation', String(options.voiceOnly));
  return json(await fetch(`${SOLFA_URL}/api/jobs`, { method: 'POST', body }));
}

export function resultUrl(id: string, file: string): string {
  return `${SOLFA_URL}/results/${encodeURIComponent(id)}/${file}`;
}

export async function getResult(id: string): Promise<SolfaResult> {
  return json(await fetch(`${resultUrl(id, 'solfa.json')}?t=${Date.now()}`, { cache: 'no-store' }));
}

// ── Songs from this browser ─────────────────────────────────────────────────

const SONGS_KEY = 'vantly.solfa.songs';

/** Newest first. Empty when storage is blocked, which only costs the list. */
export function rememberedSongs(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(SONGS_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveSongs(ids: string[]) {
  try {
    localStorage.setItem(SONGS_KEY, JSON.stringify(ids));
  } catch {
    // private window or storage blocked: the song still works from its link
  }
}

export const rememberSong = (id: string) =>
  saveSongs([id, ...rememberedSongs().filter((x) => x !== id)]);
export const forgetSong = (id: string) => saveSongs(rememberedSongs().filter((x) => x !== id));

/** Where a song's player lives. A query string, because a static export cannot know song ids in advance. */
export const songHref = (id: string) => `/song-to-tonic-solfa/song/?id=${encodeURIComponent(id)}`;

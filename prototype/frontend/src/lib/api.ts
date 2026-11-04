// Client for the Python server (prototype/server.py).
import { formatTime, type SolfaResult } from './solfa.ts';

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
	if (job.status === 'queued') return `Waiting for ${job.queue_position === 1 ? 'the song ahead' : 'the songs ahead'} to finish`;
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

export async function listJobs(): Promise<Job[]> {
	return json(await fetch('/api/jobs'));
}

export async function getJob(id: string): Promise<Job> {
	return json(await fetch(`/api/jobs/${encodeURIComponent(id)}`));
}

export async function uploadSong(file: File, options: UploadOptions): Promise<Job> {
	const body = new FormData();
	body.append('file', file);
	body.append('seconds', String(options.seconds));
	body.append('do', options.do);
	body.append('skip_separation', String(options.voiceOnly));
	return json(await fetch('/api/jobs', { method: 'POST', body }));
}

export function resultUrl(id: string, file: string): string {
	return `/results/${encodeURIComponent(id)}/${file}`;
}

export async function getResult(id: string): Promise<SolfaResult> {
	return json(await fetch(`${resultUrl(id, 'solfa.json')}?t=${Date.now()}`, { cache: 'no-store' }));
}

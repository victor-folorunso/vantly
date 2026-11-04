// Downloads that keep the exact note times: plain-text solfa (to send on WhatsApp or print)
// and a MIDI file (for keyboards, DAWs and notation programs, which quantise it themselves).

import { chordName, chordTones, formatTime, layoutSheet, syllable, type Chord, type Note } from './solfa.ts';

export interface TextSheetOptions {
	title: string;
	keyLine: string;
	pitches: number[];
	home: number;
	shift: number;
}

export function toText(notes: Note[], chords: Chord[], o: TextSheetOptions): string {
	const lines = [o.title, o.keyLine, 'Made with SolfaFlow. Transcription is automatic: check it by ear.', ''];
	for (const phrase of layoutSheet(notes, chords)) {
		const words = phrase.items.map((item) => {
			if (item.kind === 'rest') return '-';
			if (item.kind === 'chord') return `[${chordName(item.chord, o.shift)}]`;
			const { syl, mark } = syllable(o.pitches[item.index], o.home);
			return (item.chordAbove ? `[${chordName(item.chordAbove, o.shift)}] ` : '') + syl + mark;
		});
		lines.push(`${formatTime(phrase.start).padStart(5)}  ${words.join(' ')}`);
	}
	return lines.join('\n') + '\n';
}

// ---- MIDI ----

const TICKS_PER_BEAT = 480;
const TEMPO_BPM = 120; // seconds map to ticks exactly at this tempo
const TICKS_PER_SECOND = (TICKS_PER_BEAT * TEMPO_BPM) / 60;
const CHORD_BASE = 48; // C3, as the synth voices chords

function vlq(n: number): number[] {
	const bytes = [n & 0x7f];
	while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80);
	return bytes;
}

interface MidiEvent {
	tick: number;
	bytes: number[];
	order: number; // note-offs before note-ons at the same tick
}

function track(name: string, events: MidiEvent[], extra: number[] = []): number[] {
	const nameBytes = [...new TextEncoder().encode(name)];
	const data = [0, 0xff, 0x03, ...vlq(nameBytes.length), ...nameBytes, ...extra];
	let last = 0;
	for (const e of [...events].sort((a, b) => a.tick - b.tick || a.order - b.order)) {
		data.push(...vlq(e.tick - last), ...e.bytes);
		last = e.tick;
	}
	data.push(0, 0xff, 0x2f, 0);
	const n = data.length;
	return [0x4d, 0x54, 0x72, 0x6b, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255, ...data];
}

const tick = (seconds: number) => Math.max(0, Math.round(seconds * TICKS_PER_SECOND));

function noteEvents(start: number, end: number, pitch: number, channel: number, velocity: number): MidiEvent[] {
	const on = tick(start);
	const off = Math.max(tick(end), on + 1);
	return [
		{ tick: on, bytes: [0x90 | channel, pitch, velocity], order: 1 },
		{ tick: off, bytes: [0x80 | channel, pitch, 0], order: 0 }
	];
}

/** A two-track MIDI file: the melody, and the chords (if any) as triads from C3. */
export function toMidi(notes: Note[], pitches: number[], chords: Chord[], shift = 0): Uint8Array {
	const tempo = Math.round(60_000_000 / TEMPO_BPM);
	const setTempo = [0, 0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255];
	const melody = notes.flatMap((n, i) => noteEvents(n.start, n.end, pitches[i] + shift, 0, 96));
	const tracks = [track('Melody', melody, setTempo)];
	if (chords.length) {
		const harmony = chords.flatMap((c) =>
			chordTones(c).flatMap((pc) => noteEvents(c.start, c.end, CHORD_BASE + ((pc + shift + 12) % 12), 1, 64))
		);
		tracks.push(track('Chords', harmony, [0, 0xc1, 0])); // piano on channel 2
	}
	const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, TICKS_PER_BEAT >> 8, TICKS_PER_BEAT & 255];
	return new Uint8Array([...header, ...tracks.flat()]);
}

/** Save a file from the browser. */
export function download(filename: string, data: string | Uint8Array, type: string): void {
	const blob = new Blob([data as BlobPart], { type });
	const url = URL.createObjectURL(blob);
	const a = Object.assign(document.createElement('a'), { href: url, download: filename });
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A safe file name from a song title. */
export const fileStem = (title: string) =>
	title.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'song';

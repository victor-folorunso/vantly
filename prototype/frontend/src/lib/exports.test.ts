import { describe, expect, it } from 'vitest';
import { fileStem, toMidi, toText } from './exports.ts';
import type { Chord, Note } from './solfa.ts';

const notes: Note[] = [
	{ start: 0, end: 0.5, pitch_midi: 64 },
	{ start: 0.5, end: 1, pitch_midi: 62 },
	{ start: 2, end: 2.5, pitch_midi: 72 }
];
const pitches = notes.map((n) => n.pitch_midi);
const chords: Chord[] = [{ start: 0, end: 2.5, root: 0, quality: 'maj' }];

describe('text sheet', () => {
	it('writes one line per phrase with chords and octave marks', () => {
		const text = toText(notes, chords, { title: 'Song', keyLine: 'do = C', pitches, home: 60, shift: 0 });
		const lines = text.split('\n');
		expect(lines[0]).toBe('Song');
		expect(lines[1]).toBe('do = C');
		expect(lines[4]).toBe(' 0:00  [C] mi re');
		expect(lines[5]).toBe(" 0:02  do'");
	});
});

describe('MIDI file', () => {
	it('has a header, a melody track and a chord track with exact timing', () => {
		const midi = toMidi(notes, pitches, chords);
		expect(String.fromCharCode(...midi.slice(0, 4))).toBe('MThd');
		expect(midi[11]).toBe(2); // two tracks
		const text = Array.from(midi, (b) => String.fromCharCode(b)).join('');
		expect(text.split('MTrk').length - 1).toBe(2);
		// The second melody note starts 0.5 s = 480 ticks (two VLQ bytes: 0x83 0x60) after the first ends.
		const firstOff = [0x80, 64, 0];
		const index = midi.findIndex((_, i) => firstOff.every((b, k) => midi[i + k] === b));
		expect(Array.from(midi.slice(index + 3, index + 6))).toEqual([0, 0x90, 62]);
	});

	it('moves notes with the key shift', () => {
		const midi = toMidi(notes.slice(0, 1), [64], [], 2);
		expect(Array.from(midi).includes(66)).toBe(true);
	});
});

it('makes a safe file name', () => {
	expect(fileStem('Let it go: "Frozen"/Malay')).toBe('Let it go FrozenMalay');
});

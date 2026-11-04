import { describe, expect, it } from 'vitest';
import { beatGrid, scaleBeats, buildStaff, keyTitle, pitchName, spell, stepAt, toAbc, toMusicXml } from './notation.ts';
import { chordName, type Chord } from './solfa.ts';

const beats = Array.from({ length: 40 }, (_, i) => 0.25 + i * 0.5); // 120 bpm, first beat at 0.25 s
const rhythm = { tempo_bpm: 120, beats };
const note = (beat: number, length: number) => ({ start: 0.25 + beat * 0.5, end: 0.25 + (beat + length) * 0.5 - 0.02 });

describe('beat grid', () => {
	it('extends to the start of the song and maps times to sixteenth steps', () => {
		const grid = beatGrid(rhythm, 20);
		expect(grid[0]).toBeLessThanOrEqual(0);
		expect(stepAt(grid, 0.25) - stepAt(grid, grid[0])).toBeCloseTo(4);
		expect(stepAt(grid, 0.375) - stepAt(grid, 0.25)).toBeCloseTo(1);
	});

	it('doubles or halves the beat', () => {
		expect(scaleBeats({ tempo_bpm: 60, beats: [0, 1, 2, 3] }, 2)).toEqual({ tempo_bpm: 120, beats: [0, 0.5, 1, 1.5, 2, 2.5, 3] });
		expect(scaleBeats({ tempo_bpm: 60, beats: [0, 1, 2, 3] }, 0.5)).toEqual({ tempo_bpm: 30, beats: [0, 2] });
	});

	it('falls back to an even beat when none were found', () => {
		const grid = beatGrid({}, 3);
		expect(grid[1] - grid[0]).toBeCloseTo(0.6);
	});
});

describe('staff', () => {
	// Mary had a little lamb: mi re do re | mi mi mi(half) | re re re(half) |
	const tune = [64, 62, 60, 62, 64, 64, 64, 62, 62, 62];
	const lengths = [1, 1, 1, 1, 1, 1, 2, 1, 1, 2];
	let at = 0;
	const notes = lengths.map((l) => {
		const n = note(at, l);
		at += l;
		return n;
	});

	it('writes quarter and half notes in 4/4 bars', () => {
		const staff = buildStaff(notes, tune, [], rhythm, 20, 0, false, 4);
		expect(staff.bars.length).toBe(3);
		expect(staff.bars.map((bar) => bar.map((n) => n.steps))).toEqual([[4, 4, 4, 4], [4, 4, 8], [4, 4, 8]]);
		expect(staff.barTimes[1]).toBeCloseTo(0.25 + 4 * 0.5);
	});

	it('starts with a pickup and ties a note across the bar line', () => {
		// The first note is on the last beat of the bar and lasts two beats.
		const staff = buildStaff([note(3, 2)], [67], [], rhythm, 20, 0, false, 4, 3);
		const [first, second] = staff.bars;
		expect(first.map((n) => n.pitch)).toEqual([null, 67]);
		expect(first.at(-1)).toMatchObject({ pitch: 67, steps: 4, tie: true });
		expect(second[0]).toMatchObject({ pitch: 67, steps: 4, tie: false });
	});

	it('holds a note over a breath shorter than a beat, but writes a longer gap as a rest', () => {
		const sung = [
			{ start: 0.25, end: 0.6 }, // a quarter sung short
			{ start: 0.75, end: 1.2 },
			{ start: 2.25, end: 2.7 } // after a gap of two beats
		];
		const staff = buildStaff(sung, [60, 62, 64], [], rhythm, 10, 0, false, 4);
		expect(staff.bars[0].map((n) => [n.pitch, n.steps])).toEqual([[60, 4], [62, 4], [null, 8]]);
	});

	it('puts a chord symbol on the note where the chord starts', () => {
		const chord: Chord = { start: notes[4].start, end: 5, root: 7, quality: 'maj' };
		const staff = buildStaff(notes, tune, [chord], rhythm, 20, 0, false, 4);
		expect(staff.bars[1][0].chord).toBe(chord);
	});
});

describe('spelling', () => {
	it('uses the key signature and raised chromatics', () => {
		expect(pitchName(66, 7)).toBe('F#'); // ti in G
		expect(pitchName(70, 5)).toBe('Bb'); // fa in F
		expect(pitchName(71, 5)).toBe('B'); // fi in F
		expect(pitchName(61, 0)).toBe('C#'); // di in C
		expect(spell(60, 0)).toEqual({ letter: 0, alter: 0, octave: 4 });
		expect(keyTitle(7, false)).toBe('G major');
		expect(keyTitle(0, true)).toBe('A minor');
		expect(keyTitle(3, false)).toBe('Eb major');
	});
});

describe('ABC and MusicXML', () => {
	const staff = buildStaff([note(0, 1), note(1, 1), note(2, 2)], [64, 66, 67], [], rhythm, 10, 0, false, 4);

	it('writes ABC with accidentals only where the key needs them', () => {
		const abc = toAbc(staff, 'Test', (c) => chordName(c));
		expect(abc).toContain('M:4/4');
		expect(abc).toContain('K:C');
		expect(abc).toContain('E4 ^F4 G8 |]');
		const inG = toAbc(buildStaff([note(0, 4)], [66], [], rhythm, 10, 7, false, 4), 'G', (c) => chordName(c));
		expect(inG).toContain('K:G');
		expect(inG).toContain('F16 |]'); // F# comes from the key signature
	});

	it('writes MusicXML with the key, metre and tied notes', () => {
		const tied = buildStaff([note(3, 2)], [67], [], rhythm, 10, 7, false, 4, 3);
		const music = toMusicXml(tied, 'A & B');
		expect(music).toContain('<work-title>A &amp; B</work-title>');
		expect(music).toContain('<fifths>1</fifths>');
		expect(music).toContain('<beats>4</beats>');
		expect(music).toContain('<step>G</step>');
		expect(music.match(/<tie type="start"\/>/g)).toHaveLength(1);
		expect(music.match(/<tie type="stop"\/>/g)).toHaveLength(1);
	});
});

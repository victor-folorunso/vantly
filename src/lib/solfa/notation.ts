// Staff notation for experts: the melody written in bars, as ABC (drawn by abcjs) and MusicXML.
// Unlike the solfa sheet, staff notation needs note lengths in beats, so note times are snapped
// to a beat grid found by the server (beats.py). The beat, the bar start and the metre are
// estimates; pitches are the same ones the solfa sheet shows.

import type { Chord } from './solfa';

export const STEPS_PER_BEAT = 4; // sixteenth notes
export type Meter = 2 | 3 | 4; // quarter-note beats per bar

export interface Rhythm {
  tempo_bpm?: number;
  beats?: number[];
}

export interface StaffNote {
  pitch: number | null; // null = rest
  start: number; // in steps from the first bar line
  steps: number;
  tie: boolean; // tied to the next note
  chord?: Chord;
}

export interface Staff {
  bars: StaffNote[][];
  meter: Meter;
  tempo: number;
  doPc: number;
  minor: boolean;
  clef: 'treble' | 'bass';
  /** Song time of each bar line, for following playback. */
  barTimes: number[];
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const FIFTHS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];
const DEFAULT_TEMPO = 100;
const BASS_CLEF_BELOW = 57; // a melody whose middle note is under A3 reads better in bass clef
const BARS_PER_LINE = 4;

// ---- Beat grid ----

/** Beat times covering the whole song, extended at both ends with the nearest beat spacing. */
export function beatGrid(rhythm: Rhythm, duration: number): number[] {
  let beats = (rhythm.beats ?? []).filter((t, i, all) => i === 0 || t > all[i - 1]);
  if (beats.length < 2) {
    const spacing = 60 / (rhythm.tempo_bpm || DEFAULT_TEMPO);
    beats = [0, spacing];
  }
  const grid = [...beats];
  const first = grid[1] - grid[0];
  while (grid[0] > 0) grid.unshift(grid[0] - first);
  const last = grid[grid.length - 1] - grid[grid.length - 2];
  while (grid[grid.length - 1] < duration + last) grid.push(grid[grid.length - 1] + last);
  return grid;
}

/** Beat trackers often lock onto half or double the felt beat; this corrects it. */
export function scaleBeats(rhythm: Rhythm, factor: 0.5 | 1 | 2): Rhythm {
  const beats = rhythm.beats ?? [];
  if (factor === 1) return rhythm;
  if (beats.length < 2) return { tempo_bpm: (rhythm.tempo_bpm ?? DEFAULT_TEMPO) * factor };
  const scaled =
    factor === 2
      ? beats.flatMap((t, i) => (i + 1 < beats.length ? [t, (t + beats[i + 1]) / 2] : [t]))
      : beats.filter((_, i) => i % 2 === 0);
  return { beats: scaled, tempo_bpm: rhythm.tempo_bpm ? rhythm.tempo_bpm * factor : undefined };
}

/** Position of time t on the grid, in steps from grid[0]. */
export function stepAt(grid: number[], t: number): number {
  let lo = 0;
  let hi = grid.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (grid[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return (lo + (t - grid[lo]) / (grid[lo + 1] - grid[lo])) * STEPS_PER_BEAT;
}

function timeAt(grid: number[], step: number): number {
  const beat = Math.min(Math.max(step / STEPS_PER_BEAT, 0), grid.length - 1);
  const i = Math.min(Math.floor(beat), grid.length - 2);
  return grid[i] + (beat - i) * (grid[i + 1] - grid[i]);
}

// ---- Quantising ----

interface Placed {
  pitch: number;
  start: number;
  end: number;
}

const SNAP_STEPS = 2; // note starts snap to eighth notes; sung timing is too loose for sixteenths
const LEGATO_STEPS = STEPS_PER_BEAT; // a breath shorter than a beat is not written as a rest

const snap = (step: number) => Math.round(step / SNAP_STEPS) * SNAP_STEPS;

function place(
  notes: { start: number; end: number }[],
  pitches: number[],
  grid: number[],
): Placed[] {
  const starts: number[] = [];
  notes.forEach((n) =>
    starts.push(Math.max(snap(stepAt(grid, n.start)), (starts.at(-1) ?? -Infinity) + 1)),
  );
  return notes.map((n, i) => {
    const start = starts[i];
    const next = starts[i + 1] ?? Infinity;
    let end = Math.max(snap(stepAt(grid, n.end)), start + SNAP_STEPS);
    if (next - end < LEGATO_STEPS) end = next; // held to the next note
    return { pitch: pitches[i], start, end: Math.min(end, next) };
  });
}

/** Note values that can be written as one note (sixteenth to whole, plain or dotted). */
const WRITABLE = [16, 12, 8, 6, 4, 3, 2, 1];

function pieces(steps: number, barSteps: number): number[] {
  const out: number[] = [];
  while (steps > 0) {
    const size = WRITABLE.find((w) => w <= steps && w <= barSteps) ?? 1;
    out.push(size);
    steps -= size;
  }
  return out;
}

export function buildStaff(
  notes: { start: number; end: number }[],
  pitches: number[],
  chords: Chord[],
  rhythm: Rhythm,
  duration: number,
  doPc: number,
  minor: boolean,
  meter: Meter,
  /** The beat of the bar (0 = the first) the first sung note falls on; songs with a pickup need 1 or more. */
  firstBeat = 0,
): Staff {
  const grid = beatGrid(rhythm, duration);
  const placed = place(notes, pitches, grid);
  const barSteps = meter * STEPS_PER_BEAT;
  const tempo = Math.round(rhythm.tempo_bpm || 60 / (grid[1] - grid[0]));
  const sorted = [...pitches].sort((a, b) => a - b);
  const clef =
    sorted.length && sorted[Math.floor(sorted.length / 2)] < BASS_CLEF_BELOW ? 'bass' : 'treble';
  const staff: Staff = { bars: [], meter, tempo, doPc, minor, clef, barTimes: [] };
  if (!placed.length) return staff;

  // Finding the bar line from the melody alone is unreliable (Mary's long notes fall on beat 3),
  // so bars start at the first sung note unless the reader says it is a pickup.
  const origin =
    (Math.floor(placed[0].start / STEPS_PER_BEAT) - (firstBeat % meter)) * STEPS_PER_BEAT;
  const last = placed[placed.length - 1].end;
  const barCount = Math.ceil((last - origin) / barSteps);

  // One continuous line of notes and rests from the first bar line, then cut at bar lines.
  const runs: { pitch: number | null; start: number; end: number }[] = [];
  let cursor = origin;
  for (const n of placed) {
    if (n.start > cursor) runs.push({ pitch: null, start: cursor, end: n.start });
    runs.push(n);
    cursor = n.end;
  }
  if (cursor < origin + barCount * barSteps)
    runs.push({ pitch: null, start: cursor, end: origin + barCount * barSteps });

  for (let b = 0; b < barCount; b++) {
    staff.bars.push([]);
    staff.barTimes.push(timeAt(grid, origin + b * barSteps));
  }
  for (const run of runs) {
    let at = run.start;
    while (at < run.end) {
      const bar = Math.floor((at - origin) / barSteps);
      const barEnd = origin + (bar + 1) * barSteps;
      const segmentEnd = Math.min(run.end, barEnd);
      const sizes =
        run.pitch === null && at === barEnd - barSteps && segmentEnd === barEnd
          ? [barSteps]
          : pieces(segmentEnd - at, barSteps);
      for (const size of sizes) {
        staff.bars[bar].push({
          pitch: run.pitch,
          start: at - origin,
          steps: size,
          tie: run.pitch !== null && at + size < run.end,
        });
        at += size;
      }
    }
  }

  // Chord symbols go on the note or rest sounding where the chord starts.
  const all = staff.bars.flat();
  for (const c of chords) {
    const step = Math.round(stepAt(grid, c.start)) - origin;
    const target = all.find((n) => n.start <= step && step < n.start + n.steps);
    if (target && !target.chord) target.chord = c;
  }
  return staff;
}

// ---- Spelling ----

interface Spelled {
  letter: number; // index into LETTERS
  alter: number; // -2 … 2
  octave: number;
}

const doLetter = (doPc: number) => LETTERS.indexOf(MAJOR_KEYS[doPc][0]);
const alterOf = (pc: number, letter: number) => ((mod12(pc) - NATURAL[letter] + 18) % 12) - 6;

/** Spell a pitch in the key: scale notes by the key, chromatic notes as raised scale notes (di ri fi si li). */
export function spell(pitch: number, doPc: number): Spelled {
  const rel = mod12(pitch - doPc);
  let degree = MAJOR_SCALE.indexOf(rel);
  if (degree < 0) degree = MAJOR_SCALE.indexOf(rel - 1);
  const letter = (doLetter(doPc) + degree) % 7;
  const alter = alterOf(pitch, letter);
  return { letter, alter, octave: Math.floor((pitch - alter) / 12) - 1 };
}

/** The sharp or flat the key signature gives a letter. */
function signatureAlter(letter: number, doPc: number): number {
  const degree = (letter - doLetter(doPc) + 7) % 7;
  return alterOf(doPc + MAJOR_SCALE[degree], letter);
}

const ACCIDENTAL_TEXT: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 0: '', 1: '#', 2: '##' };

export function pitchName(pitch: number, doPc: number): string {
  const s = spell(pitch, doPc);
  return LETTERS[s.letter] + ACCIDENTAL_TEXT[s.alter];
}

/** "G major" or, for a la-based minor tune with do = G, "E minor". */
export function keyTitle(doPc: number, minor: boolean): string {
  return minor ? `${pitchName(doPc + 9, doPc)} minor` : `${pitchName(doPc, doPc)} major`;
}

// ---- ABC (for abcjs) ----

const ABC_ACCIDENTAL: Record<number, string> = { [-2]: '__', [-1]: '_', 0: '=', 1: '^', 2: '^^' };

function abcPitch(s: Spelled): string {
  const letter = LETTERS[s.letter];
  if (s.octave >= 5) return letter.toLowerCase() + "'".repeat(s.octave - 5);
  return letter + ','.repeat(Math.max(0, 4 - s.octave));
}

const quote = (text: string) => text.replace(/["\\]/g, '');

export function toAbc(
  staff: Staff,
  title: string,
  chordName: (c: Chord) => string,
  shift = 0,
): string {
  const doPc = mod12(staff.doPc + shift);
  const key = staff.minor ? pitchName(doPc + 9, doPc) + 'm' : pitchName(doPc, doPc);
  const lines = [
    'X:1',
    ...(title ? [`T:${quote(title)}`] : []),
    `M:${staff.meter}/4`,
    'L:1/16',
    `Q:1/4=${staff.tempo}`,
    `K:${key}${staff.clef === 'bass' ? ' clef=bass' : ''}`,
  ];
  const bars = staff.bars.map((bar) => {
    const current = new Map<string, number>(); // accidentals carry to the end of the bar
    return bar
      .map((n) => {
        const symbol = n.chord ? `"${quote(chordName(n.chord))}"` : '';
        const length = n.steps === 1 ? '' : String(n.steps);
        if (n.pitch === null) return `${symbol}z${length}`;
        const s = spell(n.pitch + shift, doPc);
        const id = `${s.letter}/${s.octave}`;
        const sounding = current.get(id) ?? signatureAlter(s.letter, doPc);
        const accidental = s.alter === sounding ? '' : ABC_ACCIDENTAL[s.alter];
        current.set(id, s.alter);
        return `${symbol}${accidental}${abcPitch(s)}${length}${n.tie ? '-' : ''}`;
      })
      .join(' ');
  });
  for (let i = 0; i < bars.length; i += BARS_PER_LINE) {
    const end = i + BARS_PER_LINE >= bars.length ? ' |]' : ' |';
    lines.push(bars.slice(i, i + BARS_PER_LINE).join(' | ') + end);
  }
  return lines.join('\n') + '\n';
}

/** Which drawn line and bar-in-line holds bar b (abcjs labels bars this way). */
export const barPosition = (b: number) => ({
  line: Math.floor(b / BARS_PER_LINE),
  measure: b % BARS_PER_LINE,
});

// ---- MusicXML (for MuseScore, Sibelius, Finale, Dorico) ----

const TYPES: Record<number, [string, boolean]> = {
  1: ['16th', false],
  2: ['eighth', false],
  3: ['eighth', true],
  4: ['quarter', false],
  6: ['quarter', true],
  8: ['half', false],
  12: ['half', true],
  16: ['whole', false],
};

const xml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function toMusicXml(staff: Staff, title: string, shift = 0): string {
  const doPc = mod12(staff.doPc + shift);
  const barSteps = staff.meter * STEPS_PER_BEAT;
  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
    '<score-partwise version="4.0">',
    `  <work><work-title>${xml(title)}</work-title></work>`,
    '  <identification><encoding><software>Vantly song to tonic solfa</software></encoding></identification>',
    '  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>',
    '  <part id="P1">',
  ];
  let tiedIn = false;
  staff.bars.forEach((bar, b) => {
    out.push(`    <measure number="${b + 1}">`);
    if (b === 0) {
      const clef =
        staff.clef === 'bass' ? '<sign>F</sign><line>4</line>' : '<sign>G</sign><line>2</line>';
      out.push(
        `      <attributes><divisions>${STEPS_PER_BEAT}</divisions>` +
          `<key><fifths>${FIFTHS[doPc]}</fifths><mode>${staff.minor ? 'minor' : 'major'}</mode></key>` +
          `<time><beats>${staff.meter}</beats><beat-type>4</beat-type></time><clef>${clef}</clef></attributes>`,
        `      <direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit>` +
          `<per-minute>${staff.tempo}</per-minute></metronome></direction-type><sound tempo="${staff.tempo}"/></direction>`,
      );
    }
    for (const n of bar) {
      if (n.chord) {
        const root = spell(n.chord.root + shift + 60, doPc);
        out.push(
          `      <harmony><root><root-step>${LETTERS[root.letter]}</root-step>` +
            (root.alter ? `<root-alter>${root.alter}</root-alter>` : '') +
            `</root><kind>${n.chord.quality === 'min' ? 'minor' : 'major'}</kind></harmony>`,
        );
      }
      const whole = n.steps === barSteps && n.pitch === null;
      const [type, dotted] = TYPES[n.steps] ?? ['16th', false];
      let body = '';
      if (n.pitch === null) body = whole ? '<rest measure="yes"/>' : '<rest/>';
      else {
        const s = spell(n.pitch + shift, doPc);
        body = `<pitch><step>${LETTERS[s.letter]}</step>${s.alter ? `<alter>${s.alter}</alter>` : ''}<octave>${s.octave}</octave></pitch>`;
      }
      const ties =
        n.pitch === null ? [] : [...(tiedIn ? ['stop'] : []), ...(n.tie ? ['start'] : [])];
      out.push(
        '      <note>' +
          body +
          `<duration>${n.steps}</duration>` +
          ties.map((t) => `<tie type="${t}"/>`).join('') +
          '<voice>1</voice>' +
          (whole ? '' : `<type>${type}</type>${dotted ? '<dot/>' : ''}`) +
          (ties.length
            ? `<notations>${ties.map((t) => `<tied type="${t}"/>`).join('')}</notations>`
            : '') +
          '</note>',
      );
      tiedIn = n.pitch !== null && n.tie;
    }
    out.push('    </measure>');
  });
  out.push('  </part>', '</score-partwise>');
  return out.join('\n') + '\n';
}

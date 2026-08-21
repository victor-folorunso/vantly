'use client';

import { useMemo, useState } from 'react';

/**
 * Note names into tonic solfa, and back.
 *
 * Solfa is movable doh: doh is whatever the key is, so the same tune written
 * in C and in F has identical solfa and completely different note names. That
 * is the entire point of the notation and the thing a conversion has to get
 * right, so the key is a required choice rather than a setting hidden away.
 *
 * The spellings are the British ones a choir actually uses, doh ray me rather
 * than do re mi, because that is what the people who read solfa were taught.
 * Sharps are the e vowel, fe se le te, and flats are the a vowel, ma la ta.
 *
 * Octave marks follow the convention too: a raised mark for the octave above,
 * a lowered one for below, written here as an apostrophe and a comma since
 * those survive being pasted anywhere.
 */

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/* Each semitone above the tonic, named. The chromatic ones have two spellings
   depending on which way the line is moving; the rising one is used, which is
   the commoner case in a melody. */
const SOLFA = ['doh', 'de', 'ray', 're', 'me', 'fah', 'fe', 'soh', 'se', 'lah', 'le', 'te'];

const KEYS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F',
];

function noteToSemitone(raw: string): number | null {
  const m = /^([A-Ga-g])([#b♯♭]?)(\d?)$/.exec(raw.trim());
  if (!m) return null;
  const [, letter, accidental, octave] = m;
  const base = SHARP_NAMES.indexOf(letter.toUpperCase());
  if (base === -1) return null;
  const shift = accidental === '#' || accidental === '♯' ? 1 : accidental ? -1 : 0;
  const oct = octave ? Number(octave) : 4;
  return oct * 12 + base + shift;
}

function keyRoot(key: string): number {
  const sharp = SHARP_NAMES.indexOf(key);
  return sharp !== -1 ? sharp : FLAT_NAMES.indexOf(key);
}

/** Note names in, solfa out. */
function toSolfa(source: string, key: string): string {
  const root = keyRoot(key);
  return source
    .split(/(\s+|\||\/)/)
    .map((token) => {
      if (!token.trim() || token === '|' || token === '/') return token;
      const semitone = noteToSemitone(token);
      if (semitone === null) return token;

      const degree = ((semitone - root) % 12 + 12) % 12;
      // Which octave the note sits in relative to the doh nearest middle.
      const octave = Math.floor((semitone - root) / 12) - 4;
      const mark = octave > 0 ? "'".repeat(octave) : octave < 0 ? ','.repeat(-octave) : '';
      return SOLFA[degree] + mark;
    })
    .join('');
}

/** Solfa in, note names out. */
function fromSolfa(source: string, key: string, flats: boolean): string {
  const root = keyRoot(key);
  const names = flats ? FLAT_NAMES : SHARP_NAMES;

  return source
    .split(/(\s+|\||\/)/)
    .map((token) => {
      if (!token.trim() || token === '|' || token === '/') return token;
      const marks = /['’,]*$/.exec(token)?.[0] ?? '';
      const word = token.slice(0, token.length - marks.length).toLowerCase();

      // Both spellings accepted, because half the world writes do re mi.
      const alias: Record<string, string> = {
        do: 'doh', re: 'ray', re2: 're', mi: 'me', fa: 'fah', so: 'soh',
        sol: 'soh', la: 'lah', ti: 'te', si: 'te',
      };
      const wanted = alias[word] ?? word;
      const degree = SOLFA.indexOf(wanted);
      if (degree === -1) return token;

      const up = (marks.match(/['’]/g) ?? []).length;
      const down = (marks.match(/,/g) ?? []).length;
      const semitone = root + degree + (up - down) * 12;
      return names[((semitone % 12) + 12) % 12];
    })
    .join('');
}

export default function SolfaConverter() {
  const [direction, setDirection] = useState<'toSolfa' | 'toNotes'>('toSolfa');
  const [key, setKey] = useState('C');
  const [flats, setFlats] = useState(false);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () =>
      direction === 'toSolfa' ? toSolfa(input, key) : fromSolfa(input, key, flats),
    [input, key, direction, flats],
  );

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <div>
      <div className="flex flex-wrap items-end gap-5">
        <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
          {(
            [
              ['toSolfa', 'Notes to solfa'],
              ['toNotes', 'Solfa to notes'],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              onClick={() => {
                setDirection(id);
                setInput(output);
              }}
              aria-pressed={direction === id}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                direction === id ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <label className="block text-sm">
          <span className={label}>Key</span>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-2 rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
          >
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k} major
              </option>
            ))}
          </select>
        </label>

        {direction === 'toNotes' && (
          <label className="flex items-center gap-2 pb-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={flats}
              onChange={(e) => setFlats(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Write flats instead of sharps
          </label>
        )}
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Solfa is movable doh, so doh is whichever key you pick. The same tune in
        C and in F has the same solfa and different notes, which is why the key
        has to be set before any of this means anything.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <label className="block">
          <span className={label}>{direction === 'toSolfa' ? 'Notes' : 'Solfa'}</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder={
              direction === 'toSolfa'
                ? 'C D E F G A B C5\nor with bars:  C D E | F G A |'
                : "doh ray me fah soh lah te doh'"
            }
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-accent"
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={label}>{direction === 'toSolfa' ? 'Solfa' : 'Notes'}</span>
            {output.trim() && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(output);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm text-accent underline underline-offset-4"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            rows={14}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold">Marks</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            An apostrophe after a syllable means the octave above, a comma means
            the octave below. So doh, is the doh underneath and doh&rsquo; is the
            one above.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Notes between</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Sharpened notes take the e vowel, de fe se le, and flattened ones
            take the a vowel. A rising chromatic line is assumed, which is the
            commoner one in a melody.
          </p>
        </div>
      </div>
    </div>
  );
}

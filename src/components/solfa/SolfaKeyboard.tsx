import { NOTE_NAMES } from '@/lib/solfa/solfa';

/**
 * A strip of piano keys with the one to press lit.
 *
 * Widened to whole octaves from C, so the C labels always land on the same
 * key and a player can find their place by the black-key groups. The current
 * chord is lit softly in the lowest octave, where a left hand would play it.
 *
 * The keys stay ivory and black in dark mode. A dark "white key" stops
 * reading as a keyboard at all, and this is a picture of a real instrument.
 */

const isBlack = (m: number) => NOTE_NAMES[((m % 12) + 12) % 12].includes('#');

export default function SolfaKeyboard({
  range,
  active = null,
  chordTones = [],
  label = 'Keyboard',
}: {
  /** MIDI pitches the keyboard must include. */
  range: number[];
  /** The key sounding now. */
  active?: number | null;
  /** Pitch classes of the current chord. */
  chordTones?: number[];
  label?: string;
}) {
  const pitches = range.length ? range : [60, 71];
  let lo = Math.min(...pitches);
  let hi = Math.max(...pitches);
  lo -= ((lo % 12) + 12) % 12;
  hi += 11 - (((hi % 12) + 12) % 12);

  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const chordKeys = new Set(chordTones.map((pc) => lo + pc));
  const width = 100 / whites.length;

  const fill = (m: number, black: boolean) =>
    active === m
      ? 'var(--accent)'
      : chordKeys.has(m)
        ? black
          ? '#8a5a35'
          : '#f6d9bd'
        : black
          ? '#1c1a17'
          : '#fffdf8';

  return (
    <div
      role="img"
      aria-label={label}
      className="relative h-20 w-full touch-manipulation select-none"
      style={{ maxWidth: whites.length * 44 }}
    >
      {whites.map((m, i) => (
        <div key={m}>
          <div
            className="absolute top-0 h-full rounded-b-md border border-[#cfc9bf] transition-colors duration-75"
            style={{ left: `${i * width}%`, width: `${width}%`, background: fill(m, false) }}
          >
            {m % 12 === 0 && (
              <span className="absolute inset-x-0 bottom-1 text-center text-[10px] text-[#8a857d]">
                C{m / 12 - 1}
              </span>
            )}
          </div>
          {m + 1 <= hi && isBlack(m + 1) && (
            <div
              className="absolute top-0 z-10 h-[58%] rounded-b-md transition-colors duration-75"
              style={{
                left: `${(i + 1) * width - width * 0.3}%`,
                width: `${width * 0.6}%`,
                background: fill(m + 1, true),
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

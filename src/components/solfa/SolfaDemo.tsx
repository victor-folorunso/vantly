'use client';

import { useEffect, useState } from 'react';
import SolfaKeyboard from './SolfaKeyboard';

/**
 * What the player shows for a real song, playing on its own.
 *
 * "Mary had a little lamb, little lamb, little lamb" in C. Shown beside the
 * upload box so the result is visible before anybody has a song to try:
 * syllable, key name under it, the key lit below. Still under reduced motion,
 * where it just shows the first note.
 */

const PHRASE: [string, number][] = [
  ['mi', 64], ['re', 62], ['do', 60], ['re', 62], ['mi', 64], ['mi', 64], ['mi', 64],
  ['re', 62], ['re', 62], ['re', 62],
  ['mi', 64], ['so', 67], ['so', 67],
];
const BREAKS = new Set([7, 10]); // a breath before "little lamb"
const NAMES: Record<number, string> = { 60: 'C4', 62: 'D4', 64: 'E4', 67: 'G4' };
const STEP_MS = 520;

export default function SolfaDemo() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: number;
    let at = 0;
    const advance = () => {
      at = (at + 1) % (PHRASE.length + 2); // two beats of rest before it loops
      setCurrent(at);
      timer = window.setTimeout(advance, BREAKS.has(at) ? STEP_MS * 1.6 : STEP_MS);
    };
    timer = window.setTimeout(advance, STEP_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <figure className="grid gap-5 rounded-2xl bg-[#24201b] p-5 text-[#f5f2ec] shadow-sm sm:p-6">
      <figcaption className="text-sm text-[#b5afa4]">do = C</figcaption>
      <ol className="flex flex-wrap gap-1" aria-label="Mary Had a Little Lamb in tonic solfa">
        {PHRASE.map(([syl, midi], i) => (
          <li key={i} className={`flex ${BREAKS.has(i) ? 'ml-3' : ''}`}>
            <span
              className={`grid min-w-[2.6em] justify-items-center rounded-lg px-2 pb-1 pt-2 transition-colors ${
                i === current ? 'bg-[#f08c3a] text-[#1c1a17]' : ''
              }`}
            >
              <span className="text-2xl font-semibold leading-none">{syl}</span>
              <span className="mt-1 text-[11px] opacity-75">{NAMES[midi]}</span>
            </span>
          </li>
        ))}
      </ol>
      <SolfaKeyboard
        range={[60, 71]}
        active={PHRASE[current]?.[1] ?? null}
        label="The key to press lights up"
      />
    </figure>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * UUIDs and passwords.
 *
 * Both use crypto rather than Math.random, and that is the whole point rather
 * than a detail. Math.random is not seeded unpredictably and is not meant for
 * anything anybody relies on: a password generator built on it produces output
 * that looks random and is guessable. Most free generators online do exactly
 * that, and none of them say so.
 *
 * Everything is generated in the page. A password that arrived over the network
 * has been seen by whoever served it, which makes a server-side password
 * generator a contradiction.
 */

function randomInt(maxExclusive: number): number {
  // Rejection sampling. Taking a modulus of a random 32 bit number biases the
  // low values, which for a 62 character alphabet means some letters are
  // measurably likelier than others.
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let n = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return n % maxExclusive;
}

function CopyButton({ value, small = false }: { value: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`shrink-0 text-accent underline underline-offset-4 ${small ? 'text-xs' : 'text-sm'}`}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ── UUID ─────────────────────────────────────────────────────────────────── */

export function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [ids, setIds] = useState<string[]>([]);

  const make = useCallback(() => {
    const list = Array.from({ length: count }, () => crypto.randomUUID());
    setIds(list);
  }, [count]);

  useEffect(() => {
    make();
  }, [make]);

  const shown = useMemo(
    () =>
      ids.map((id) => {
        let out = hyphens ? id : id.replace(/-/g, '');
        return uppercase ? out.toUpperCase() : out;
      }),
    [ids, uppercase, hyphens],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            How many
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
            className="mt-2 w-28 rounded-lg border border-line bg-surface px-3 py-2 text-sm tabular-nums outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-sm">
          <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
          Hyphens
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-sm">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          Uppercase
        </label>
        <button
          onClick={make}
          className="ml-auto rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Generate again
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {shown.length} UUID{shown.length === 1 ? '' : 's'}
          </span>
          <CopyButton value={shown.join('\n')} small />
        </div>
        <ul className="max-h-[420px] divide-y divide-line overflow-auto">
          {shown.map((id, i) => (
            <li key={i} className="flex items-center justify-between gap-4 px-4 py-2">
              <code className="truncate font-mono text-[13px]">{id}</code>
              <CopyButton value={id} small />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Version 4. 122 of the 128 bits are random, which is enough that you
        will not see a collision.
      </p>
    </div>
  );
}

/* ── Password ─────────────────────────────────────────────────────────────── */

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
};

// Removed rather than merely flagged when "avoid lookalikes" is on.
const AMBIGUOUS = /[Il1O0]/g;

export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [use, setUse] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [password, setPassword] = useState('');

  const alphabet = useMemo(() => {
    let a = (Object.keys(SETS) as (keyof typeof SETS)[])
      .filter((k) => use[k])
      .map((k) => SETS[k])
      .join('');
    if (noAmbiguous) a = a.replace(AMBIGUOUS, '');
    return a;
  }, [use, noAmbiguous]);

  const make = useCallback(() => {
    if (!alphabet.length) return setPassword('');
    setPassword(
      Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join(''),
    );
  }, [alphabet, length]);

  useEffect(() => {
    make();
  }, [make]);

  /* Entropy from the alphabet and the length, which is the only honest measure
     for a random password. The "strength meters" that score a generated
     password by looking for dictionary words are answering a question about
     human-chosen passwords instead. */
  const bits = alphabet.length ? Math.floor(length * Math.log2(alphabet.length)) : 0;
  const verdict =
    bits >= 128 ? 'Overkill, in a good way' : bits >= 80 ? 'Strong' : bits >= 60 ? 'Reasonable' : 'Too weak';

  return (
    <div>
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center gap-4">
          <code className="min-w-0 flex-1 break-all font-mono text-lg">
            {password || 'Pick at least one character type'}
          </code>
          {password && <CopyButton value={password} />}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm">
            <span className="flex justify-between">
              Length
              <span className="tabular-nums text-ink-faint">{length}</span>
            </span>
            <input
              type="range"
              min={6}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--accent)]"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {(Object.keys(SETS) as (keyof typeof SETS)[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={use[k]}
                onChange={(e) => setUse((u) => ({ ...u, [k]: e.target.checked }))}
              />
              {k === 'digits' ? 'Numbers' : k === 'symbols' ? 'Symbols' : k === 'upper' ? 'A-Z' : 'a-z'}
            </label>
          ))}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={noAmbiguous}
              onChange={(e) => setNoAmbiguous(e.target.checked)}
            />
            No lookalikes
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          onClick={make}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Generate again
        </button>
        <p className="text-sm tabular-nums text-ink-soft">
          {bits} bits of entropy. <span className="text-ink-faint">{verdict}.</span>
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Never sent anywhere, which is the only way a generated password can be
        trusted.
      </p>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Three name generators sharing one interface.
 *
 * random    real first names and surnames, by region
 * business  a name for a company, from a seed word or from nothing
 * fantasy   invented names, built from syllables rather than picked from a list
 *
 * The fantasy one is built rather than listed on purpose. A fixed list of a
 * few hundred names runs out, and everyone using the site gets the same names,
 * which shows up the moment two people name a character from it. Syllable
 * patterns give a far larger space and a consistent flavour per style.
 *
 * Nothing here is random enough to matter cryptographically and it does not
 * need to be, so Math.random is honest and fast. The password generator, where
 * it does matter, uses crypto instead.
 */

type Mode = 'random' | 'business' | 'fantasy';

const FIRST: Record<string, string[]> = {
  English: ['Ada', 'Oliver', 'Grace', 'Harry', 'Alice', 'George', 'Rosie', 'Edward', 'Nora', 'Alfie', 'Ivy', 'Thomas'],
  Nigerian: ['Chidi', 'Amaka', 'Tunde', 'Ngozi', 'Emeka', 'Folake', 'Segun', 'Adaeze', 'Bola', 'Chinedu', 'Yewande', 'Ifeanyi'],
  French: ['Camille', 'Louis', 'Manon', 'Hugo', 'Chloé', 'Antoine', 'Élise', 'Julien', 'Margaux', 'Rémi'],
  Spanish: ['Lucía', 'Mateo', 'Sofía', 'Diego', 'Valentina', 'Javier', 'Carmen', 'Álvaro', 'Elena', 'Rafael'],
  Japanese: ['Haruto', 'Yui', 'Sota', 'Aoi', 'Ren', 'Sakura', 'Kaito', 'Hina', 'Riku', 'Mei'],
  German: ['Lukas', 'Hannah', 'Felix', 'Emilia', 'Jonas', 'Lena', 'Moritz', 'Greta', 'Tobias', 'Frieda'],
  Indian: ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Arjun', 'Ishita', 'Kabir', 'Meera', 'Rohan', 'Priya'],
};

const LAST: Record<string, string[]> = {
  English: ['Whitfield', 'Ashby', 'Carrow', 'Denham', 'Fairweather', 'Godwin', 'Halliwell', 'Marchant', 'Pemberton', 'Thackeray'],
  Nigerian: ['Okonkwo', 'Adeyemi', 'Balogun', 'Eze', 'Okafor', 'Adebayo', 'Nwosu', 'Oyelaran', 'Chukwu', 'Afolabi'],
  French: ['Moreau', 'Lefèvre', 'Rousseau', 'Chevalier', 'Dubois', 'Marchand', 'Perrin', 'Blanchard'],
  Spanish: ['Ibarra', 'Delgado', 'Montoya', 'Vargas', 'Serrano', 'Cabrera', 'Quintana', 'Peralta'],
  Japanese: ['Takahashi', 'Nakamura', 'Fujimoto', 'Ishikawa', 'Morita', 'Sakamoto', 'Yamashita', 'Okada'],
  German: ['Brandt', 'Kellner', 'Wagner', 'Hoffmann', 'Ziegler', 'Neumann', 'Baumgartner', 'Reinhardt'],
  Indian: ['Sharma', 'Iyer', 'Chatterjee', 'Reddy', 'Kulkarni', 'Nair', 'Bhattacharya', 'Sinha'],
};

/* Business naming, by the pattern each style actually follows. */
const BUSINESS = {
  prefixes: ['North', 'Iron', 'Blue', 'Ember', 'Quiet', 'Bright', 'Stone', 'Copper', 'Cedar', 'Harbour', 'Field', 'Loop'],
  suffixes: ['works', 'craft', 'lab', 'forge', 'yard', 'house', 'field', 'stack', 'bridge', 'harbour', 'grove'],
  endings: ['Studio', 'Collective', 'Company', 'Partners', 'Supply', 'Works', 'Labs', 'Group', 'Union', 'Trading'],
  latinish: ['ora', 'ova', 'ika', 'ely', 'ify', 'ora', 'ium', 'ara', 'evo', 'ily'],
};

const SYLLABLES = {
  soft: {
    start: ['ae', 'ly', 'ri', 'the', 'va', 'ni', 'se', 'lo', 'mi', 'ca'],
    middle: ['ra', 'li', 'ne', 'sa', 'do', 'mi', 'va', 'the', 'ly'],
    end: ['th', 'ra', 'wen', 'lin', 'dor', 'mir', 'sel', 'wyn', 'nor', 'las'],
  },
  harsh: {
    start: ['gr', 'kr', 'dra', 'thok', 'gor', 'bru', 'kaz', 'vor', 'zug', 'mor'],
    middle: ['ag', 'ur', 'ok', 'ath', 'un', 'gar', 'oz', 'ak'],
    end: ['nak', 'goth', 'rum', 'dak', 'zur', 'grim', 'thak', 'mor', 'ux'],
  },
  place: {
    start: ['Ash', 'Black', 'Storm', 'Frost', 'Green', 'Grey', 'Red', 'Thorn', 'Wolf', 'Raven'],
    middle: ['', '', 'wood', 'water', 'stone'],
    end: ['hollow', 'reach', 'fell', 'moor', 'watch', 'gate', 'crest', 'mere', 'barrow', 'hold'],
  },
};

type Flavour = keyof typeof SYLLABLES;

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function makeRandom(region: string, part: 'full' | 'first' | 'last'): string {
  const first = pick(FIRST[region]);
  const last = pick(LAST[region]);
  if (part === 'first') return first;
  if (part === 'last') return last;
  return `${first} ${last}`;
}

function makeBusiness(seed: string): string {
  const word = seed.trim().replace(/\s+/g, '');
  const style = Math.floor(Math.random() * (word ? 5 : 3));

  if (word) {
    switch (style) {
      case 0:
        return `${capital(word)}${pick(BUSINESS.suffixes)}`;
      case 1:
        return `${pick(BUSINESS.prefixes)}${word.toLowerCase()}`;
      case 2:
        return `${capital(word)} ${pick(BUSINESS.endings)}`;
      case 3:
        // A trimmed root plus a Latin sounding ending, which is where a great
        // many software company names come from.
        return capital(word.replace(/[aeiou]+$/i, '') + pick(BUSINESS.latinish));
      default:
        return `${capital(word)}ly`;
    }
  }

  switch (style) {
    case 0:
      return `${pick(BUSINESS.prefixes)}${pick(BUSINESS.suffixes)}`;
    case 1:
      return `${pick(BUSINESS.prefixes)} ${pick(BUSINESS.endings)}`;
    default:
      return capital(pick(BUSINESS.prefixes).toLowerCase() + pick(BUSINESS.latinish));
  }
}

function makeFantasy(flavour: Flavour, long: boolean): string {
  const set = SYLLABLES[flavour];
  const middle = long ? pick(set.middle) : '';
  const name = pick(set.start) + middle + pick(set.end);
  return capital(name);
}

export default function NameGenerator({ mode }: { mode: Mode }) {
  const [count, setCount] = useState(12);
  const [region, setRegion] = useState('English');
  const [part, setPart] = useState<'full' | 'first' | 'last'>('full');
  const [seed, setSeed] = useState('');
  const [flavour, setFlavour] = useState<Flavour>('soft');
  const [long, setLong] = useState(true);
  const [names, setNames] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const made = new Set<string>();
    // Asking for more distinct names than the patterns can produce would spin
    // forever, so the attempts are bounded and the result may be shorter.
    for (let tries = 0; made.size < count && tries < count * 40; tries++) {
      made.add(
        mode === 'random'
          ? makeRandom(region, part)
          : mode === 'business'
            ? makeBusiness(seed)
            : makeFantasy(flavour, long),
      );
    }
    setNames([...made]);
  }, [count, mode, region, part, seed, flavour, long]);

  // Generated after mount rather than during render, so the server and the
  // browser do not disagree about what the list says.
  useEffect(() => {
    generate();
  }, [generate]);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
  const field =
    'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent';

  const asText = useMemo(() => names.join('\n'), [names]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-5">
        {mode === 'random' && (
          <>
            <label className="block text-sm">
              <span className={label}>Region</span>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={field}>
                {Object.keys(FIRST).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
              {(
                [
                  ['full', 'Full name'],
                  ['first', 'First only'],
                  ['last', 'Surname only'],
                ] as const
              ).map(([id, text]) => (
                <button
                  key={id}
                  onClick={() => setPart(id)}
                  aria-pressed={part === id}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    part === id ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'business' && (
          <label className="block text-sm">
            <span className={label}>Word to build on, if you have one</span>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Leave empty for anything"
              className={field + ' w-64'}
            />
          </label>
        )}

        {mode === 'fantasy' && (
          <>
            <label className="block text-sm">
              <span className={label}>Flavour</span>
              <select
                value={flavour}
                onChange={(e) => setFlavour(e.target.value as Flavour)}
                className={field}
              >
                <option value="soft">Elvish, soft</option>
                <option value="harsh">Orcish, harsh</option>
                <option value="place">Places and holds</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pb-3 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={long}
                onChange={(e) => setLong(e.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              Longer names
            </label>
          </>
        )}

        <label className="block text-sm">
          <span className={label}>How many</span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
            className={field + ' w-24 tabular-nums'}
          />
        </label>

        <button
          onClick={generate}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
        >
          Generate
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <span className={label}>
            {names.length} name{names.length === 1 ? '' : 's'}
          </span>
          {names.length > 0 && (
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(asText);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-sm text-accent underline underline-offset-4"
            >
              {copied ? 'Copied' : 'Copy all'}
            </button>
          )}
        </div>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {names.map((name) => (
            <li key={name}>
              <button
                onClick={() => void navigator.clipboard.writeText(name)}
                title="Copy this one"
                className="w-full truncate rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:text-accent"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

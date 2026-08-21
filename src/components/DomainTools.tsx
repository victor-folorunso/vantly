'use client';

import { useCallback, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';

/**
 * Checks whether domain names are taken, and suggests some.
 *
 * Asks each ending's own registry over RDAP, which is the thing that actually
 * knows. The commoner approach is a DNS lookup, and it is wrong often enough
 * to matter: a registered name with no records set up does not resolve, so DNS
 * reports it free when it is owned, and a name parked for sale looks taken.
 *
 * RDAP answers browsers directly with an open CORS header, so this needs no
 * server of ours. Anything the check cannot establish is reported as unknown
 * rather than guessed at, because "probably available" on a name somebody then
 * tries to buy is worse than admitting the check failed.
 */

const TLDS = [
  'com', 'net', 'org', 'io', 'co', 'app', 'dev', 'xyz', 'me', 'ai',
  'shop', 'site', 'online', 'tech', 'store', 'blog', 'club', 'live',
];

const DEFAULT_TLDS = ['com', 'net', 'org', 'io', 'co', 'xyz'];

type Verdict = 'free' | 'taken' | 'unknown' | 'checking';

type Row = { domain: string; verdict: Verdict; note?: string };

const WORDS = {
  prefixes: ['get', 'try', 'go', 'use', 'join', 'my', 'the', 'hey', 'well', 'super'],
  suffixes: ['ly', 'ify', 'io', 'hq', 'lab', 'kit', 'hub', 'base', 'flow', 'stack', 'able', 'wise'],
  pairs: ['north', 'ember', 'cedar', 'harbour', 'field', 'copper', 'quiet', 'bright', 'stone', 'loop', 'drift', 'orbit'],
};

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

function clean(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]/g, '');
}

function ideasFrom(seed: string, howMany: number): string[] {
  const root = clean(seed);
  const made = new Set<string>();
  for (let tries = 0; made.size < howMany && tries < howMany * 30; tries++) {
    if (root) {
      const style = Math.floor(Math.random() * 4);
      made.add(
        style === 0
          ? `${pick(WORDS.prefixes)}${root}`
          : style === 1
            ? `${root}${pick(WORDS.suffixes)}`
            : style === 2
              ? `${root}${pick(WORDS.pairs)}`
              : `${pick(WORDS.pairs)}${root}`,
      );
    } else {
      made.add(`${pick(WORDS.pairs)}${pick(WORDS.suffixes)}`);
    }
  }
  return [...made];
}

/**
 * Where each ending publishes its registry lookup.
 *
 * IANA maintains this list and serves it to browsers, so the map is fetched
 * once and reused. Going through it rather than through a redirector matters
 * for correctness: an ending that is simply absent from the list can be
 * reported as unable to be checked, instead of being confused with an ending
 * that answered and said nobody owns the name.
 */
let bootstrap: Promise<Map<string, string>> | null = null;

function servers(): Promise<Map<string, string>> {
  bootstrap ??= fetch('https://data.iana.org/rdap/dns.json')
    .then((res) => res.json())
    .then((json: { services: [string[], string[]][] }) => {
      const map = new Map<string, string>();
      for (const [tlds, urls] of json.services) {
        for (const tld of tlds) map.set(tld.toLowerCase(), urls[0]);
      }
      return map;
    })
    .catch(() => new Map<string, string>());
  return bootstrap;
}

/**
 * One lookup, asked of the registry that runs the ending.
 *
 * 200 means the registry holds a record, so the name is taken. 404 means it
 * has none, so the name is free. Both come straight from the authority.
 *
 * The first version of this asked a redirector and read a 404 as free, which
 * reported google.io and google.co as available, because a 404 there also
 * means "no registry found for this ending". Reading the body instead did not
 * fix it: Verisign returns an empty body on a genuine 404, so a free .com read
 * as unknown. Only the list settles it.
 */
async function lookup(domain: string, signal: AbortSignal): Promise<Row> {
  const tld = domain.split('.').pop()?.toLowerCase() ?? '';
  const map = await servers();
  const server = map.get(tld);

  if (!server) {
    return {
      domain,
      verdict: 'unknown',
      note: `.${tld} does not publish a lookup that a browser can ask`,
    };
  }

  try {
    const res = await fetch(`${server.replace(/\/$/, '')}/domain/${encodeURIComponent(domain)}`, {
      signal,
      headers: { accept: 'application/rdap+json' },
    });
    if (res.status === 404) return { domain, verdict: 'free' };
    if (res.ok) return { domain, verdict: 'taken' };
    if (res.status === 429) {
      return { domain, verdict: 'unknown', note: 'Too many checks at once, try again shortly' };
    }
    return { domain, verdict: 'unknown', note: `The registry answered ${res.status}` };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { domain, verdict: 'unknown', note: 'Cancelled' };
    }
    return { domain, verdict: 'unknown', note: 'The registry for this ending did not answer' };
  }
}

/** Runs the lookups a few at a time rather than all at once. */
async function inBatches(
  domains: string[],
  signal: AbortSignal,
  onRow: (row: Row) => void,
  size = 4,
): Promise<void> {
  for (let i = 0; i < domains.length; i += size) {
    if (signal.aborted) return;
    const slice = domains.slice(i, i + size);
    const rows = await Promise.all(slice.map((d) => lookup(d, signal)));
    rows.forEach(onRow);
  }
}

export default function DomainTools({ mode }: { mode: 'check' | 'ideas' }) {
  const [query, setQuery] = useState('');
  const [tlds, setTlds] = useState<string[]>(DEFAULT_TLDS);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    const root = clean(query.split('.')[0]);
    if (!root && mode === 'check') return;

    abort.current?.abort();
    abort.current = new AbortController();
    const { signal } = abort.current;

    const names =
      mode === 'check'
        ? tlds.map((t) => `${root}.${t}`)
        : ideasFrom(query, 12).flatMap((idea) =>
            // Ideas are checked against a couple of endings only, so twelve
            // suggestions do not become a hundred lookups on somebody else's
            // service.
            ['com', 'io'].map((t) => `${idea}.${t}`),
          );

    setRows(names.map((domain) => ({ domain, verdict: 'checking' as Verdict })));
    setBusy(true);

    await inBatches(names, signal, (row) => {
      setRows((prev) => prev.map((r) => (r.domain === row.domain ? row : r)));
    });

    if (!signal.aborted) setBusy(false);
  }, [query, tlds, mode]);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  const badge = (verdict: Verdict) =>
    verdict === 'free'
      ? 'border-accent bg-accent-soft text-accent'
      : verdict === 'taken'
        ? 'border-line text-ink-faint'
        : 'border-line text-ink-soft';

  return (
    <ToolLayout
      settings={
        <>
          <label className="block text-sm">
            <span className={label}>
              {mode === 'check' ? 'Name to check' : 'Word to build on, if you have one'}
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void run();
              }}
              placeholder={mode === 'check' ? 'vantly' : 'Leave empty for anything'}
              className="mt-2 w-64 rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>

          <button
            onClick={() => void run()}
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ? 'Checking…' : mode === 'check' ? 'Check' : 'Suggest and check'}
          </button>

          {busy && (
            <button
              onClick={() => {
                abort.current?.abort();
                setBusy(false);
              }}
              className="text-sm text-ink-faint underline underline-offset-4"
            >
              Stop
            </button>
          )}
        </>
      }
    >
      {mode === 'check' && (
        <div className="mt-5">
          <span className={label}>Endings</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TLDS.map((t) => {
              const on = tlds.includes(t);
              return (
                <button
                  key={t}
                  onClick={() =>
                    setTlds((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                  aria-pressed={on}
                  className={`rounded-lg border px-2.5 py-1 text-sm transition-colors ${
                    on ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  .{t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <li
              key={row.domain}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${badge(row.verdict)}`}
            >
              <span className="truncate font-medium">{row.domain}</span>
              <span className="shrink-0 text-xs">
                {row.verdict === 'checking'
                  ? '…'
                  : row.verdict === 'free'
                    ? 'Free'
                    : row.verdict === 'taken'
                      ? 'Taken'
                      : 'Unknown'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {rows.some((r) => r.note) && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {rows.find((r) => r.note)?.note}. Some endings run their own registry
          and do not answer this way.
        </p>
      )}
    </ToolLayout>
  );
}

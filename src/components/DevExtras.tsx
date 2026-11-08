'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DropIcon from '@/components/DropIcon';
import { useHandoff } from '@/components/useHandoff';
import { decodeJwt, parseTimestamp, relativeTime, subnet, type Subnet } from '@/lib/devTools';

/**
 * Five small developer tools that each needed more than one box in and one
 * box out: Unix time, JWT, subnets, file checksums and htpasswd lines.
 *
 * One file rather than five because they share their bits of furniture (the
 * labelled field, the copy button, the result row) and none of them is large.
 * The logic lives in src/lib/devTools.ts, where it is tested.
 */

export type DevTool = 'unix' | 'jwt' | 'subnet' | 'checksum' | 'htpasswd';

const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
const field =
  'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent';

function Copy({ text, className = '' }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className={`shrink-0 text-sm text-accent underline underline-offset-4 ${className}`}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function Row({ name, value, copy = true }: { name: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 text-sm text-ink-soft">{name}</dt>
      <dd className="flex min-w-0 items-baseline gap-3">
        <span className="break-all text-right font-mono text-sm tabular-nums">{value}</span>
        {copy && <Copy text={value} />}
      </dd>
    </div>
  );
}

/* ── Unix time ───────────────────────────────────────────────────────────── */

function UnixTime() {
  const [now, setNow] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [when, setWhen] = useState('');
  const [utc, setUtc] = useState(false);

  // The clock starts after mount, so the static page does not bake in the
  // moment it was built.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);

  const zone = useMemo(() => (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''), []);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const { ms, unit } = parseTimestamp(input);
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) throw new Error('That is outside the range a date can hold.');
      return { ok: true as const, ms, unit, d };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'Not a timestamp.' };
    }
  }, [input]);

  const back = useMemo(() => {
    if (!when) return null;
    // datetime-local has no zone. Read as UTC by appending Z, otherwise as
    // the browser's own zone, which is what the user sees on their clock.
    const ms = utc ? Date.parse(when + 'Z') : new Date(when).getTime();
    return Number.isNaN(ms) ? null : ms;
  }, [when, utc]);

  const unitName = { s: 'seconds', ms: 'milliseconds', 'µs': 'microseconds', ns: 'nanoseconds' } as const;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={label}>Now</h2>
          {now !== null && <Copy text={String(Math.floor(now / 1000))} />}
        </div>
        <p className="mt-2 font-mono text-3xl tabular-nums">{now === null ? '…' : Math.floor(now / 1000)}</p>
        <p className="mt-1 text-sm text-ink-faint">{now === null ? '' : new Date(now).toLocaleString()}</p>

        <label className="mt-6 block text-sm">
          <span className={label}>Timestamp to date</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1700000000"
            inputMode="numeric"
            className={`${field} font-mono`}
          />
        </label>
        {parsed && !parsed.ok && <p className="mt-2 text-sm text-accent">{parsed.message}</p>}
        {parsed?.ok && (
          <dl className="mt-3">
            <p className="mb-1 text-xs text-ink-faint">Read as {unitName[parsed.unit]}.</p>
            <Row name={`Your time (${zone})`} value={parsed.d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })} />
            <Row name="UTC" value={parsed.d.toUTCString()} />
            <Row name="ISO 8601" value={parsed.d.toISOString()} />
            <Row name="Relative" value={relativeTime(parsed.ms, now ?? parsed.ms)} copy={false} />
            <Row name="Seconds" value={String(Math.floor(parsed.ms / 1000))} />
            <Row name="Milliseconds" value={String(Math.round(parsed.ms))} />
          </dl>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className={label}>Date to timestamp</h2>
        <input
          type="datetime-local"
          step={1}
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={field}
          aria-label="Date and time"
        />
        <div className="mt-3 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={!utc} onChange={() => setUtc(false)} /> In {zone || 'my time zone'}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={utc} onChange={() => setUtc(true)} /> In UTC
          </label>
        </div>
        {back !== null && (
          <dl className="mt-3">
            <Row name="Seconds" value={String(Math.floor(back / 1000))} />
            <Row name="Milliseconds" value={String(back)} />
            <Row name="ISO 8601" value={new Date(back).toISOString()} />
          </dl>
        )}
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          A Unix timestamp counts seconds since the start of 1970 in UTC, so it is the same moment everywhere. Ten
          digits is seconds, thirteen is milliseconds, and this works out which you pasted.
        </p>
      </section>
    </div>
  );
}

/* ── JWT ─────────────────────────────────────────────────────────────────── */

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const HMAC: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };

function b64url(buf: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const [secret, setSecret] = useState('');
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { ok: true as const, ...decodeJwt(token) };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'Not a JWT.' };
    }
  }, [token]);

  const alg = decoded?.ok ? String(decoded.header.alg ?? '') : '';

  // HMAC tokens can be checked here with the shared secret. Public-key tokens
  // need the issuer's key, which is not something to paste into a web page.
  // The answer is filed under the token and secret it was worked out for, so
  // a stale answer is never shown against a new input.
  const checkKey = `${token}\u0000${secret}`;
  const verdict = checked?.key === checkKey ? checked.ok : null;
  useEffect(() => {
    if (!decoded?.ok || !secret || !HMAC[alg]) return;
    let cancelled = false;
    (async () => {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: HMAC[alg] }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${decoded.parts[0]}.${decoded.parts[1]}`));
      if (!cancelled) setChecked({ key: checkKey, ok: b64url(sig) === decoded.parts[2] });
    })();
    return () => { cancelled = true; };
  }, [decoded, secret, alg, checkKey]);

  const claims = decoded?.ok ? decoded.payload : null;
  const time = (k: string) => (claims && typeof claims[k] === 'number' ? (claims[k] as number) * 1000 : null);
  const exp = time('exp');

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <label className="block">
          <span className={label}>Token</span>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={10}
            spellCheck={false}
            className={`${field} resize-y break-all font-mono text-[13px] leading-relaxed`}
          />
        </label>
        {decoded && !decoded.ok && <p className="mt-2 text-sm text-accent">{decoded.message}</p>}

        {decoded?.ok && (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <h2 className={label}>Signature</h2>
            {HMAC[alg] ? (
              <>
                <label className="mt-3 block text-sm">
                  Secret, to check it
                  <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    type="password"
                    autoComplete="off"
                    className={field}
                  />
                </label>
                {verdict === true && <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">Signature verified with this secret.</p>}
                {verdict === false && <p className="mt-2 text-sm font-medium text-accent">The signature does not match this secret.</p>}
                {verdict === null && (
                  <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                    Not checked. Anyone can write a token that decodes like this one. Only the signature says who made it.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {alg === 'none'
                  ? 'This token says it is unsigned (alg none). Nothing vouches for what it contains, and a server should refuse it.'
                  : `Signed with ${alg || 'an unknown algorithm'}, which needs the issuer's public key to check. Decoding does not check it.`}
              </p>
            )}
          </div>
        )}
      </div>

      {decoded?.ok && (
        <div className="space-y-5">
          {exp !== null && now !== null && (
            <p
              className={`rounded-xl border p-3 text-sm ${
                exp < now ? 'border-accent text-accent' : 'border-line text-ink-soft'
              }`}
            >
              {exp < now ? 'Expired ' : 'Expires '}
              {relativeTime(exp, now)}, {new Date(exp).toLocaleString()}.
            </p>
          )}
          {(['header', 'payload'] as const).map((part) => (
            <section key={part}>
              <div className="flex items-baseline justify-between">
                <h2 className={label}>{part}</h2>
                <Copy text={JSON.stringify(decoded[part], null, 2)} />
              </div>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed">
                {JSON.stringify(decoded[part], null, 2)}
              </pre>
            </section>
          ))}
          {(['iat', 'nbf', 'exp'] as const).some((k) => time(k) !== null) && (
            <dl className="rounded-xl border border-line bg-surface px-4">
              {(
                [
                  ['iat', 'Issued'],
                  ['nbf', 'Not before'],
                  ['exp', 'Expires'],
                ] as const
              ).map(([k, name]) =>
                time(k) !== null ? <Row key={k} name={name} value={new Date(time(k)!).toLocaleString()} copy={false} /> : null,
              )}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Subnet ──────────────────────────────────────────────────────────────── */

function SubnetCalc() {
  const [address, setAddress] = useState('192.168.1.10');
  const [prefix, setPrefix] = useState('24');

  const result = useMemo((): { ok: true; s: Subnet } | { ok: false; message: string } => {
    try {
      return { ok: true, s: address.includes('/') ? subnet(address) : subnet(address, prefix) };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Not a valid address.' };
    }
  }, [address, prefix]);

  return (
    <ToolLayout
      title="Network"
      settings={
        <>
          <label className="block text-sm">
            <span className={label}>IPv4 address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${field} font-mono`} spellCheck={false} />
          </label>
          {!address.includes('/') && (
            <label className="block text-sm">
              <span className={label}>Prefix</span>
              <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className={field}>
                {Array.from({ length: 33 }, (_, i) => 32 - i).map((p) => (
                  <option key={p} value={p}>
                    /{p}
                    {p >= 8 ? ` (${(2 ** (32 - p)).toLocaleString()} addresses)` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="text-xs leading-relaxed text-ink-faint">
            Type a CIDR like 10.0.0.0/16 straight into the address box, or a mask like 255.255.255.0 after a slash.
          </p>
        </>
      }
    >
      {!result.ok ? (
        <p className="text-sm text-accent">{result.message}</p>
      ) : (
        <dl className="rounded-2xl border border-line bg-surface px-5">
          <Row name="Network" value={`${result.s.network}/${result.s.prefix}`} />
          <Row name="Subnet mask" value={result.s.mask} />
          <Row name="Wildcard mask" value={result.s.wildcard} />
          <Row name="Broadcast" value={result.s.prefix >= 31 ? 'None' : result.s.broadcast} copy={result.s.prefix < 31} />
          <Row name="First usable" value={result.s.first} />
          <Row name="Last usable" value={result.s.last} />
          <Row name="Usable hosts" value={result.s.usable.toLocaleString()} copy={false} />
          <Row name="Total addresses" value={result.s.total.toLocaleString()} copy={false} />
          <Row name="Address type" value={result.s.kind} copy={false} />
        </dl>
      )}
    </ToolLayout>
  );
}

/* ── File checksum ───────────────────────────────────────────────────────── */

const SUMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as const;
type Sum = (typeof SUMS)[number];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Checksum() {
  const [file, setFile] = useState<File | null>(null);
  const [sums, setSums] = useState<Partial<Record<Sum, string>>>({});
  const [progress, setProgress] = useState<number | null>(null);
  const [expected, setExpected] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const run = useRef(0);

  /* hash-wasm rather than SubtleCrypto, because SubtleCrypto cannot hash in
     pieces: a 4GB disk image would have to sit in memory whole. This feeds
     8MB at a time to all four hashes in one pass over the file. MD5 is here
     because it is still what most download pages print, and for checking a
     download arrived intact it does the job. */
  const hash = useCallback(async (f: File) => {
    const id = ++run.current;
    setFile(f);
    setSums({});
    setError(null);
    setProgress(0);
    try {
      const { createMD5, createSHA1, createSHA256, createSHA512 } = await import('hash-wasm');
      const hashers = await Promise.all([createMD5(), createSHA1(), createSHA256(), createSHA512()]);
      hashers.forEach((h) => h.init());
      const size = 8 * 1024 * 1024;
      for (let offset = 0; offset < f.size; offset += size) {
        if (id !== run.current) return;
        const chunk = new Uint8Array(await f.slice(offset, offset + size).arrayBuffer());
        hashers.forEach((h) => h.update(chunk));
        setProgress(Math.min(1, (offset + size) / f.size));
      }
      if (id !== run.current) return;
      const [md5, sha1, sha256, sha512] = hashers.map((h) => h.digest('hex'));
      setSums({ MD5: md5, 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-512': sha512 });
    } catch {
      if (id === run.current) setError('That file could not be read.');
    } finally {
      if (id === run.current) setProgress(null);
    }
  }, []);

  useHandoff((files) => { if (files[0]) void hash(files[0]); });

  const want = expected.trim().toLowerCase().replace(/^[\s\S]*?([0-9a-f]{32,128})[\s\S]*$/, '$1');
  const match = want ? SUMS.find((k) => sums[k] === want) : undefined;
  const lengthFor: Record<number, Sum> = { 32: 'MD5', 40: 'SHA-1', 64: 'SHA-256', 128: 'SHA-512' };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void hash(f); }}
    >
      {!file ? (
        <div
          className={`flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
          }`}
        >
          <DropIcon />
          <p className="text-lg font-medium">Drop a file here</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
            Any size. It is read on your computer and never uploaded.
          </p>
          <button onClick={() => inputRef.current?.click()} className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
            Choose a file
          </button>
        </div>
      ) : (
        <ToolLayout
          title="Compare"
          settings={
            <>
              <label className="block text-sm">
                <span className={label}>Checksum from the download page</span>
                <textarea
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  placeholder="Paste it here"
                  className={`${field} resize-y break-all font-mono text-[13px]`}
                />
              </label>
              {want && progress === null && Object.keys(sums).length > 0 && (
                match ? (
                  <p className="rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-sm font-medium text-green-700 dark:text-green-400">
                    Matches the {match}. The file is the one that was published.
                  </p>
                ) : (
                  <p className="rounded-lg border border-accent/50 bg-accent-soft p-3 text-sm text-accent">
                    {lengthFor[want.length]
                      ? `Does not match the ${lengthFor[want.length]}. The file is damaged or not the same file. Download it again.`
                      : 'That does not look like an MD5, SHA-1, SHA-256 or SHA-512 checksum.'}
                  </p>
                )
              )}
            </>
          }
          status={
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs tabular-nums text-ink-faint">
                {formatBytes(file.size)}
                {progress !== null && `, reading ${Math.round(progress * 100)}%`}
              </p>
            </div>
          }
          actions={
            <button onClick={() => inputRef.current?.click()} className="text-sm text-ink-faint underline underline-offset-4">
              Use another file
            </button>
          }
        >
          {progress !== null && (
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-alt">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          <dl className="rounded-2xl border border-line bg-surface px-5">
            {SUMS.map((k) => (
              <div key={k} className={match === k ? 'rounded-md bg-green-600/10' : ''}>
                <Row name={k} value={sums[k] ?? (progress !== null ? '…' : '')} copy={!!sums[k]} />
              </div>
            ))}
          </dl>
          {error && <p className="mt-3 text-sm text-accent">{error}</p>}
        </ToolLayout>
      )}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void hash(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ── htpasswd ────────────────────────────────────────────────────────────── */

function Htpasswd() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [cost, setCost] = useState(10);
  const [line, setLine] = useState('');
  const [busy, setBusy] = useState(false);

  const problem = user.includes(':')
    ? 'A username cannot contain a colon. The file uses it to separate the name from the hash.'
    : /\s/.test(user)
      ? 'Spaces in a username work in the file but are easy to get wrong when logging in.'
      : new TextEncoder().encode(password).length > 72
        ? 'bcrypt only reads the first 72 bytes of a password, so anything after that is ignored.'
        : null;

  const make = useCallback(async () => {
    setBusy(true);
    try {
      const { bcrypt } = await import('hash-wasm');
      const hashed = await bcrypt({
        password,
        salt: crypto.getRandomValues(new Uint8Array(16)),
        costFactor: cost,
        outputType: 'encoded',
      });
      // Apache writes bcrypt as $2y$, which is the same algorithm as $2b$
      // under the name PHP gave it. Written the way htpasswd -B writes it.
      setLine(`${user}:${hashed.replace(/^\$2[ab]\$/, '$2y$')}`);
    } finally {
      setBusy(false);
    }
  }, [user, password, cost]);

  return (
    <ToolLayout
      title="Account"
      settings={
        <>
          <label className="block text-sm">
            <span className={label}>Username</span>
            <input value={user} onChange={(e) => { setUser(e.target.value); setLine(''); }} autoComplete="off" className={field} />
          </label>
          <label className="block text-sm">
            <span className={label}>Password</span>
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLine(''); }}
              type="password"
              autoComplete="new-password"
              className={field}
            />
          </label>
          <label className="block text-sm">
            <span className="flex justify-between">
              Strength
              <span className="tabular-nums text-ink-faint">cost {cost}</span>
            </span>
            <input type="range" min={8} max={14} value={cost} onChange={(e) => { setCost(Number(e.target.value)); setLine(''); }} className="mt-1.5 w-full" />
            <span className="mt-1 block text-xs text-ink-faint">Each step doubles the work for an attacker, and for your server on every login. 10 is the usual default.</span>
          </label>
          {problem && <p className="text-xs leading-relaxed text-accent">{problem}</p>}
          <button
            onClick={() => void make()}
            disabled={!user || !password || user.includes(':') || busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ? 'Hashing…' : 'Make the line'}
          </button>
        </>
      }
    >
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <h2 className={label}>.htpasswd line</h2>
          {line && <Copy text={line} />}
        </div>
        <p className="mt-3 min-h-[3rem] break-all font-mono text-sm">{line || <span className="text-ink-faint">Fill in a name and password.</span>}</p>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Hashed with bcrypt in your browser, the same as <code>htpasswd -B</code>, so the password is never sent
        anywhere. Add the line to your .htpasswd file, one line per user. Apache 2.4 and nginx both read it.
      </p>
    </ToolLayout>
  );
}

export default function DevExtras({ tool }: { tool: DevTool }) {
  if (tool === 'unix') return <UnixTime />;
  if (tool === 'jwt') return <JwtDecoder />;
  if (tool === 'subnet') return <SubnetCalc />;
  if (tool === 'checksum') return <Checksum />;
  return <Htpasswd />;
}

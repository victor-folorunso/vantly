'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Remembering things between visits, in two kinds with different rules.
 *
 * Settings are remembered quietly. Quality, format, indent width, page size.
 * They are tiny, they are not about you, and setting JPEG quality to 80 on
 * every visit is a small tax nobody should pay.
 *
 * Content is different and is treated differently. What somebody pastes into a
 * tool is theirs: a contract, a cover letter, an API response with a token in
 * it. Writing that to disk quietly would break the one promise this site
 * makes, and it would break it worst on a shared machine, which is exactly
 * where people use a free tool rather than installing software.
 *
 * So content is only remembered where a tool asks for it, it says so when it
 * comes back, it can be cleared in one press, and it expires on its own.
 * Visible and reversible is what makes it acceptable.
 *
 * Some tools remember nothing at all. See NEVER below.
 */

const PREFIX = 'vantly';

/* Bump when the stored shape changes, so old values are ignored rather than
   parsed into something that throws on read. */
const VERSION = 1;

/**
 * Tools that never write anything down, whatever they ask for.
 *
 * The rule is not "is it secret" but "would somebody be surprised and harmed
 * to find it still there". A generated password sitting in browser storage is
 * a worse outcome than any convenience it buys, and the same goes for a token
 * somebody pasted in to find out when it expires.
 */
const NEVER = new Set([
  'password-generator',
  'jwt-decoder',
  'hash-generator',
  'file-checksum',
  'htpasswd-generator',
  'base64',
  'base64-encoder',
  'fill-pdf',
  'sign-pdf',
  'unlock-pdf',
  'protect-pdf',
  'redact-pdf',
]);

/** Drafts are forgotten after this, even if nobody clears them. */
const DRAFT_LIFE = 7 * 24 * 60 * 60 * 1000;

function keyFor(tool: string, field: string): string {
  return `${PREFIX}.${tool}.${field}`;
}

function read<T>(key: string): { value: T; at: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: number; at: number; value: T };
    if (parsed.v !== VERSION) return null;
    return { value: parsed.value, at: parsed.at };
  } catch {
    // Storage refused, or somebody put something else at this key. Either way
    // the right answer is to carry on without it.
    return null;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ v: VERSION, at: Date.now(), value }));
  } catch {
    /* Private browsing, or the quota is full. Not worth telling anyone. */
  }
}

function forget(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Nothing to do. */
  }
}

/**
 * A setting that survives a visit.
 *
 * Reads on mount rather than during render. The pages are prerendered, so
 * reaching for localStorage while rendering would produce different markup on
 * the server and in the browser, which React rejects.
 */
export function useSetting<T>(tool: string, field: string, initial: T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    if (NEVER.has(tool)) return;
    const stored = read<T>(keyFor(tool, field));
    if (stored !== null) setValue(stored.value);
    loaded.current = true;
  }, [tool, field]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      // Only after the stored value has had its chance, or the first render
      // would overwrite what was saved with the default.
      if (loaded.current && !NEVER.has(tool)) write(keyFor(tool, field), next);
    },
    [tool, field],
  );

  return [value, set];
}

export type Draft<T> = {
  value: T;
  set: (next: T) => void;
  /** True when this came back from a previous visit rather than being typed. */
  restored: boolean;
  /** Throws it away, here and on disk. */
  clear: () => void;
};

/**
 * Content that survives a visit, visibly.
 *
 * Returns `restored` so the tool can say where the text came from. A tool that
 * silently refills itself is unsettling; one that says it did, and offers to
 * stop, is useful.
 */
export function useDraft<T>(tool: string, field: string, initial: T): Draft<T> {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (NEVER.has(tool)) {
      loaded.current = true;
      return;
    }
    const key = keyFor(tool, field);
    const stored = read<T>(key);
    if (stored) {
      if (Date.now() - stored.at > DRAFT_LIFE) {
        forget(key);
      } else if (stored.value !== initial && stored.value !== '') {
        setValue(stored.value);
        setRestored(true);
      }
    }
    loaded.current = true;
    // initial is deliberately not a dependency: this runs once, and a caller
    // passing a fresh object literal would otherwise reload on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, field]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      setRestored(false);
      if (!loaded.current || NEVER.has(tool)) return;
      const key = keyFor(tool, field);
      if (next === initial || next === '' || next == null) forget(key);
      else write(key, next);
    },
    [tool, field, initial],
  );

  const clear = useCallback(() => {
    setValue(initial);
    setRestored(false);
    forget(keyFor(tool, field));
  }, [tool, field, initial]);

  return { value, set, restored, clear };
}

/** Everything this site has stored, for a person who wants it all gone. */
export function forgetEverything(): number {
  let removed = 0;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`${PREFIX}.`)) {
        localStorage.removeItem(key);
        removed++;
      }
    }
  } catch {
    /* Nothing to do. */
  }
  return removed;
}

export function storedCount(): number {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIX}.`)).length;
  } catch {
    return 0;
  }
}

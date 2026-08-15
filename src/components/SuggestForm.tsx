'use client';

import { useMemo, useState } from 'react';
import { CONVERSIONS } from '@/lib/conversions';
import { TOOLS } from '@/lib/site';

/**
 * Suggestions, with no server to receive them.
 *
 * The site is a static export, so there is nothing here that can accept a POST.
 * The options were a third party form service, which means an external script
 * and somebody else holding the submissions, or GitHub Issues, which is free,
 * public, already exists, and keeps the list of requests visible to everybody
 * including whoever is deciding what to build next.
 *
 * The honest cost of that choice is that it needs a GitHub account, which most
 * people converting a photo do not have. So the form is written to compose the
 * issue for them and hand it over in one click, rather than dropping them at an
 * empty GitHub page to work out what to write.
 *
 * What is typed here is checked against what already exists first, because the
 * most common suggestion for a site with 126 pages is something already on it.
 */

const REPO = 'https://github.com/victor-folorunso/vantly';

type Kind = 'conversion' | 'tool';

export default function SuggestForm() {
  const [kind, setKind] = useState<Kind>('conversion');
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');

  /* Anything already listed that resembles what they typed. Suggesting a page
     that exists is not a mistake worth an error, it just means they could have
     what they want right now. */
  const existing = useMemo(() => {
    const q = what.trim().toLowerCase();
    if (q.length < 2) return [];
    const words = q.split(/\s+/).filter((w) => w !== 'to');
    const hits = [
      ...TOOLS.map((t) => ({
        href: `/${t.slug}`,
        label: t.name,
        live: t.live,
        hay: `${t.name} ${t.slug} ${t.blurb}`.toLowerCase(),
      })),
      ...CONVERSIONS.map((c) => ({
        href: `/${c.slug}`,
        label: `${c.from.label} to ${c.to.label}`,
        live: c.live,
        hay: `${c.from.label} ${c.to.label} ${c.from.id} ${c.to.id} ${c.slug}`.toLowerCase(),
      })),
    ].filter((e) => words.every((w) => e.hay.includes(w)));
    return hits.slice(0, 4);
  }, [what]);

  const issueUrl = useMemo(() => {
    const title = `${kind === 'conversion' ? 'Conversion' : 'Tool'} request: ${what.trim() || '…'}`;
    const body = [
      `**What I want:** ${what.trim() || '(describe it here)'}`,
      '',
      `**What I am trying to do:** ${why.trim() || '(what were you doing when you needed this?)'}`,
      '',
      '---',
      'Sent from the suggestion page.',
    ].join('\n');
    return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent(kind === 'conversion' ? 'conversion request' : 'tool request')}`;
  }, [kind, what, why]);

  return (
    <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex gap-2">
        {(['conversion', 'tool'] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
              k === kind
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-ink-soft hover:border-ink-faint'
            }`}
          >
            {k === 'conversion' ? 'A conversion' : 'A tool'}
          </button>
        ))}
      </div>

      <label className="mt-6 block text-sm font-medium">
        {kind === 'conversion' ? 'What do you need to convert?' : 'What should it do?'}
        <input
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder={kind === 'conversion' ? 'MOV to MP4' : 'Open a .pages file'}
          className="mt-2 w-full rounded-lg border border-line bg-ground px-3 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
        />
      </label>

      {existing.length > 0 && (
        <div className="mt-4 rounded-lg border border-line bg-surface-alt p-4">
          <p className="text-sm font-medium">This might already be here.</p>
          <ul className="mt-2 space-y-1">
            {existing.map((e) => (
              <li key={e.href}>
                <a href={e.href} className="text-sm text-accent underline underline-offset-4">
                  {e.label}
                </a>
                <span className="ml-2 text-xs text-ink-faint">
                  {e.live ? 'ready now' : 'planned, not built'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="mt-5 block text-sm font-medium">
        What were you trying to do?
        <span className="mt-1 block text-xs font-normal leading-relaxed text-ink-faint">
          Optional, but it decides what gets built first. A request with a reason
          behind it beats five without one.
        </span>
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={3}
          placeholder="My phone records .mov and the site I upload to only takes mp4."
          className="mt-2 w-full resize-y rounded-lg border border-line bg-ground px-3 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
        />
      </label>

      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!what.trim()}
        onClick={(e) => {
          if (!what.trim()) e.preventDefault();
        }}
        className={`mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform ${
          what.trim()
            ? 'bg-accent text-accent-ink hover:scale-[1.02]'
            : 'cursor-not-allowed bg-accent/40 text-accent-ink'
        }`}
      >
        Send it
      </a>

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        This opens GitHub with the message already written, so you only have to
        press submit. It needs a GitHub account, which is the honest downside of
        not running a server. Everything sent this way is public, so leave
        personal details out.
      </p>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';

/**
 * The webmaster string builders: UTM links, robots.txt, meta tags.
 *
 * None of these are hard. They are here because getting them slightly wrong is
 * easy and the consequence is delayed: a UTM with inconsistent casing splits one
 * campaign into four rows in a report weeks later, and a stray Disallow: / on a
 * live site is quietly catastrophic. So each one checks the thing that actually
 * bites rather than just concatenating strings.
 */

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink"
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function Out({ value }: { value: string }) {
  return (
    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-line bg-surface-alt p-4 font-mono text-[12px] leading-relaxed">
      {value || <span className="text-ink-faint">Fill the form and it appears here.</span>}
    </pre>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none placeholder:text-ink-faint focus:border-accent"
      />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

/* ── UTM builder ──────────────────────────────────────────────────────────── */

export function UtmBuilder() {
  const [url, setUrl] = useState('https://example.com/page');
  const [source, setSource] = useState('newsletter');
  const [medium, setMedium] = useState('email');
  const [campaign, setCampaign] = useState('spring-launch');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [lower, setLower] = useState(true);

  const { link, problems } = useMemo(() => {
    const problems: string[] = [];
    const clean = (s: string) => (lower ? s.trim().toLowerCase() : s.trim());

    if (!url.trim()) return { link: '', problems: [] };

    let base: URL;
    try {
      base = new URL(url.trim());
    } catch {
      return { link: '', problems: ['That is not a full URL. It needs the https:// part.'] };
    }

    // Analytics treats Email and email as two campaigns, so the report splits
    // and neither half looks like it worked.
    if (!lower && /[A-Z]/.test(source + medium + campaign)) {
      problems.push('Capitals here make separate rows in your reports. Lowercase is safer.');
    }
    if ([source, medium, campaign].some((v) => /\s/.test(v.trim()))) {
      problems.push('Spaces get encoded as %20 and are hard to read later. Use hyphens.');
    }
    if (base.hash) {
      problems.push('The fragment after # is dropped before the request is sent, so anything after it is invisible to analytics.');
    }
    if (!source.trim() || !medium.trim()) {
      problems.push('Source and medium are the two that actually matter. Without them the visit lands in "direct".');
    }

    const params: [string, string][] = [
      ['utm_source', clean(source)],
      ['utm_medium', clean(medium)],
      ['utm_campaign', clean(campaign)],
      ['utm_term', clean(term)],
      ['utm_content', clean(content)],
    ];
    for (const [k, v] of params) {
      if (v) base.searchParams.set(k, v);
      else base.searchParams.delete(k);
    }
    return { link: base.toString(), problems };
  }, [url, source, medium, campaign, term, content, lower]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="space-y-3.5 rounded-xl border border-line bg-surface p-5">
        <Field label="Page URL" value={url} onChange={setUrl} placeholder="https://…" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source" value={source} onChange={setSource} hint="Where it came from" />
          <Field label="Medium" value={medium} onChange={setMedium} hint="How it travelled" />
        </div>
        <Field label="Campaign" value={campaign} onChange={setCampaign} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Term (optional)" value={term} onChange={setTerm} />
          <Field label="Content (optional)" value={content} onChange={setContent} />
        </div>
        <label className="flex items-center gap-2 pt-1 text-sm">
          <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} />
          Force lowercase
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Your link
          </span>
          {link && <Copy text={link} />}
        </div>
        <Out value={link} />
        {problems.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {problems.map((p) => (
              <li key={p} className="text-sm leading-relaxed text-accent">
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── robots.txt ───────────────────────────────────────────────────────────── */

const CRAWLERS = [
  { id: 'GPTBot', label: 'GPTBot (OpenAI)' },
  { id: 'ClaudeBot', label: 'ClaudeBot (Anthropic)' },
  { id: 'PerplexityBot', label: 'PerplexityBot' },
  { id: 'CCBot', label: 'CCBot (Common Crawl)' },
  { id: 'Google-Extended', label: 'Google-Extended (Gemini training)' },
];

export function RobotsGenerator() {
  const [allowAll, setAllowAll] = useState(true);
  const [disallowed, setDisallowed] = useState('/admin\n/cart\n/checkout');
  const [sitemap, setSitemap] = useState('https://example.com/sitemap.xml');
  const [blockAi, setBlockAi] = useState<string[]>([]);
  const [crawlDelay, setCrawlDelay] = useState('');

  const output = useMemo(() => {
    const lines: string[] = [];
    lines.push('User-agent: *');
    if (allowAll) {
      const paths = disallowed
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (paths.length) for (const p of paths) lines.push(`Disallow: ${p}`);
      else lines.push('Disallow:');
    } else {
      lines.push('Disallow: /');
    }
    if (crawlDelay.trim()) lines.push(`Crawl-delay: ${crawlDelay.trim()}`);

    for (const bot of blockAi) {
      lines.push('', `User-agent: ${bot}`, 'Disallow: /');
    }
    if (sitemap.trim()) lines.push('', `Sitemap: ${sitemap.trim()}`);
    return lines.join('\n');
  }, [allowAll, disallowed, sitemap, blockAi, crawlDelay]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Search engines
          </span>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setAllowAll(true)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                allowAll ? 'border-accent bg-accent-soft' : 'border-line text-ink-soft'
              }`}
            >
              Allow
            </button>
            <button
              onClick={() => setAllowAll(false)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                !allowAll ? 'border-accent bg-accent-soft' : 'border-line text-ink-soft'
              }`}
            >
              Block everything
            </button>
          </div>
          {!allowAll && (
            <p className="mt-2 text-sm leading-relaxed text-accent">
              This hides the whole site from search. Right for a staging server,
              catastrophic on a live one, and it is the single most common way a
              site vanishes from Google overnight.
            </p>
          )}
        </div>

        {allowAll && (
          <label className="block text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Paths to keep out, one per line
            </span>
            <textarea
              value={disallowed}
              onChange={(e) => setDisallowed(e.target.value)}
              rows={4}
              spellCheck={false}
              className="mt-1.5 w-full resize-y rounded-lg border border-line bg-ground px-3 py-2 font-mono text-[13px] outline-none focus:border-accent"
            />
            <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
              This is not security. It asks politely, and the file is public, so
              listing a secret path here advertises it.
            </span>
          </label>
        )}

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Block AI crawlers
          </span>
          <div className="mt-2 space-y-1.5">
            {CRAWLERS.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={blockAi.includes(c.id)}
                  onChange={(e) =>
                    setBlockAi((prev) =>
                      e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <Field label="Sitemap URL" value={sitemap} onChange={setSitemap} />
        <Field
          label="Crawl delay (optional)"
          value={crawlDelay}
          onChange={setCrawlDelay}
          hint="Seconds between requests. Google ignores this."
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            robots.txt
          </span>
          <Copy text={output} />
        </div>
        <Out value={output} />
      </div>
    </div>
  );
}

/* ── Meta tags ────────────────────────────────────────────────────────────── */

export function MetaTagGenerator() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [site, setSite] = useState('');

  const output = useMemo(() => {
    const e = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const l: string[] = [];
    if (title) l.push(`<title>${e(title)}</title>`);
    if (description) l.push(`<meta name="description" content="${e(description)}" />`);
    if (url) l.push(`<link rel="canonical" href="${e(url)}" />`);
    l.push('');
    if (title) l.push(`<meta property="og:title" content="${e(title)}" />`);
    if (description) l.push(`<meta property="og:description" content="${e(description)}" />`);
    if (url) l.push(`<meta property="og:url" content="${e(url)}" />`);
    if (image) l.push(`<meta property="og:image" content="${e(image)}" />`);
    l.push('<meta property="og:type" content="website" />');
    l.push('');
    // summary_large_image, because the default renders a small square beside
    // the text and wastes the picture entirely.
    l.push(`<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`);
    if (site) l.push(`<meta name="twitter:site" content="${e(site.startsWith('@') ? site : '@' + site)}" />`);
    return l.join('\n');
  }, [title, description, url, image, site]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="space-y-3.5 rounded-xl border border-line bg-surface p-5">
        <label className="block text-sm">
          <span className="flex justify-between text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Title
            <span className={`tabular-nums ${title.length > 60 ? 'text-accent' : ''}`}>
              {title.length}/60
            </span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The page title"
            className="mt-1.5 w-full rounded-lg border border-line bg-ground px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <label className="block text-sm">
          <span className="flex justify-between text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Description
            <span className={`tabular-nums ${description.length > 160 ? 'text-accent' : ''}`}>
              {description.length}/160
            </span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="One or two sentences."
            className="mt-1.5 w-full resize-y rounded-lg border border-line bg-ground px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <Field label="Canonical URL" value={url} onChange={setUrl} placeholder="https://…" />
        <Field label="Share image" value={image} onChange={setImage} hint="1200x630 works everywhere" />
        <Field label="X handle" value={site} onChange={setSite} placeholder="@you" />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Paste into &lt;head&gt;
          </span>
          <Copy text={output} />
        </div>
        <Out value={output} />

        {(title || description) && (
          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Roughly how it looks in search
            </span>
            <div className="mt-2 rounded-xl border border-line bg-surface p-4">
              <p className="truncate text-[13px] text-ink-faint">{url || 'example.com'}</p>
              <p className="mt-0.5 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
                {title.slice(0, 60) || 'Your title here'}
                {title.length > 60 && '…'}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
                {description.slice(0, 160) || 'Your description here.'}
                {description.length > 160 && '…'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

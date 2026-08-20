'use client';

import { useMemo, useState } from 'react';

/**
 * Builds a cron expression and, more usefully, says what one means.
 *
 * The reason people search for this is not that the syntax is hard to write.
 * It is that a wrong expression looks exactly like a right one, and the
 * feedback arrives a month later when the job did not run. So the plain
 * English reading is the output, not a footnote.
 *
 * Standard five field cron. No seconds field, because that is a Quartz and
 * systemd extension and putting six fields into crontab is the classic way to
 * get "bad minute".
 */

const PRESETS: { label: string; expr: string }[] = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Every day at midnight', expr: '0 0 * * *' },
  { label: 'Every weekday at 9am', expr: '0 9 * * 1-5' },
  { label: 'Every Monday at 9am', expr: '0 9 * * 1' },
  { label: 'First of the month', expr: '0 0 1 * *' },
  { label: 'Every Sunday at 3am', expr: '0 3 * * 0' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Range = { min: number; max: number; name: string };

const FIELDS: Range[] = [
  { min: 0, max: 59, name: 'minute' },
  { min: 0, max: 23, name: 'hour' },
  { min: 1, max: 31, name: 'day of the month' },
  { min: 1, max: 12, name: 'month' },
  { min: 0, max: 6, name: 'day of the week' },
];

/** Checks one field and returns the values it covers, or an error. */
function expand(part: string, range: Range): { values: number[]; error?: string } {
  const values = new Set<number>();

  for (const chunk of part.split(',')) {
    const [body, stepText] = chunk.split('/');
    const step = stepText === undefined ? 1 : Number(stepText);
    if (stepText !== undefined && (!Number.isInteger(step) || step < 1)) {
      return { values: [], error: `"${chunk}" has a step that is not a whole number.` };
    }

    let from: number;
    let to: number;

    if (body === '*') {
      from = range.min;
      to = range.max;
    } else if (body.includes('-')) {
      const [a, b] = body.split('-').map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        return { values: [], error: `"${chunk}" is not a range of numbers.` };
      }
      from = a;
      to = b;
    } else {
      const n = Number(body);
      if (!Number.isInteger(n)) return { values: [], error: `"${chunk}" is not a number.` };
      from = n;
      to = n;
    }

    if (from < range.min || to > range.max || from > to) {
      return {
        values: [],
        error: `The ${range.name} must be between ${range.min} and ${range.max}, and "${chunk}" is not.`,
      };
    }
    for (let v = from; v <= to; v += step) values.add(v);
  }

  return { values: [...values].sort((a, b) => a - b) };
}

/** 1st, 2nd, 3rd, 11th. Days of the month read as ordinals, not as counts. */
function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

function list(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function describe(expr: string): { text: string; error?: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      text: '',
      error:
        parts.length === 6
          ? 'That is six fields. Standard cron takes five, with no seconds.'
          : `That is ${parts.length} field${parts.length === 1 ? '' : 's'}. Cron takes five: minute, hour, day, month, weekday.`,
    };
  }

  const expanded = parts.map((p, i) => expand(p, FIELDS[i]));
  const bad = expanded.find((e) => e.error);
  if (bad) return { text: '', error: bad.error };

  const [min, hour, dom, month, dow] = expanded.map((e) => e.values);
  const [minP, hourP, domP, monthP, dowP] = parts;

  const time = () => {
    if (minP === '*' && hourP === '*') return 'every minute';
    if (minP.startsWith('*/') && hourP === '*') return `every ${minP.slice(2)} minutes`;
    if (hourP === '*') return `at ${list(min.map((m) => `minute ${m}`))} of every hour`;
    const times = hour.flatMap((h) =>
      min.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
    );
    return times.length > 6 ? `at ${times.length} times a day` : `at ${list(times)}`;
  };

  const day = () => {
    const everyDom = domP === '*';
    const everyDow = dowP === '*';
    if (everyDom && everyDow) return 'every day';
    if (everyDom) return `on ${list(dow.map((d) => DAYS[d]))}`;
    if (everyDow) return `on the ${list(dom.map(ordinal))} of the month`;
    // Cron treats these as OR when both are set, which surprises everybody.
    return `on the ${list(dom.map(ordinal))} of the month, and on ${list(dow.map((d) => DAYS[d]))}`;
  };

  const months = monthP === '*' ? '' : `, in ${list(month.map((m) => MONTHS[m - 1]))}`;

  return { text: `Runs ${time()}, ${day()}${months}.` };
}

export default function CrontabGenerator() {
  const [expr, setExpr] = useState('0 9 * * 1-5');
  const [copied, setCopied] = useState(false);

  const { text, error } = useMemo(() => describe(expr), [expr]);
  const parts = expr.trim().split(/\s+/);

  return (
    <div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Expression
        </span>
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-lg tracking-wide outline-none focus:border-accent"
        />
      </label>

      <div className="mt-3 grid grid-cols-5 gap-2 text-center">
        {FIELDS.map((f, i) => (
          <div key={f.name} className="rounded-lg border border-line bg-surface px-2 py-2">
            <p className="truncate font-mono text-sm">{parts[i] ?? '—'}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-ink-faint">{f.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-line bg-surface p-5">
        {error ? (
          <p className="text-accent">{error}</p>
        ) : (
          <p className="text-lg leading-relaxed">{text}</p>
        )}
        {!error && (
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(expr.trim());
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-3 text-sm text-accent underline underline-offset-4"
          >
            {copied ? 'Copied' : 'Copy the expression'}
          </button>
        )}
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Common ones</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.expr}
              onClick={() => setExpr(p.expr)}
              className="rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
            >
              {p.label}
              <span className="ml-2 font-mono text-xs text-ink-faint">{p.expr}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

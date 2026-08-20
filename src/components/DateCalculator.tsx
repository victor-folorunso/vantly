'use client';

import { useMemo, useState } from 'react';

/**
 * Two questions people actually ask about dates, on one page.
 *
 * How long between these two, and what date is this far from that one. They
 * are opposite sides of the same sum, and splitting them across two pages
 * would mean two pages competing for the same search.
 *
 * Everything works in local dates rather than timestamps. A day is a day on
 * the calendar here, not 86400 seconds, so a span crossing a daylight saving
 * change still counts whole days.
 */

type Mode = 'between' | 'addsub';

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parse(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DAY = 86400000;

/** Whole days between two local dates, ignoring the clock. */
function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DAY);
}

/** Years, months and days, the way a person would say it. */
function calendarSpan(from: Date, to: Date) {
  const [a, b] = from <= to ? [from, to] : [to, from];
  let years = b.getFullYear() - a.getFullYear();
  let months = b.getMonth() - a.getMonth();
  let days = b.getDate() - a.getDate();
  if (days < 0) {
    months--;
    // The length of the previous month, which is what borrowing a month means.
    days += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

function weekdaysBetween(a: Date, b: Date): number {
  const [start, end] = a <= b ? [a, b] : [b, a];
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Adds months, clamping to the end of the target month.
 *
 * Doing this with setMonth alone gives 2 March for one month after 31 January,
 * because JavaScript rolls the overflow forward. Every calendar, and every
 * person, says 29 February. The overflow is the single most common wrong
 * answer a date calculator gives.
 */
function addMonths(date: Date, months: number): Date {
  const target = new Date(date);
  const day = target.getDate();
  target.setDate(1);
  target.setMonth(target.getMonth() + months);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

const LONG = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' });

export default function DateCalculator() {
  const [mode, setMode] = useState<Mode>('between');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [start, setStart] = useState(today());
  const [amount, setAmount] = useState(30);
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days');
  const [direction, setDirection] = useState<1 | -1>(1);

  const between = useMemo(() => {
    const a = parse(from);
    const b = parse(to);
    if (!a || !b) return null;
    const days = daysBetween(a, b);
    return {
      days,
      abs: Math.abs(days),
      span: calendarSpan(a, b),
      weekdays: weekdaysBetween(a, b),
      weeks: Math.floor(Math.abs(days) / 7),
      remainder: Math.abs(days) % 7,
    };
  }, [from, to]);

  const result = useMemo(() => {
    const s = parse(start);
    if (!s) return null;
    const d = new Date(s);
    const n = amount * direction;
    if (unit === 'days') d.setDate(d.getDate() + n);
    if (unit === 'weeks') d.setDate(d.getDate() + n * 7);
    // Months and years both clamp, so 29 February plus a year is 28 February
    // rather than 1 March.
    if (unit === 'months') return addMonths(d, n);
    if (unit === 'years') return addMonths(d, n * 12);
    return d;
  }, [start, amount, unit, direction]);

  const field =
    'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent';
  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <div>
      <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
        {(
          [
            ['between', 'Days between'],
            ['addsub', 'Add or subtract'],
          ] as [Mode, string][]
        ).map(([id, text]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === id ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {mode === 'between' ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className={label}>From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
            </label>
            <label className="block text-sm">
              <span className={label}>To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={field} />
            </label>
          </div>

          {between && (
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {between.abs.toLocaleString()} day{between.abs === 1 ? '' : 's'}
              </p>
              {between.days < 0 && (
                <p className="mt-1 text-sm text-ink-faint">The second date is earlier.</p>
              )}
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">In years, months and days</dt>
                  <dd className="tabular-nums">
                    {between.span.years}y {between.span.months}m {between.span.days}d
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">In weeks</dt>
                  <dd className="tabular-nums">
                    {between.weeks}w {between.remainder}d
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Weekdays only</dt>
                  <dd className="tabular-nums">{between.weekdays.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className={label}>Starting from</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
            </label>

            <div className="flex gap-2">
              <label className="block flex-1 text-sm">
                <span className={label}>How many</span>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(Number(e.target.value) || 0, 0))}
                  className={field}
                />
              </label>
              <label className="block flex-1 text-sm">
                <span className={label}>Of</span>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as typeof unit)}
                  className={field}
                >
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                  <option value="years">years</option>
                </select>
              </label>
            </div>

            <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
              {(
                [
                  [1, 'After'],
                  [-1, 'Before'],
                ] as [1 | -1, string][]
              ).map(([d, text]) => (
                <button
                  key={text}
                  onClick={() => setDirection(d)}
                  aria-pressed={direction === d}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    direction === d ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{iso(result)}</p>
              <p className="mt-2 text-ink-soft">{LONG.format(result)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

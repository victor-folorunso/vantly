'use client';

import { useMemo, useState } from 'react';

/**
 * The small calculators, which are less trivial than they look.
 *
 * Each one here answers a question people get wrong by hand, and the wrongness
 * is the reason the tool exists: percentage change reverses badly, loan
 * payments are not principal divided by months, and compound interest is not
 * the contributions plus a percentage.
 *
 * Every number is shown broken into parts rather than as a single total,
 * because the total on its own tells you nothing about whether you believe it.
 */

function money(n: number, currency = ''): string {
  if (!Number.isFinite(n)) return '—';
  return (
    currency +
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className={strong ? 'font-medium' : 'text-ink-soft'}>{label}</span>
      <span className={`tabular-nums ${strong ? 'text-lg font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  step = 'any',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="mt-2 flex items-center gap-2">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
        />
        {suffix && <span className="shrink-0 text-sm text-ink-faint">{suffix}</span>}
      </span>
    </label>
  );
}

/* ── Percentage ───────────────────────────────────────────────────────────── */

export function PercentageCalculator() {
  const [a, setA] = useState('15');
  const [b, setB] = useState('200');
  const [c, setC] = useState('50');
  const [d, setD] = useState('200');
  const [e, setE] = useState('120');
  const [f, setF] = useState('150');

  const n = (s: string) => parseFloat(s);
  const change = ((n(f) - n(e)) / n(e)) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-medium">What is X% of Y?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Percent" value={a} onChange={setA} suffix="%" />
          <Field label="Of" value={b} onChange={setB} />
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {Number.isFinite((n(a) / 100) * n(b)) ? money((n(a) / 100) * n(b)) : '—'}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-medium">X is what percent of Y?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="This" value={c} onChange={setC} />
          <Field label="Of" value={d} onChange={setD} />
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {Number.isFinite((n(c) / n(d)) * 100) ? `${((n(c) / n(d)) * 100).toFixed(2)}%` : '—'}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-medium">Increase or decrease</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="From" value={e} onChange={setE} />
          <Field label="To" value={f} onChange={setF} />
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
        </p>
        {/* The asymmetry nobody expects, and the reason "we cut it back by the
            same percentage" is wrong. */}
        {Number.isFinite(change) && change !== 0 && (
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Going back the other way is {(((n(e) - n(f)) / n(f)) * 100).toFixed(2)}%, not{' '}
            {(-change).toFixed(2)}%. A rise and the fall that undoes it are never the
            same percentage.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Tip ──────────────────────────────────────────────────────────────────── */

export function TipCalculator() {
  const [bill, setBill] = useState('84.50');
  const [pct, setPct] = useState(15);
  const [people, setPeople] = useState('2');
  const [roundUp, setRoundUp] = useState(false);

  const b = parseFloat(bill) || 0;
  const p = Math.max(1, parseInt(people) || 1);
  let tip = (b * pct) / 100;
  let total = b + tip;
  if (roundUp) {
    total = Math.ceil(total);
    tip = total - b;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bill" value={bill} onChange={setBill} step="0.01" />
          <Field label="People" value={people} onChange={setPeople} step="1" />
        </div>

        <div className="mt-5">
          <span className="flex justify-between text-sm">
            Tip
            <span className="tabular-nums text-ink-faint">{pct}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={30}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
          <div className="mt-2 flex gap-1.5">
            {[10, 12.5, 15, 18, 20].map((v) => (
              <button
                key={v}
                onClick={() => setPct(v)}
                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                  pct === v ? 'border-accent bg-accent-soft' : 'border-line text-ink-soft'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} />
          Round the total up to a whole number
        </label>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <Row label="Bill" value={money(b)} />
        <Row label={`Tip at ${pct}%`} value={money(tip)} />
        <Row label="Total" value={money(total)} strong />
        <div className="mt-4 rounded-lg bg-surface-alt p-4">
          <Row label={`Each of ${p}`} value={money(total / p)} strong />
        </div>
        {/* The bit that causes arguments at the table. */}
        {p > 1 && Math.abs((total / p) * p - total) > 0.005 && (
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            This does not divide evenly. Someone needs to put in a penny more.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Loan ─────────────────────────────────────────────────────────────────── */

export function LoanCalculator() {
  const [amount, setAmount] = useState('250000');
  const [rate, setRate] = useState('5.5');
  const [years, setYears] = useState('25');

  const P = parseFloat(amount) || 0;
  const annual = parseFloat(rate) || 0;
  const n = (parseFloat(years) || 0) * 12;
  const i = annual / 100 / 12;

  // The amortisation formula. Interest free is a separate case, because the
  // formula divides by zero when the rate is nothing.
  const payment = i === 0 ? (n ? P / n : 0) : (P * i) / (1 - Math.pow(1 + i, -n));
  const totalPaid = payment * n;
  const interest = totalPaid - P;

  const schedule = useMemo(() => {
    if (!Number.isFinite(payment) || n <= 0) return [];
    const rows: { year: number; balance: number; paid: number; interest: number }[] = [];
    let balance = P;
    let paidInterest = 0;
    for (let m = 1; m <= n; m++) {
      const monthInterest = balance * i;
      paidInterest += monthInterest;
      balance = balance + monthInterest - payment;
      if (m % 12 === 0 || m === n) {
        rows.push({
          year: Math.ceil(m / 12),
          balance: Math.max(0, balance),
          paid: payment * m,
          interest: paidInterest,
        });
      }
    }
    return rows;
  }, [P, i, n, payment]);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="space-y-4">
            <Field label="Amount borrowed" value={amount} onChange={setAmount} />
            <Field label="Interest rate" value={rate} onChange={setRate} suffix="% a year" step="0.01" />
            <Field label="Over" value={years} onChange={setYears} suffix="years" />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <Row label="Monthly payment" value={money(payment)} strong />
          <Row label="Total repaid" value={money(totalPaid)} />
          <Row label="Of which interest" value={money(interest)} />
          <Row
            label="Interest as a share of what you borrowed"
            value={P ? `${((interest / P) * 100).toFixed(0)}%` : '—'}
          />
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            The monthly payment is not the amount divided by the months. Early
            payments are mostly interest, which is why paying a little extra at
            the start saves so much more than the same amount later.
          </p>
        </div>
      </div>

      {schedule.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-left">
                <th className="px-4 py-2 font-semibold">Year</th>
                <th className="px-4 py-2 text-right font-semibold">Paid so far</th>
                <th className="px-4 py-2 text-right font-semibold">Interest so far</th>
                <th className="px-4 py-2 text-right font-semibold">Still owed</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((r) => (
                <tr key={r.year} className="border-t border-line">
                  <td className="px-4 py-1.5 tabular-nums">{r.year}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums">{money(r.paid)}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums">{money(r.interest)}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums">{money(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Compound interest ────────────────────────────────────────────────────── */

export function CompoundCalculator() {
  const [initial, setInitial] = useState('1000');
  const [monthly, setMonthly] = useState('200');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('20');

  const P = parseFloat(initial) || 0;
  const M = parseFloat(monthly) || 0;
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const n = (parseFloat(years) || 0) * 12;

  const rows = useMemo(() => {
    const out: { year: number; balance: number; contributed: number }[] = [];
    let balance = P;
    let contributed = P;
    for (let m = 1; m <= n; m++) {
      balance = balance * (1 + r) + M;
      contributed += M;
      if (m % 12 === 0) out.push({ year: m / 12, balance, contributed });
    }
    return out;
  }, [P, M, r, n]);

  const last = rows[rows.length - 1];
  const growth = last ? last.balance - last.contributed : 0;
  const max = last?.balance ?? 1;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="space-y-4">
          <Field label="Starting amount" value={initial} onChange={setInitial} />
          <Field label="Added each month" value={monthly} onChange={setMonthly} />
          <Field label="Return" value={rate} onChange={setRate} suffix="% a year" step="0.1" />
          <Field label="For" value={years} onChange={setYears} suffix="years" />
        </div>
      </div>

      <div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <Row label="Final balance" value={money(last?.balance ?? P)} strong />
          <Row label="You put in" value={money(last?.contributed ?? P)} />
          <Row label="Growth" value={money(growth)} />
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            An estimate at a fixed rate. Real returns are not a straight line,
            and this ignores inflation, fees and tax, all of which are real.
          </p>
        </div>

        {rows.length > 0 && (
          <div className="mt-5 rounded-xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Contributions against growth
            </p>
            <div className="mt-4 flex h-40 items-end gap-1">
              {rows.map((row) => (
                <div key={row.year} className="flex flex-1 flex-col justify-end" title={`Year ${row.year}: ${money(row.balance)}`}>
                  <div
                    className="w-full rounded-t-sm bg-accent"
                    style={{ height: `${((row.balance - row.contributed) / max) * 100}%` }}
                  />
                  <div
                    className="w-full bg-ink-faint/40"
                    style={{ height: `${(row.contributed / max) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-accent" /> Growth
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-ink-faint/40" /> What you put in
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

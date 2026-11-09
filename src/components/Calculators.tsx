'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { type Fraction, fromDecimal, mixed, parseFraction, parseNumbers, pricing, roi, stats, toDecimal } from '@/lib/calc';

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
  if (!Number.isFinite(n)) return '';
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
          {Number.isFinite((n(a) / 100) * n(b)) ? money((n(a) / 100) * n(b)) : ''}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-medium">X is what percent of Y?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="This" value={c} onChange={setC} />
          <Field label="Of" value={d} onChange={setD} />
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {Number.isFinite((n(c) / n(d)) * 100) ? `${((n(c) / n(d)) * 100).toFixed(2)}%` : ''}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-medium">Increase or decrease</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="From" value={e} onChange={setE} />
          <Field label="To" value={f} onChange={setF} />
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {Number.isFinite(change) ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : ''}
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
    <ToolLayout
      title="The bill"
      settings={
        <>
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
        </>
      }
    >
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
    </ToolLayout>
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
    <ToolLayout
      title="Your numbers"
      settings={
        <div className="space-y-4">
          <Field label="Amount borrowed" value={amount} onChange={setAmount} />
          <Field label="Interest rate" value={rate} onChange={setRate} suffix="% a year" step="0.01" />
          <Field label="Over" value={years} onChange={setYears} suffix="years" />
        </div>
      }
    >
      <div className="rounded-xl border border-line bg-surface p-5">
        <Row label="Monthly payment" value={money(payment)} strong />
        <Row label="Total repaid" value={money(totalPaid)} />
        <Row label="Of which interest" value={money(interest)} />
        <Row
          label="Interest as a share of what you borrowed"
          value={P ? `${((interest / P) * 100).toFixed(0)}%` : ''}
        />
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
    </ToolLayout>
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
    <ToolLayout
      title="Your numbers"
      settings={
        <div className="space-y-4">
          <Field label="Starting amount" value={initial} onChange={setInitial} />
          <Field label="Added each month" value={monthly} onChange={setMonthly} />
          <Field label="Return" value={rate} onChange={setRate} suffix="% a year" step="0.1" />
          <Field label="For" value={years} onChange={setYears} suffix="years" />
        </div>
      }
    >
      <div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <Row label="Final balance" value={money(last?.balance ?? P)} strong />
          <Row label="You put in" value={money(last?.contributed ?? P)} />
          <Row label="Growth" value={money(growth)} />
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
    </ToolLayout>
  );
}

/* ── Statistics ───────────────────────────────────────────────────────────── */

function num(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return '–';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function StatisticsCalculator() {
  const [text, setText] = useState('12, 15, 15, 18, 21, 22, 22, 22, 25, 31');
  const { values, rejected } = useMemo(() => parseNumbers(text), [text]);
  const s = useMemo(() => stats(values), [values]);

  return (
    <ToolLayout
      title="Your numbers"
      settings={
        <div>
          <label className="block text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">Data</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm outline-none focus:border-accent"
            />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Separate them with commas, spaces or new lines. Paste a column straight from a spreadsheet. Write large
            numbers without thousands separators.
          </p>
          {rejected.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-accent">
              Skipped {rejected.length === 1 ? 'one entry that is' : `${rejected.length} entries that are`} not a number:{' '}
              {rejected.slice(0, 5).join(', ')}
              {rejected.length > 5 ? '…' : ''}
            </p>
          )}
        </div>
      }
    >
      {!s ? (
        <p className="text-sm text-ink-faint">Enter some numbers.</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5">
            <Row label="Count" value={num(s.count)} />
            <Row label="Sum" value={num(s.sum)} />
            <Row label="Mean (average)" value={num(s.mean)} strong />
            <Row label="Median (middle value)" value={num(s.median)} strong />
            <Row
              label={s.modes.length > 1 ? 'Modes (most common)' : 'Mode (most common)'}
              value={s.modes.length ? `${s.modes.map((m) => num(m)).join(', ')} (×${s.modeCount})` : 'None, nothing repeats'}
            />
            <Row label="Smallest" value={num(s.min)} />
            <Row label="Largest" value={num(s.max)} />
            <Row label="Range" value={num(s.range)} />
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <Row label="Standard deviation (sample)" value={num(s.sampleSd)} strong />
            <Row label="Standard deviation (population)" value={num(s.populationSd)} />
            <Row label="Variance (sample)" value={num(s.sampleVariance)} />
            <Row label="Variance (population)" value={num(s.populationVariance)} />
            <Row label="Standard error of the mean" value={num(s.standardError)} />
            <Row label="Lower quartile" value={num(s.q1)} />
            <Row label="Upper quartile" value={num(s.q3)} />
            <Row label="Interquartile range" value={num(s.iqr)} />
          </div>
          <p className="text-sm leading-relaxed text-ink-soft xl:col-span-2">
            Use the sample figures when your numbers are some of a larger group, such as a survey of a few customers,
            and the population figures when they are the whole group. With one number there is no sample spread to
            measure. Quartiles are worked out the way Excel&apos;s QUARTILE.INC does it.
          </p>
        </div>
      )}
    </ToolLayout>
  );
}

/* ── Fraction to decimal ──────────────────────────────────────────────────── */

function DecimalOut({ f }: { f: Fraction }) {
  const d = toDecimal(f);
  return (
    <span className="break-all font-mono text-2xl tabular-nums">
      {d.sign}
      {d.whole}
      {(d.fixed || d.repeat) && '.'}
      {d.fixed}
      {d.repeat && <span className="overline decoration-2">{d.repeat}</span>}
      {d.truncated && '…'}
    </span>
  );
}

export function FractionCalculator() {
  const [frac, setFrac] = useState('5/12');
  const [dec, setDec] = useState('0.1(6)');

  const a = useMemo(() => {
    try {
      return { ok: true as const, f: parseFraction(frac) };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : '' };
    }
  }, [frac]);
  const b = useMemo(() => {
    try {
      return { ok: true as const, f: fromDecimal(dec) };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : '' };
    }
  }, [dec]);

  const input =
    'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-lg outline-none focus:border-accent';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Fraction to decimal</span>
          <input value={frac} onChange={(e) => setFrac(e.target.value)} placeholder="3/8" className={input} />
        </label>
        <div className="mt-5 min-h-[5rem]">
          {a.ok ? (
            <>
              <DecimalOut f={a.f} />
              {(() => {
                const d = toDecimal(a.f);
                const reduced = `${a.f.num}/${a.f.den}`;
                const m = mixed(a.f);
                return (
                  <dl className="mt-4 text-sm">
                    {reduced !== frac.replace(/\s/g, '') && a.f.den !== BigInt(1) && <Row label="In lowest terms" value={reduced} />}
                    {m && <Row label="As a mixed number" value={m} />}
                    {d.repeat && (
                      <Row label="Repeats" value={`${d.repeat.length} digit${d.repeat.length === 1 ? '' : 's'}, forever`} />
                    )}
                    <Row label="As a percentage" value={`${(Number(a.f.num) / Number(a.f.den) * 100).toLocaleString(undefined, { maximumFractionDigits: 6 })}%`} />
                  </dl>
                );
              })()}
            </>
          ) : (
            <p className="text-sm text-accent">{a.message}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Decimal to fraction</span>
          <input value={dec} onChange={(e) => setDec(e.target.value)} placeholder="0.625" className={input} />
        </label>
        <div className="mt-5 min-h-[5rem]">
          {b.ok ? (
            <>
              <span className="font-mono text-2xl tabular-nums">
                {b.f.den === BigInt(1) ? b.f.num.toString() : `${b.f.num}/${b.f.den}`}
              </span>
              {mixed(b.f) && (
                <dl className="mt-4 text-sm">
                  <Row label="As a mixed number" value={mixed(b.f)!} />
                </dl>
              )}
            </>
          ) : (
            <p className="text-sm text-accent">{b.message}</p>
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          For a repeating decimal, put the part that repeats in brackets: 0.(3) is a third, 0.1(6) is a sixth. Three
          dots at the end, 0.333..., repeat the last digit.
        </p>
      </section>
    </div>
  );
}

/* ── Profit margin ────────────────────────────────────────────────────────── */

type PricingMode = 'both' | 'margin' | 'markup';

export function ProfitMarginCalculator() {
  const [mode, setMode] = useState<PricingMode>('both');
  const [cost, setCost] = useState('60');
  const [price, setPrice] = useState('100');
  const [target, setTarget] = useState('40');

  const result = useMemo(() => {
    const c = parseFloat(cost);
    const p = parseFloat(price);
    const t = parseFloat(target) / 100;
    try {
      if (!Number.isFinite(c)) return null;
      if (mode === 'both') return Number.isFinite(p) ? pricing({ cost: c, price: p }) : null;
      if (!Number.isFinite(t)) return null;
      return mode === 'margin' ? pricing({ cost: c, margin: t }) : pricing({ cost: c, markup: t });
    } catch (e) {
      return { error: e instanceof Error ? e.message : '' };
    }
  }, [mode, cost, price, target]);

  const pct = (n: number) => (Number.isFinite(n) ? `${(n * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%` : '–');

  return (
    <ToolLayout
      title="Your numbers"
      settings={
        <div className="space-y-4">
          <fieldset className="space-y-1.5 text-sm">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint">I know</legend>
            {(
              [
                ['both', 'The cost and the price'],
                ['margin', 'The cost and the margin I want'],
                ['markup', 'The cost and the markup I want'],
              ] as const
            ).map(([m, text]) => (
              <label key={m} className="mt-2 flex items-center gap-2">
                <input type="radio" name="pm-mode" checked={mode === m} onChange={() => setMode(m)} />
                {text}
              </label>
            ))}
          </fieldset>
          <Field label="Cost" value={cost} onChange={setCost} />
          {mode === 'both' ? (
            <Field label="Selling price" value={price} onChange={setPrice} />
          ) : (
            <Field label={mode === 'margin' ? 'Margin' : 'Markup'} value={target} onChange={setTarget} suffix="%" />
          )}
        </div>
      }
    >
      {result && 'error' in result ? (
        <p className="text-sm text-accent">{result.error}</p>
      ) : result ? (
        <div>
          <div className="rounded-xl border border-line bg-surface p-5">
            {mode !== 'both' && <Row label="Charge" value={money(result.price)} strong />}
            <Row label="Profit on each sale" value={money(result.profit)} strong={mode === 'both'} />
            <Row label="Gross margin" value={pct(result.margin)} strong={mode === 'both'} />
            <Row label="Markup" value={pct(result.markup)} />
            {mode === 'both' && <Row label="Cost as a share of the price" value={pct(result.cost / result.price)} />}
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Margin is profit as a share of the price. Markup is profit as a share of the cost. Buying at 60 and selling
            at 100 is a 40% margin but a 67% markup, and pricing with one when you meant the other is a common way to
            earn less than planned.
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink-faint">Fill in both numbers.</p>
      )}
    </ToolLayout>
  );
}

/* ── ROI ──────────────────────────────────────────────────────────────────── */

export function RoiCalculator() {
  const [invested, setInvested] = useState('5000');
  const [returned, setReturned] = useState('7200');
  const [years, setYears] = useState('3');

  const r = useMemo(() => {
    try {
      return roi(parseFloat(invested), parseFloat(returned) || 0, parseFloat(years) || undefined);
    } catch (e) {
      return { error: e instanceof Error ? e.message : '' };
    }
  }, [invested, returned, years]);

  const pct = (n: number) => `${(n * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;

  return (
    <ToolLayout
      title="Your numbers"
      settings={
        <div className="space-y-4">
          <Field label="Amount invested" value={invested} onChange={setInvested} />
          <Field label="Amount returned" value={returned} onChange={setReturned} />
          <Field label="Over (optional)" value={years} onChange={setYears} suffix="years" />
        </div>
      }
    >
      {'error' in r ? (
        <p className="text-sm text-accent">{r.error}</p>
      ) : (
        <div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <Row label="Return on investment" value={pct(r.roi)} strong />
            <Row label={r.gain >= 0 ? 'Gain' : 'Loss'} value={money(Math.abs(r.gain))} />
            {r.annual !== null && <Row label="Each year, compounded" value={pct(r.annual)} strong />}
            <Row label="Every 1 put in came back as" value={(parseFloat(returned) / parseFloat(invested)).toFixed(2)} />
          </div>
          {r.annual !== null && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
              The yearly figure is the steady rate that would turn what you invested into what came back over that many
              years. It is not the total divided by the years: {pct(r.roi)} over {years} years is {pct(r.annual)} a
              year, not {pct(r.roi / parseFloat(years))}, because each year&apos;s growth builds on the last.
            </p>
          )}
        </div>
      )}
    </ToolLayout>
  );
}

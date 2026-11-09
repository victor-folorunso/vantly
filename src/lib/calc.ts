/**
 * The arithmetic behind the statistics, fraction, margin and ROI calculators,
 * kept apart from the screens so it can be tested on its own.
 */

/* ── Statistics ─────────────────────────────────────────────────────────── */

/** Numbers out of pasted text: commas, spaces, tabs, semicolons or lines. */
export function parseNumbers(text: string): { values: number[]; rejected: string[] } {
  const values: number[] = [];
  const rejected: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    if (!raw) continue;
    // A thousands separator would have been split above, so 1,000 cannot be
    // supported alongside comma separated lists. Spaces and lines are the
    // safer separator for large numbers, and the page says so.
    const n = Number(raw.replace(/^\((.*)\)$/, '-$1'));
    if (Number.isFinite(n)) values.push(n);
    else rejected.push(raw);
  }
  return { values, rejected };
}

/** Linear interpolation between ranks, the method Excel's QUARTILE.INC and
 *  R's default use, so the answer matches what people check it against. */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export type Stats = {
  count: number;
  sum: number;
  mean: number;
  median: number;
  /** Empty when every value appears once: then there is no mode. */
  modes: number[];
  modeCount: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  /** n - 1 in the denominator: for a sample drawn from something larger. */
  sampleVariance: number;
  sampleSd: number;
  /** n in the denominator: when the list is everything there is. */
  populationVariance: number;
  populationSd: number;
  standardError: number;
};

export function stats(values: number[]): Stats | null {
  const n = values.length;
  if (!n) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  // Two passes rather than the sum-of-squares shortcut, which loses
  // precision badly when the values are large and close together.
  const ss = values.reduce((a, v) => a + (v - mean) ** 2, 0);

  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  const top = Math.max(...freq.values());
  const modes = top > 1 ? [...freq].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b) : [];

  const sampleVariance = n > 1 ? ss / (n - 1) : NaN;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  return {
    count: n,
    sum,
    mean,
    median: quantile(sorted, 0.5),
    modes,
    modeCount: top,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    q1,
    q3,
    iqr: q3 - q1,
    sampleVariance,
    sampleSd: Math.sqrt(sampleVariance),
    populationVariance: ss / n,
    populationSd: Math.sqrt(ss / n),
    standardError: Math.sqrt(sampleVariance) / Math.sqrt(n),
  };
}

/* ── Fractions ──────────────────────────────────────────────────────────── */

const babs = (a: bigint) => (a < BigInt(0) ? -a : a);

export function gcd(a: bigint, b: bigint): bigint {
  a = babs(a);
  b = babs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export type Fraction = { num: bigint; den: bigint };

export function reduce({ num, den }: Fraction): Fraction {
  if (den === BigInt(0)) throw new Error('A fraction cannot have zero on the bottom.');
  if (den < BigInt(0)) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den) || BigInt(1);
  return { num: num / g, den: den / g };
}

/** "3/4", "-7 / 8", "1 1/2" (a mixed number) or a whole number. */
export function parseFraction(s: string): Fraction {
  const t = s.trim();
  let m = /^(-)?\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (m) {
    const den = BigInt(m[4]);
    const num = BigInt(m[2]) * den + BigInt(m[3]);
    return reduce({ num: m[1] ? -num : num, den });
  }
  m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(t);
  if (m) return reduce({ num: BigInt(m[1]), den: BigInt(m[2]) });
  m = /^-?\d+$/.exec(t);
  if (m) return { num: BigInt(t), den: BigInt(1) };
  throw new Error('Write it as 3/4, or as a mixed number like 1 1/2.');
}

/**
 * Long division that notices when a remainder comes round again, which is
 * the moment the digits start repeating. Exact for any fraction, where a
 * float would give 0.30000000000000004 and stop.
 */
export function toDecimal(f: Fraction, maxDigits = 2000): { sign: string; whole: string; fixed: string; repeat: string; truncated: boolean } {
  const { num, den } = reduce(f);
  const sign = num < BigInt(0) ? '-' : '';
  const n = babs(num);
  const whole = (n / den).toString();
  let r = n % den;
  const seen = new Map<string, number>();
  let digits = '';
  while (r !== BigInt(0) && !seen.has(r.toString()) && digits.length < maxDigits) {
    seen.set(r.toString(), digits.length);
    r *= BigInt(10);
    digits += (r / den).toString();
    r %= den;
  }
  if (r !== BigInt(0) && seen.has(r.toString())) {
    const at = seen.get(r.toString())!;
    return { sign, whole, fixed: digits.slice(0, at), repeat: digits.slice(at), truncated: false };
  }
  return { sign, whole, fixed: digits, repeat: '', truncated: r !== BigInt(0) };
}

/**
 * A decimal back to a fraction. Accepts a repeating part in brackets, 0.1(6),
 * or a trailing ellipsis, 0.333..., which is read as the last digit repeating.
 */
export function fromDecimal(s: string): Fraction {
  let t = s.trim().replace(/\s/g, '');
  if (/(\.\.\.|…)$/.test(t)) {
    const body = t.replace(/(\.\.\.|…)$/, '');
    const m = /^(-?\d*)\.(\d*)$/.exec(body);
    if (!m || !m[2]) throw new Error('Put at least one digit before the dots.');
    // Dots mean the last digit goes on: 0.1666... is 0.1(6). A longer
    // repeat has to be written in brackets, 0.(142857).
    t = `${m[1]}.${m[2].slice(0, -1)}(${m[2].slice(-1)})`;
  }
  const m = /^(-)?(\d*)(?:\.(\d*)(?:\((\d+)\))?)?$/.exec(t);
  if (!m || (!m[2] && !m[3] && !m[4])) throw new Error('That is not a decimal number.');
  const sign = m[1] ? BigInt(-1) : BigInt(1);
  const whole = BigInt(m[2] || '0');
  const fixed = m[3] ?? '';
  const repeat = m[4] ?? '';
  const ten = BigInt(10);
  if (!repeat) {
    const den = ten ** BigInt(fixed.length);
    return reduce({ num: sign * (whole * den + BigInt(fixed || '0')), den });
  }
  // x = whole.fixed(repeat): shifting by the repeat length and subtracting
  // cancels the repeating tail.
  const k = BigInt(fixed.length);
  const r = BigInt(repeat.length);
  const all = BigInt((fixed + repeat) || '0');
  const head = BigInt(fixed || '0');
  const den = ten ** k * (ten ** r - BigInt(1));
  const num = all - head;
  return reduce({ num: sign * (whole * den + num), den });
}

export function mixed({ num, den }: Fraction): string | null {
  const n = babs(num);
  if (den === BigInt(1) || n < den) return null;
  const w = n / den;
  const rest = n % den;
  return `${num < BigInt(0) ? '-' : ''}${w}${rest ? ` ${rest}/${den}` : ''}`;
}

/* ── Margin and markup ──────────────────────────────────────────────────── */

export type Pricing = { cost: number; price: number; profit: number; margin: number; markup: number };

/** From any two of cost, price, margin and markup. Margins are fractions. */
export function pricing(input: { cost?: number; price?: number; margin?: number; markup?: number }): Pricing {
  let { cost, price } = input;
  const { margin, markup } = input;
  if (cost !== undefined && price === undefined) {
    if (margin !== undefined) {
      if (margin >= 1) throw new Error('A margin of 100% or more would need an infinite price.');
      price = cost / (1 - margin);
    } else if (markup !== undefined) price = cost * (1 + markup);
  } else if (price !== undefined && cost === undefined) {
    if (margin !== undefined) cost = price * (1 - margin);
    else if (markup !== undefined) cost = price / (1 + markup);
  }
  if (cost === undefined || price === undefined) throw new Error('Give two of the four.');
  const profit = price - cost;
  return { cost, price, profit, margin: price ? profit / price : NaN, markup: cost ? profit / cost : NaN };
}

/* ── Return on investment ───────────────────────────────────────────────── */

export function roi(invested: number, returned: number, years?: number): { gain: number; roi: number; annual: number | null } {
  if (!(invested > 0)) throw new Error('Put in what you invested, more than zero.');
  const gain = returned - invested;
  const ratio = returned / invested;
  const annual = years && years > 0 && ratio >= 0 ? ratio ** (1 / years) - 1 : null;
  return { gain, roi: gain / invested, annual };
}

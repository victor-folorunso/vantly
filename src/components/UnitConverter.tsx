'use client';

import { useMemo, useState } from 'react';

/**
 * Unit conversion, done through a base unit rather than a table of pairs.
 *
 * Every unit stores its size in one canonical unit for its family, so any
 * conversion is two multiplications. A pair table needs n squared entries and
 * every one of them is a chance to type a wrong constant that nobody notices,
 * because a slightly wrong furlong is not a crash.
 *
 * Temperature does not fit that model, since Fahrenheit has an offset as well
 * as a scale, so it carries explicit functions instead of a factor. Pretending
 * it fits is the classic bug in these tools.
 *
 * All factors here are exact by definition rather than rounded: the inch is
 * defined as exactly 25.4mm, the pound as exactly 0.45359237kg. Those are
 * definitions, not measurements.
 */

type Unit = {
  id: string;
  label: string;
  /** How many base units one of these is. */
  factor?: number;
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
};

type Family = { id: string; label: string; base: string; units: Unit[] };

const FAMILIES: Family[] = [
  {
    id: 'length',
    label: 'Length',
    base: 'metre',
    units: [
      { id: 'mm', label: 'Millimetres', factor: 0.001 },
      { id: 'cm', label: 'Centimetres', factor: 0.01 },
      { id: 'm', label: 'Metres', factor: 1 },
      { id: 'km', label: 'Kilometres', factor: 1000 },
      { id: 'in', label: 'Inches', factor: 0.0254 },
      { id: 'ft', label: 'Feet', factor: 0.3048 },
      { id: 'yd', label: 'Yards', factor: 0.9144 },
      { id: 'mi', label: 'Miles', factor: 1609.344 },
      { id: 'nmi', label: 'Nautical miles', factor: 1852 },
    ],
  },
  {
    id: 'mass',
    label: 'Weight',
    base: 'kilogram',
    units: [
      { id: 'mg', label: 'Milligrams', factor: 1e-6 },
      { id: 'g', label: 'Grams', factor: 0.001 },
      { id: 'kg', label: 'Kilograms', factor: 1 },
      { id: 't', label: 'Tonnes', factor: 1000 },
      { id: 'oz', label: 'Ounces', factor: 0.028349523125 },
      { id: 'lb', label: 'Pounds', factor: 0.45359237 },
      { id: 'st', label: 'Stone', factor: 6.35029318 },
    ],
  },
  {
    id: 'temp',
    label: 'Temperature',
    base: 'celsius',
    units: [
      { id: 'c', label: 'Celsius', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: 'Fahrenheit', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', label: 'Kelvin', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    base: 'square metre',
    units: [
      { id: 'cm2', label: 'Square centimetres', factor: 0.0001 },
      { id: 'm2', label: 'Square metres', factor: 1 },
      { id: 'ha', label: 'Hectares', factor: 10000 },
      { id: 'km2', label: 'Square kilometres', factor: 1e6 },
      { id: 'ft2', label: 'Square feet', factor: 0.09290304 },
      { id: 'ac', label: 'Acres', factor: 4046.8564224 },
      { id: 'mi2', label: 'Square miles', factor: 2589988.110336 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    base: 'litre',
    units: [
      { id: 'ml', label: 'Millilitres', factor: 0.001 },
      { id: 'l', label: 'Litres', factor: 1 },
      { id: 'm3', label: 'Cubic metres', factor: 1000 },
      { id: 'tsp', label: 'Teaspoons (US)', factor: 0.00492892159375 },
      { id: 'tbsp', label: 'Tablespoons (US)', factor: 0.01478676478125 },
      { id: 'cup', label: 'Cups (US)', factor: 0.2365882365 },
      { id: 'flozus', label: 'Fluid ounces (US)', factor: 0.0295735295625 },
      { id: 'flozuk', label: 'Fluid ounces (UK)', factor: 0.0284130625 },
      { id: 'ptus', label: 'Pints (US)', factor: 0.473176473 },
      { id: 'ptuk', label: 'Pints (UK)', factor: 0.56826125 },
      { id: 'galus', label: 'Gallons (US)', factor: 3.785411784 },
      { id: 'galuk', label: 'Gallons (UK)', factor: 4.54609 },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    base: 'metre per second',
    units: [
      { id: 'ms', label: 'Metres per second', factor: 1 },
      { id: 'kmh', label: 'Kilometres per hour', factor: 1 / 3.6 },
      { id: 'mph', label: 'Miles per hour', factor: 0.44704 },
      { id: 'kn', label: 'Knots', factor: 0.514444444444 },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    base: 'byte',
    units: [
      { id: 'B', label: 'Bytes', factor: 1 },
      { id: 'KB', label: 'Kilobytes (1000)', factor: 1e3 },
      { id: 'MB', label: 'Megabytes (1000)', factor: 1e6 },
      { id: 'GB', label: 'Gigabytes (1000)', factor: 1e9 },
      { id: 'TB', label: 'Terabytes (1000)', factor: 1e12 },
      { id: 'KiB', label: 'Kibibytes (1024)', factor: 1024 },
      { id: 'MiB', label: 'Mebibytes (1024)', factor: 1024 ** 2 },
      { id: 'GiB', label: 'Gibibytes (1024)', factor: 1024 ** 3 },
      { id: 'TiB', label: 'Tebibytes (1024)', factor: 1024 ** 4 },
    ],
  },
];

function toBase(u: Unit, v: number): number {
  return u.toBase ? u.toBase(v) : v * (u.factor ?? 1);
}
function fromBase(u: Unit, v: number): number {
  return u.fromBase ? u.fromBase(v) : v / (u.factor ?? 1);
}

/** Enough digits to be useful, without pretending to a precision we do not have. */
function pretty(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(6);
  const decimals = abs >= 100 ? 2 : abs >= 1 ? 4 : 8;
  return parseFloat(n.toFixed(decimals)).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

export default function UnitConverter() {
  const [familyId, setFamilyId] = useState('length');
  const [value, setValue] = useState('1');
  const [fromId, setFromId] = useState('m');
  const [toId, setToId] = useState('ft');

  const family = FAMILIES.find((f) => f.id === familyId)!;
  const from = family.units.find((u) => u.id === fromId) ?? family.units[0];
  const to = family.units.find((u) => u.id === toId) ?? family.units[1];

  const n = parseFloat(value);
  const base = Number.isNaN(n) ? NaN : toBase(from, n);
  const result = Number.isNaN(base) ? NaN : fromBase(to, base);

  const all = useMemo(
    () =>
      Number.isNaN(base)
        ? []
        : family.units.map((u) => ({ unit: u, value: fromBase(u, base) })),
    [family, base],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFamilyId(f.id);
              setFromId(f.units[0].id);
              setToId(f.units[1].id);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              f.id === familyId
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-ink-soft hover:border-ink-faint'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            From
          </label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-lg tabular-nums outline-none focus:border-accent"
          />
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {family.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFromId(toId);
            setToId(fromId);
            if (!Number.isNaN(result)) setValue(String(parseFloat(result.toFixed(8))));
          }}
          title="Swap"
          className="mb-[4.25rem] hidden size-10 shrink-0 place-items-center self-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:border-accent hover:text-accent sm:grid"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16H3m0 0 3-3m-3 3 3 3M17 8h4m0 0-3-3m3 3-3 3" />
          </svg>
        </button>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            To
          </label>
          <output className="mt-2 block w-full truncate rounded-lg border border-line bg-surface-alt px-3 py-2.5 text-lg tabular-nums">
            {Number.isNaN(result) ? '' : pretty(result)}
          </output>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {family.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Every other unit at once, because half the time the question is not
          which one you picked but what the number looks like elsewhere. */}
      {all.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-line">
          <p className="border-b border-line bg-surface-alt px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Everything else
          </p>
          <ul className="divide-y divide-line">
            {all.map(({ unit, value: v }) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-4 bg-surface px-4 py-2 text-sm"
              >
                <span className="text-ink-soft">{unit.label}</span>
                <span className="tabular-nums">{pretty(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {familyId === 'data' && (
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Both meanings of kilobyte are listed. Storage manufacturers use 1000
          and operating systems mostly use 1024, which is the entire reason a new
          1TB drive shows up as 931GB.
        </p>
      )}
    </div>
  );
}

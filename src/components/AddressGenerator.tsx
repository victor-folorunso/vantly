'use client';

import { useCallback, useEffect, useState } from 'react';
import ToolLayout from '@/components/ToolLayout';
import DownloadButton from '@/components/DownloadButton';
import { useSetting } from '@/lib/remember';

/**
 * Test addresses in each country's own shape.
 *
 * Street names are combinations of common words, towns are real (a form that
 * validates the town against a list would reject an invented one), and the
 * postcode is random in the right format, so it will rarely match the town.
 * That is deliberate: these are for filling a test database or a form while
 * building it, and they should not lead anywhere.
 *
 * Phone numbers come only from ranges set aside for fiction: 555-0100 to
 * 555-0199 in North America, Ofcom's drama numbers in the UK, ACMA's in
 * Australia and ARCEP's in France. Countries without such a range get no
 * phone number rather than one that might ring somebody.
 */

type Address = { name: string; line1: string; line2: string; city: string; region: string; postcode: string; country: string; phone: string };

const pick = <T,>(a: readonly T[]): T => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return a[buf[0] % a.length];
};
const int = (lo: number, hi: number) => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return lo + (buf[0] % (hi - lo + 1));
};
const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join('');
const letter = (from = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') => from[int(0, from.length - 1)];

const WORDS = ['Maple', 'Oak', 'Cedar', 'Elm', 'Willow', 'Birch', 'Lake', 'Hill', 'Park', 'Mill', 'River', 'Station', 'Church', 'Meadow', 'Orchard', 'Spring', 'Brook', 'Highland', 'Sunset', 'Forest', 'Valley', 'Garden', 'Harbour', 'Bridge'];
const FIRST = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Rowan', 'Elliot', 'Noor', 'Tobi', 'Ana', 'Kenji', 'Priya', 'Lucas', 'Amara', 'Mateo'];
const LAST = ['Smith', 'Okafor', 'García', 'Chen', 'Müller', 'Martin', 'Singh', 'Brown', 'Adeyemi', 'Rossi', 'Kowalski', 'Nguyen', 'Silva', 'Jones', 'Dubois', 'Patel', 'Walker', 'Kim', 'Hughes', 'Novak'];

type Country = { id: string; name: string; make: () => Omit<Address, 'name' | 'country'> };

const COUNTRIES: Country[] = [
  {
    id: 'us',
    name: 'United States',
    make: () => {
      const [city, region, area] = pick([
        ['Springfield', 'IL', '217'], ['Austin', 'TX', '512'], ['Portland', 'OR', '503'], ['Columbus', 'OH', '614'],
        ['Denver', 'CO', '303'], ['Raleigh', 'NC', '919'], ['Madison', 'WI', '608'], ['Tucson', 'AZ', '520'],
        ['Albany', 'NY', '518'], ['Boise', 'ID', '208'],
      ] as const);
      return {
        line1: `${int(10, 9899)} ${pick(WORDS)} ${pick(['St', 'Ave', 'Rd', 'Blvd', 'Ln', 'Dr', 'Ct'])}`,
        line2: int(0, 3) === 0 ? `Apt ${int(1, 40)}${letter('ABCD')}` : '',
        city, region, postcode: digits(5), phone: `(${area}) 555-01${digits(2)}`,
      };
    },
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    make: () => {
      const [city, area] = pick([
        ['Leeds', 'LS'], ['Bristol', 'BS'], ['York', 'YO'], ['Norwich', 'NR'], ['Cardiff', 'CF'], ['Exeter', 'EX'],
        ['Glasgow', 'G'], ['Leicester', 'LE'], ['Brighton', 'BN'], ['Belfast', 'BT'],
      ] as const);
      return {
        line1: `${int(1, 240)} ${pick(WORDS)} ${pick(['Road', 'Street', 'Lane', 'Close', 'Avenue', 'Gardens', 'Way'])}`,
        line2: int(0, 4) === 0 ? `Flat ${int(1, 24)}` : '',
        city, region: '', postcode: `${area}${int(1, 20)} ${int(1, 9)}${letter('ABDEFGHJLNPQRSTUWXYZ')}${letter('ABDEFGHJLNPQRSTUWXYZ')}`,
        phone: `07700 900${digits(3)}`,
      };
    },
  },
  {
    id: 'ca',
    name: 'Canada',
    make: () => {
      const [city, region, first, area] = pick([
        ['Halifax', 'NS', 'B', '902'], ['Ottawa', 'ON', 'K', '613'], ['Winnipeg', 'MB', 'R', '204'], ['Calgary', 'AB', 'T', '403'],
        ['Victoria', 'BC', 'V', '250'], ['Regina', 'SK', 'S', '306'], ['Québec', 'QC', 'G', '418'],
      ] as const);
      const L = 'ABCEGHJKLMNPRSTVWXYZ';
      return {
        line1: `${int(10, 4999)} ${pick(WORDS)} ${pick(['Street', 'Avenue', 'Road', 'Drive', 'Crescent'])}`,
        line2: int(0, 3) === 0 ? `Unit ${int(100, 1999)}` : '',
        city, region, postcode: `${first}${int(0, 9)}${letter(L)} ${int(0, 9)}${letter(L)}${int(0, 9)}`, phone: `(${area}) 555-01${digits(2)}`,
      };
    },
  },
  {
    id: 'au',
    name: 'Australia',
    make: () => {
      const [city, region, lo, area] = pick([
        ['Newcastle', 'NSW', 2000, '02'], ['Geelong', 'VIC', 3000, '03'], ['Townsville', 'QLD', 4000, '07'],
        ['Fremantle', 'WA', 6000, '08'], ['Hobart', 'TAS', 7000, '03'], ['Adelaide', 'SA', 5000, '08'],
      ] as const);
      return {
        line1: `${int(1, 320)} ${pick(WORDS)} ${pick(['Street', 'Road', 'Parade', 'Terrace', 'Avenue', 'Crescent'])}`,
        line2: int(0, 4) === 0 ? `Unit ${int(1, 30)}` : '',
        city, region, postcode: String(int(lo, lo + 899)),
        // ACMA's fictional landline blocks: 5550 xxxx and 7010 xxxx.
        phone: `(${area}) ${pick(['5550', '7010'])} ${digits(4)}`,
      };
    },
  },
  {
    id: 'de',
    name: 'Germany',
    make: () => ({
      line1: `${pick(['Linden', 'Birken', 'Garten', 'Berg', 'Mühlen', 'Rosen', 'Schul', 'Wald', 'Bahnhof', 'Kirch'])}${pick(['straße', 'weg', 'allee', 'gasse'])} ${int(1, 160)}`,
      line2: '',
      city: pick(['Leipzig', 'Bremen', 'Freiburg', 'Münster', 'Kassel', 'Rostock', 'Augsburg', 'Mainz']),
      region: '', postcode: digits(5).replace(/^0/, '1'), phone: '',
    }),
  },
  {
    id: 'fr',
    name: 'France',
    make: () => ({
      line1: `${int(1, 180)} ${pick(['rue des', 'avenue des', 'allée des', 'chemin des', 'place des'])} ${pick(['Lilas', 'Tilleuls', 'Écoles', 'Vignes', 'Peupliers', 'Moulins', 'Jardins', 'Acacias'])}`,
      line2: int(0, 4) === 0 ? `Bât. ${letter('ABCD')}` : '',
      city: pick(['Lyon', 'Nantes', 'Lille', 'Rennes', 'Dijon', 'Grenoble', 'Tours', 'Nîmes']),
      region: '', postcode: digits(5).replace(/^0/, '3'),
      // ARCEP keeps 01 99 00 xx xx and its neighbours for fiction.
      phone: `01 99 00 ${digits(2)} ${digits(2)}`,
    }),
  },
  {
    id: 'ng',
    name: 'Nigeria',
    make: () => {
      const [city, region] = pick([
        ['Ikeja', 'Lagos'], ['Lekki', 'Lagos'], ['Wuse', 'FCT Abuja'], ['Ibadan', 'Oyo'], ['Enugu', 'Enugu'],
        ['Port Harcourt', 'Rivers'], ['Kano', 'Kano'], ['Benin City', 'Edo'],
      ] as const);
      return {
        line1: `${int(1, 120)} ${pick(['Adeola', 'Unity', 'Market', 'Church', 'School', 'Station', 'Palm', 'Independence'])} ${pick(['Street', 'Road', 'Close', 'Crescent', 'Avenue'])}`,
        line2: int(0, 3) === 0 ? `Off ${pick(WORDS)} Road` : '',
        city, region, postcode: `${int(1, 9)}${digits(5)}`, phone: '',
      };
    },
  },
  {
    id: 'in',
    name: 'India',
    make: () => {
      const [city, region, first] = pick([
        ['Pune', 'Maharashtra', '4'], ['Jaipur', 'Rajasthan', '3'], ['Kochi', 'Kerala', '6'], ['Lucknow', 'Uttar Pradesh', '2'],
        ['Bhopal', 'Madhya Pradesh', '4'], ['Mysuru', 'Karnataka', '5'], ['Chandigarh', 'Chandigarh', '1'],
      ] as const);
      return {
        line1: `${int(1, 400)}, ${pick(['Gandhi', 'Nehru', 'Shanti', 'Lake', 'Station', 'Temple', 'Park'])} ${pick(['Road', 'Marg', 'Nagar', 'Colony'])}`,
        line2: int(0, 2) === 0 ? `Sector ${int(1, 60)}` : '',
        city, region, postcode: `${first}${digits(5)}`, phone: '',
      };
    },
  },
];

function block(a: Address): string {
  return [a.name, a.line1, a.line2, [a.city, a.region, a.postcode].filter(Boolean).join(a.region ? ', ' : ' '), a.country, a.phone].filter(Boolean).join('\n');
}

function csv(rows: Address[]): string {
  const cols = ['name', 'line1', 'line2', 'city', 'region', 'postcode', 'country', 'phone'] as const;
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export default function AddressGenerator() {
  const [country, setCountry] = useSetting('address-generator', 'country', 'us');
  const [count, setCount] = useSetting('address-generator', 'count', 10);
  const [names, setNames] = useSetting('address-generator', 'names', true);
  const [rows, setRows] = useState<Address[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const make = useCallback(() => {
    const c = COUNTRIES.find((x) => x.id === country) ?? COUNTRIES[0];
    setRows(
      Array.from({ length: Math.max(1, Math.min(500, count)) }, () => ({
        name: names ? `${pick(FIRST)} ${pick(LAST)}` : '',
        country: c.name,
        ...c.make(),
      })),
    );
  }, [country, count, names]);

  // Generated after mount: random values in the static HTML would not match
  // what the browser draws and React would complain.
  useEffect(() => {
    const id = setTimeout(make, 0);
    return () => clearTimeout(id);
  }, [make]);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <ToolLayout
      title="Addresses"
      settings={
        <>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Country</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
            >
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">How many</span>
            <input
              type="number" min={1} max={500} value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(500, Math.floor(Number(e.target.value)) || 1)))}
              className="mt-2 w-28 rounded-lg border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} /> Include a name
          </label>
          <button onClick={make} className="self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
            Make new ones
          </button>
          <p className="text-xs leading-relaxed text-ink-faint">
            Invented for testing. Real towns, made-up streets and random postcodes that will not match them. Phone
            numbers, where shown, come from ranges reserved for fiction, so they never reach anyone.
          </p>
        </>
      }
      actions={
        rows.length > 0 && (
          <>
            <button onClick={() => void copy(JSON.stringify(rows, null, 2), 'json')} className="text-sm text-accent underline underline-offset-4">
              {copied === 'json' ? 'Copied' : 'Copy JSON'}
            </button>
            <DownloadButton prepare={async () => new Blob([csv(rows)], { type: 'text/csv' })} filename={`addresses-${country}.csv`} variant="quiet">
              Download CSV
            </DownloadButton>
          </>
        )
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((a, i) => (
          <li key={i} className="group relative rounded-xl border border-line bg-surface p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{block(a)}</pre>
            <button
              onClick={() => void copy(block(a), String(i))}
              className="absolute right-3 top-3 text-xs text-accent underline underline-offset-4"
            >
              {copied === String(i) ? 'Copied' : 'Copy'}
            </button>
          </li>
        ))}
      </ul>
    </ToolLayout>
  );
}

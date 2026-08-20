/**
 * Reading and writing the plain data formats: CSV, TSV, JSON, XML and YAML.
 *
 * Kept in one place because the conversion tools are all the same shape,
 * parse into ordinary JavaScript values, then write them back out in another
 * format, and every pair would otherwise reimplement half of it.
 *
 * The CSV parser follows RFC 4180 rather than splitting on commas, since a
 * quoted field may contain commas, newlines and doubled quotes, and real
 * exports contain all three.
 */

export type Row = Record<string, unknown>;

/* ── Delimited text ─────────────────────────────────────────────────────── */

export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }

    if (c === '"') { quoted = true; continue; }
    if (c === delimiter) { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }

  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Guesses the separator by counting candidates in the first line. */
export function sniff(text: string): string {
  const end = text.indexOf('\n');
  const line = end === -1 ? text : text.slice(0, end);
  const counts = [',', '\t', ';', '|'].map((d) => [d, line.split(d).length] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 1 ? counts[0][0] : ',';
}

/**
 * Turns a cell into a number, a boolean or null where that is what it is.
 *
 * Deliberately conservative. A leading zero means the value is an identifier
 * rather than a number, so 007 and phone numbers keep their zeros instead of
 * being quietly mangled, which is the single most complained about behaviour
 * of every converter and of Excel.
 */
export function coerce(raw: string): unknown {
  if (raw === '') return null;
  if (raw === 'true' || raw === 'false') return raw === 'true';
  if (/^-?\d+(\.\d+)?$/.test(raw) && !/^-?0\d/.test(raw)) return Number(raw);
  return raw;
}

export function rowsToObjects(rows: string[][], headerRow: boolean): Row[] {
  if (rows.length === 0) return [];
  const head = headerRow ? rows[0] : rows[0].map((_, i) => `column${i + 1}`);
  const body = headerRow ? rows.slice(1) : rows;
  return body.map((r) => {
    const o: Row = {};
    head.forEach((key, i) => {
      o[key || `column${i + 1}`] = coerce(r[i] ?? '');
    });
    return o;
  });
}

function escapeCell(value: unknown, delimiter: string): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /["\n\r]/.test(text) || text.includes(delimiter)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function objectsToDelimited(rows: Row[], delimiter: string): string {
  if (rows.length === 0) return '';
  // Every key seen anywhere, in first-seen order, so a ragged set of objects
  // does not silently lose the columns that only later rows have.
  const head: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!head.includes(k)) head.push(k);

  const lines = [head.map((h) => escapeCell(h, delimiter)).join(delimiter)];
  for (const r of rows) {
    lines.push(head.map((h) => escapeCell(flatten(r[h]), delimiter)).join(delimiter));
  }
  return lines.join('\n');
}

/** A nested value has no cell to sit in, so it becomes its JSON. */
function flatten(value: unknown): unknown {
  return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
}

/* ── XML ────────────────────────────────────────────────────────────────── */

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A tag name that XML will accept, since a CSV heading can be anything. */
function tagName(key: string): string {
  const cleaned = key.replace(/[^\w.-]/g, '_');
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export function toXml(value: unknown, rootName = 'rows', itemName = 'row'): string {
  const write = (v: unknown, name: string, depth: number): string => {
    const pad = '  '.repeat(depth);
    if (Array.isArray(v)) return v.map((item) => write(item, name, depth)).join('\n');
    if (v !== null && typeof v === 'object') {
      const inner = Object.entries(v as Row)
        .map(([k, val]) => write(val, tagName(k), depth + 1))
        .join('\n');
      return `${pad}<${name}>\n${inner}\n${pad}</${name}>`;
    }
    return `${pad}<${name}>${escapeXml(v === null || v === undefined ? '' : String(v))}</${name}>`;
  };

  const body = Array.isArray(value)
    ? value.map((item) => write(item, itemName, 1)).join('\n')
    : write(value, itemName, 1);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${body}\n</${rootName}>`;
}

/**
 * Reads XML into ordinary values.
 *
 * Attributes become keys prefixed with @, and repeated child tags become an
 * array, which is the convention every XML to JSON tool settles on because
 * there is no other way to tell one item from a list of one.
 */
export function fromXml(text: string): unknown {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('That does not parse as XML.');

  const read = (el: Element): unknown => {
    const out: Row = {};
    for (const attr of [...el.attributes]) out[`@${attr.name}`] = coerce(attr.value);

    const children = [...el.children];
    if (children.length === 0) {
      const text = el.textContent?.trim() ?? '';
      return Object.keys(out).length === 0 ? coerce(text) : { ...out, '#text': coerce(text) };
    }

    for (const child of children) {
      const value = read(child);
      const key = child.nodeName;
      if (key in out) {
        const existing = out[key];
        out[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else out[key] = value;
    }
    return out;
  };

  return read(doc.documentElement);
}

/**
 * Finds the list of records inside a parsed document.
 *
 * XML and JSON both usually wrap the rows in something, so converting to a
 * table means looking one level in for the array rather than producing a
 * single row describing the wrapper.
 */
export function findRows(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter((v) => v && typeof v === 'object') as Row[];
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as Row)) {
      if (Array.isArray(v) && v.some((item) => item && typeof item === 'object')) {
        return v.filter((item) => item && typeof item === 'object') as Row[];
      }
    }
    return [value as Row];
  }
  return [];
}

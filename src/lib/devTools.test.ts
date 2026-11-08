import { describe, expect, it } from 'vitest';
import {
  checkJson,
  decodeEntities,
  decodeJwt,
  encodeEntities,
  encodeEntitiesAll,
  fancy,
  findReplace,
  parseTimestamp,
  relativeTime,
  subnet,
} from './devTools';

describe('entities', () => {
  it('encodes the five and round-trips', () => {
    const s = `<a href="x">Tom & 'Jerry'</a>`;
    expect(encodeEntities(s)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
    expect(decodeEntities(encodeEntities(s))).toBe(s);
  });
  it('encodes non-ASCII as numbers and decodes them, including astral', () => {
    expect(encodeEntitiesAll('é😀')).toBe('&#233;&#128512;');
    expect(decodeEntities('&#233;&#x1F600;&eacute-not;&copy;')).toBe('é😀&eacute-not;©');
  });
  it('leaves unknown names alone', () => {
    expect(decodeEntities('&nosuch;')).toBe('&nosuch;');
  });
});

describe('checkJson', () => {
  it('accepts valid JSON and summarises it', () => {
    expect(checkJson('{"a":1,"b":[1,2]}')).toEqual({ ok: true, kind: 'object', summary: '2 keys at the top level' });
    expect(checkJson('[1,2,3]')).toMatchObject({ ok: true, summary: '3 items' });
  });
  it('points at the line of a trailing comma', () => {
    const r = checkJson('{\n  "a": 1,\n}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.line).toBe(3);
      expect(r.excerpt).toBe('}');
    }
  });
});

describe('fancy', () => {
  it('maps letters and digits, with the holes filled', () => {
    expect(fancy('Ab1', 'bold')).toBe('𝐀𝐛𝟏');
    expect(fancy('h', 'italic')).toBe('ℎ');
    expect(fancy('BE', 'script')).toBe('ℬℰ');
    expect(fancy('R', 'double')).toBe('ℝ');
    expect(fancy('a-b!', 'mono')).toBe('𝚊-𝚋!');
  });
});

describe('timestamps', () => {
  it('reads seconds and milliseconds by size', () => {
    expect(parseTimestamp('1700000000')).toEqual({ ms: 1700000000000, unit: 's' });
    expect(parseTimestamp('1700000000000')).toEqual({ ms: 1700000000000, unit: 'ms' });
    expect(parseTimestamp('1700000000000000')).toEqual({ ms: 1700000000000, unit: 'µs' });
    expect(() => parseTimestamp('soon')).toThrow();
  });
  it('says how long ago', () => {
    expect(relativeTime(0, 3 * 864e5)).toBe('3 days ago');
    expect(relativeTime(2 * 36e5, 0)).toBe('in 2 hours');
  });
});

describe('decodeJwt', () => {
  // {"alg":"HS256","typ":"JWT"} . {"sub":"1234567890","name":"John Doe","iat":1516239022}
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  it('decodes header and payload', () => {
    const d = decodeJwt('Bearer ' + token);
    expect(d.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(d.payload).toMatchObject({ name: 'John Doe', iat: 1516239022 });
  });
  it('explains a wrong shape', () => {
    expect(() => decodeJwt('a.b')).toThrow(/three parts/);
    expect(() => decodeJwt('a.b.c.d.e')).toThrow(/encrypted/);
  });
});

describe('subnet', () => {
  it('works out a /24', () => {
    expect(subnet('192.168.1.130/24')).toMatchObject({
      network: '192.168.1.0', broadcast: '192.168.1.255', first: '192.168.1.1', last: '192.168.1.254',
      mask: '255.255.255.0', wildcard: '0.0.0.255', usable: 254, total: 256, kind: 'Private',
    });
  });
  it('accepts a dotted mask and handles /31 and /32', () => {
    expect(subnet('10.0.0.9', '255.255.255.248')).toMatchObject({ prefix: 29, network: '10.0.0.8', usable: 6 });
    expect(subnet('8.8.8.8/32')).toMatchObject({ usable: 1, first: '8.8.8.8', last: '8.8.8.8', kind: 'Public' });
    expect(subnet('10.0.0.0/31')).toMatchObject({ usable: 2, first: '10.0.0.0', last: '10.0.0.1' });
  });
  it('rejects nonsense', () => {
    expect(() => subnet('10.0.0.300/24')).toThrow();
    expect(() => subnet('10.0.0.1', '255.0.255.0')).toThrow(/contiguous/);
  });
});

describe('findReplace', () => {
  const o = { caseSensitive: false, wholeWord: false, regex: false };
  it('replaces literally, ignoring case by default', () => {
    expect(findReplace('Cat cat CAT.', 'cat', 'dog', o)).toEqual({ text: 'dog dog dog.', count: 3 });
  });
  it('treats regex characters literally unless asked', () => {
    expect(findReplace('a.b a+b', 'a.b', 'x', o)).toEqual({ text: 'x a+b', count: 1 });
  });
  it('honours whole words in any script', () => {
    expect(findReplace('café cafés', 'café', 'x', { ...o, wholeWord: true })).toEqual({ text: 'x cafés', count: 1 });
  });
  it('supports groups in regex mode', () => {
    expect(findReplace('2026-11-08', '(\\d+)-(\\d+)-(\\d+)', '$3/$2/$1', { ...o, regex: true }).text).toBe('08/11/2026');
  });
});

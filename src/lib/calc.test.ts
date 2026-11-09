import { describe, expect, it } from 'vitest';
import { fromDecimal, mixed, parseFraction, parseNumbers, pricing, roi, stats, toDecimal } from './calc';

const f = (num: number, den: number) => ({ num: BigInt(num), den: BigInt(den) });

describe('stats', () => {
  it('matches the textbook figures', () => {
    const s = stats([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(s.mean).toBe(5);
    expect(s.median).toBe(4.5);
    expect(s.modes).toEqual([4]);
    expect(s.populationSd).toBe(2);
    expect(s.sampleSd).toBeCloseTo(2.13809, 5);
    expect(s.range).toBe(7);
  });
  it('uses the inclusive quartiles Excel uses', () => {
    const s = stats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])!;
    expect(s.q1).toBe(3.25);
    expect(s.q3).toBe(7.75);
  });
  it('has no mode when nothing repeats, and several when tied', () => {
    expect(stats([1, 2, 3])!.modes).toEqual([]);
    expect(stats([1, 1, 2, 2, 3])!.modes).toEqual([1, 2]);
  });
  it('reads pasted lists and reports what it skipped', () => {
    expect(parseNumbers('1, 2;3\n4\t5 x (6)')).toEqual({ values: [1, 2, 3, 4, 5, -6], rejected: ['x'] });
  });
  it('keeps precision for large close values', () => {
    expect(stats([1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16])!.sampleVariance).toBe(30);
  });
});

describe('fractions', () => {
  it('finds the repeating part', () => {
    expect(toDecimal(f(1, 3))).toMatchObject({ whole: '0', fixed: '', repeat: '3' });
    expect(toDecimal(f(1, 6))).toMatchObject({ fixed: '1', repeat: '6' });
    expect(toDecimal(f(1, 7))).toMatchObject({ repeat: '142857' });
    expect(toDecimal(f(-7, 4))).toMatchObject({ sign: '-', whole: '1', fixed: '75', repeat: '' });
  });
  it('reads fractions and mixed numbers', () => {
    expect(parseFraction('6/8')).toEqual(f(3, 4));
    expect(parseFraction('-1 1/2')).toEqual(f(-3, 2));
    expect(() => parseFraction('1/0')).toThrow(/zero/);
  });
  it('turns decimals back into fractions, repeating or not', () => {
    expect(fromDecimal('0.75')).toEqual(f(3, 4));
    expect(fromDecimal('0.(3)')).toEqual(f(1, 3));
    expect(fromDecimal('0.1(6)')).toEqual(f(1, 6));
    expect(fromDecimal('0.1666...')).toEqual(f(1, 6));
    expect(fromDecimal('2.(142857)')).toEqual(f(15, 7));
    expect(fromDecimal('-.5')).toEqual(f(-1, 2));
  });
  it('writes mixed numbers', () => {
    expect(mixed(f(7, 4))).toBe('1 3/4');
    expect(mixed(f(-2, 1))).toBeNull();
    expect(mixed(f(-9, 4))).toBe('-2 1/4');
    expect(mixed(f(1, 2))).toBeNull();
  });
});

describe('pricing', () => {
  it('keeps margin and markup apart', () => {
    const p = pricing({ cost: 60, price: 100 });
    expect(p.margin).toBeCloseTo(0.4);
    expect(p.markup).toBeCloseTo(2 / 3);
  });
  it('finds the price for a target margin', () => {
    expect(pricing({ cost: 60, margin: 0.4 }).price).toBeCloseTo(100);
    expect(pricing({ cost: 60, markup: 0.5 }).price).toBeCloseTo(90);
    expect(() => pricing({ cost: 60, margin: 1 })).toThrow();
  });
});

describe('roi', () => {
  it('annualises', () => {
    const r = roi(1000, 2000, 10);
    expect(r.roi).toBe(1);
    expect(r.annual!).toBeCloseTo(0.07177, 5);
  });
});

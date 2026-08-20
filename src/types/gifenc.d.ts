/**
 * gifenc ships no types.
 *
 * Only the three exports this site uses are declared, deliberately, so a typo
 * in a call still fails at build rather than being waved through by a blanket
 * `declare module`.
 */
declare module 'gifenc' {
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: 'rgb565' | 'rgb444' | 'rgba4444'; oneBitAlpha?: boolean },
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: 'rgb565' | 'rgb444' | 'rgba4444',
  ): Uint8Array;

  export function GIFEncoder(): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: { palette?: number[][]; delay?: number; transparent?: boolean; repeat?: number },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  };
}

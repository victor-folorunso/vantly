/**
 * Types for `quantize`, the MIT median-cut library Color Thief is built on.
 *
 * It ships no types of its own, and it is a thirty year old algorithm in about
 * three hundred lines, so the surface worth describing is tiny. Declaring it
 * here rather than casting to any at the call site keeps the one thing that
 * actually matters, that `quantize` returns false when it cannot build a map,
 * visible to the compiler.
 */
declare module 'quantize' {
  type Pixel = [number, number, number];

  interface ColorMap {
    palette(): Pixel[];
    map(pixel: Pixel): Pixel;
    size(): number;
  }

  /** Returns false when given no pixels or fewer colours than requested. */
  export default function quantize(pixels: Pixel[], maxColors: number): ColorMap | false;
}

/**
 * The image formats a canvas cannot produce on its own.
 *
 * `canvas.toBlob` only encodes PNG, JPEG and WebP. Ask it for anything else
 * and it hands back a PNG with the wrong file extension, without an error,
 * which is the single most common bug in browser based converters and the
 * reason these are written out here.
 *
 * GIF   gifenc, which quantises to a 256 colour palette
 * TIFF  utif2
 * BMP   written below, since the format is a header and a pixel dump
 * ICO   written below, a container around PNGs
 *
 * Reading is mostly the browser's job. It decodes JPEG, PNG, WebP, AVIF, GIF
 * and BMP natively. TIFF it does not, so that one is decoded here too.
 */

export type EncodeTarget = 'gif' | 'tiff' | 'bmp' | 'ico';

/** Everything this module can write, for the registry to ask about. */
export const ENCODABLE: readonly EncodeTarget[] = ['gif', 'tiff', 'bmp', 'ico'];

/** Formats the browser cannot decode by itself. */
export const NEEDS_DECODER: readonly string[] = ['tiff'];

export type Raster = { data: Uint8ClampedArray; width: number; height: number };

/* ── BMP ────────────────────────────────────────────────────────────────── */

/**
 * A 24 bit BMP.
 *
 * Rows are stored bottom to top and each row is padded to a multiple of four
 * bytes. Both are easy to forget and both produce an image that opens, looks
 * almost right, and is sheared or upside down.
 *
 * 24 bit rather than 32 because a 32 bit BMP needs BI_BITFIELDS masks to carry
 * alpha and most software ignores them anyway. Transparent pixels are laid
 * over the background colour instead, so nothing turns black.
 */
export function encodeBmp(raster: Raster, background = '#ffffff'): Blob {
  const { data, width, height } = raster;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const size = 54 + pixelBytes;

  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // BITMAPFILEHEADER
  bytes[0] = 0x42; // B
  bytes[1] = 0x4d; // M
  view.setUint32(2, size, true);
  view.setUint32(10, 54, true); // where the pixels start

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true); // 72 dpi, in pixels per metre
  view.setInt32(42, 2835, true);

  const bg = {
    r: parseInt(background.slice(1, 3), 16),
    g: parseInt(background.slice(3, 5), 16),
    b: parseInt(background.slice(5, 7), 16),
  };

  for (let y = 0; y < height; y++) {
    // Bottom row first.
    const row = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      const a = data[at + 3] / 255;
      const out = row + x * 3;
      // BGR, not RGB.
      bytes[out] = Math.round(data[at + 2] * a + bg.b * (1 - a));
      bytes[out + 1] = Math.round(data[at + 1] * a + bg.g * (1 - a));
      bytes[out + 2] = Math.round(data[at] * a + bg.r * (1 - a));
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/* ── ICO ────────────────────────────────────────────────────────────────── */

/**
 * An ICO built around PNGs.
 *
 * Six byte header, then one sixteen byte entry per size, then the image data.
 * Since Vista that data may be a PNG rather than a bitmap, which is what makes
 * this short.
 */
export function packIco(pngs: { size: number; bytes: ArrayBuffer }[]): Blob {
  const header = new ArrayBuffer(6 + pngs.length * 16);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true); // 1 means icon
  view.setUint16(4, pngs.length, true);

  let offset = header.byteLength;
  pngs.forEach((png, i) => {
    const at = 6 + i * 16;
    // 256 is written as zero. Writing 256 into a byte is the classic bug.
    view.setUint8(at, png.size >= 256 ? 0 : png.size);
    view.setUint8(at + 1, png.size >= 256 ? 0 : png.size);
    view.setUint16(at + 4, 1, true); // colour planes
    view.setUint16(at + 6, 32, true); // bits per pixel
    view.setUint32(at + 8, png.bytes.byteLength, true);
    view.setUint32(at + 12, offset, true);
    offset += png.bytes.byteLength;
  });

  return new Blob([header, ...pngs.map((p) => p.bytes)], { type: 'image/x-icon' });
}

/** The sizes an icon file carries, largest last so nothing is upscaled. */
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

export async function encodeIco(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const longest = Math.max(width, height);
  const sizes = ICO_SIZES.filter((s) => s <= Math.max(longest, 16));

  const parts: { size: number; bytes: ArrayBuffer }[] = [];
  for (const size of sizes.length ? sizes : [16]) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // Contained rather than cropped: an icon squared off at the edges loses
    // the part that made it recognisable.
    const scale = Math.min(size / width, size / height);
    const w = width * scale;
    const h = height * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (blob) parts.push({ size, bytes: await blob.arrayBuffer() });
  }
  return packIco(parts);
}

/* ── GIF ────────────────────────────────────────────────────────────────── */

/**
 * A single frame GIF.
 *
 * GIF holds 256 colours, so a photograph has to be quantised. gifenc picks the
 * palette from the actual pixels rather than using a fixed one, which is the
 * difference between a photo that looks acceptable and one that looks like it
 * came off a 1998 web page.
 */
export async function encodeGif(raster: Raster): Promise<Blob> {
  const { quantize, applyPalette, GIFEncoder } = await import('gifenc');
  const { data, width, height } = raster;

  const rgba = new Uint8Array(data.buffer.slice(0));
  const palette = quantize(rgba, 256, { format: 'rgb565' });
  const indexed = applyPalette(rgba, palette, 'rgb565');

  const gif = GIFEncoder();
  gif.writeFrame(indexed, width, height, { palette });
  gif.finish();

  return new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
}

/* ── TIFF ───────────────────────────────────────────────────────────────── */

export async function encodeTiff(raster: Raster): Promise<Blob> {
  const UTIF = (await import('utif2')).default;
  const { data, width, height } = raster;
  const out = UTIF.encodeImage(new Uint8Array(data.buffer.slice(0)), width, height);
  return new Blob([out as BlobPart], { type: 'image/tiff' });
}

/** TIFF is the one common format no browser decodes. */
export async function decodeTiff(buffer: ArrayBuffer): Promise<Raster> {
  const UTIF = (await import('utif2')).default;
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) throw new Error('That file has no images in it.');
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  return {
    data: new Uint8ClampedArray(rgba),
    width: ifds[0].width,
    height: ifds[0].height,
  };
}

/* ── The way in ─────────────────────────────────────────────────────────── */

export async function encodeRaster(
  target: EncodeTarget,
  raster: Raster,
  source: CanvasImageSource,
  background = '#ffffff',
): Promise<Blob> {
  if (target === 'bmp') return encodeBmp(raster, background);
  if (target === 'gif') return encodeGif(raster);
  if (target === 'tiff') return encodeTiff(raster);
  return encodeIco(source, raster.width, raster.height);
}

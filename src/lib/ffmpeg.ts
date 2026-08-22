/**
 * FFmpeg, in the browser.
 *
 * The wrapper here is MIT. The engine it loads is FFmpeg itself, which is
 * GPL-2.0-or-later, and that has consequences worth stating rather than
 * burying: serving it to a browser is distribution, so the licence and the
 * source have to be offered. Vantly is open source and says so, which is what
 * makes this straightforward rather than a problem. The notice sits on every
 * page that uses it, in LICENCE_NOTE below.
 *
 * The engine is not bundled. It is about 30MB, which is larger than
 * Cloudflare Pages will serve as a single file and far larger than anyone
 * should download to visit a page that might not need it. It loads from a CDN
 * the first time a conversion runs, then the browser caches it.
 *
 * The single threaded core is deliberate. The multithreaded one is faster and
 * needs SharedArrayBuffer, which needs cross origin isolation headers, which
 * would break every other tool on the site that loads anything from anywhere
 * else. Slower and working beats faster and broken.
 */

const CORE_VERSION = '0.12.10';
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export const LICENCE_NOTE =
  'Converting is done by FFmpeg, which is free software under the GPL. It runs in your browser, so the file stays on your machine.';

export const LICENCE_URL = 'https://www.ffmpeg.org/legal.html';

type Progress = (info: { stage: string; ratio: number }) => void;

/* One instance for the page. Loading takes a moment and a second copy would
   mean downloading the engine again. */
let instance: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null;

export function isLoaded(): boolean {
  return instance !== null;
}

export async function getFFmpeg(onProgress?: Progress) {
  if (!instance) {
    instance = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();

      onProgress?.({ stage: 'Downloading the converter, about 30MB, once', ratio: 0 });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      return ffmpeg;
    })();

    // A failed load must not be remembered, or every later attempt returns the
    // same rejected promise and the tool looks permanently broken.
    instance.catch(() => {
      instance = null;
    });
  }
  return instance;
}

export type RunResult =
  | { ok: true; data: Uint8Array }
  | { ok: false; error: string };

/**
 * Runs one conversion.
 *
 * The file goes into ffmpeg's own in-memory filesystem, the command runs, and
 * the result comes back out. Both are deleted afterwards: a long video is
 * hundreds of megabytes and leaving it there means the next conversion runs
 * out of memory rather than the first one.
 */
export async function run(
  file: File,
  outputName: string,
  args: (input: string, output: string) => string[],
  onProgress?: Progress,
  /**
   * Files the arguments refer to by name besides the main input.
   *
   * Turning an audio file into a video needs a picture as a second input, and
   * ffmpeg can only read what has been written into its filesystem first.
   * Without this the still mode named cover.png in its arguments and nothing
   * ever put a cover.png there, so it could only ever have failed.
   */
  extra?: { name: string; file: Blob }[],
): Promise<RunResult> {
  try {
    const ffmpeg = await getFFmpeg(onProgress);
    const { fetchFile } = await import('@ffmpeg/util');

    const inputName = `in.${file.name.split('.').pop()?.toLowerCase() || 'bin'}`;

    const listener = ({ progress }: { progress: number }) => {
      onProgress?.({ stage: 'Converting', ratio: Math.min(Math.max(progress, 0), 1) });
    };
    ffmpeg.on('progress', listener);

    try {
      onProgress?.({ stage: 'Reading the file', ratio: 0 });
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      for (const item of extra ?? []) {
        await ffmpeg.writeFile(item.name, await fetchFile(item.file));
      }

      onProgress?.({ stage: 'Converting', ratio: 0 });
      await ffmpeg.exec(args(inputName, outputName));

      const data = await ffmpeg.readFile(outputName);
      if (typeof data === 'string' || data.length === 0) {
        return { ok: false, error: 'The conversion produced nothing.' };
      }
      return { ok: true, data: data as Uint8Array };
    } finally {
      ffmpeg.off('progress', listener);
      // Best effort. A file that was never written cannot be deleted, and
      // that is not worth failing the conversion over.
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
      for (const item of extra ?? []) {
        await ffmpeg.deleteFile(item.name).catch(() => {});
      }
    }
  } catch (e) {
    if (e instanceof Error && /network|fetch|load/i.test(e.message)) {
      return { ok: false, error: 'The converter could not be downloaded. Check the connection and try again.' };
    }
    return {
      ok: false,
      error: 'That file could not be converted. It may be in a format the converter does not read, or damaged.',
    };
  }
}

/** Seconds as 00:00:12.500, which is what ffmpeg wants for seeking. */
export function timecode(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = (s % 60).toFixed(3).padStart(6, '0');
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${rest}`;
}

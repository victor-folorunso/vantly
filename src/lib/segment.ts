/**
 * BiRefNet, loaded on demand, for background removal that understands subjects.
 *
 * The colour flood fill already on the site is exact on a flat background and
 * useless on a photograph, because it has no idea what a person is. This does,
 * and it is the model several commercial background removers are built on.
 *
 * The cost is the download. Full BiRefNet is 466MB even at half precision,
 * which is not something to hand a visitor, so this uses the lite variant at
 * 109MB. RMBG-1.4 is smaller again at 44MB and licensed non-commercial only,
 * so it is out for a site that will eventually bill. BiRefNet is MIT.
 *
 * Never fetched unless somebody asks for it, and the browser caches it after.
 */

/** MIT licensed. The lite variant, at half precision. */
export const SEGMENT_MODEL = 'onnx-community/BiRefNet_lite-ONNX';
export const SEGMENT_MODEL_MB = 109;

type Pipe = (
  input: string,
) => Promise<{ mask: { data: Uint8Array; width: number; height: number } }[]>;

export type Support =
  | { ok: true; device: 'webgpu'; dtype: 'fp16' }
  | { ok: false; reason: string };

let pipePromise: Promise<Pipe> | null = null;
let supportPromise: Promise<Support> | null = null;

/**
 * Whether this browser can actually run it, asked properly.
 *
 * The first version checked `'gpu' in navigator`, which is true in browsers
 * that expose the API and have no adapter behind it, so the model downloaded
 * and then failed at load. Headless Chromium is exactly that case. The adapter
 * has to be requested, and fp16 needs the shader-f16 feature specifically,
 * which plenty of adapters do not have.
 *
 * There is deliberately no WASM fallback. This model has no quantised build, so
 * the fallback would be 213MB at full precision running on the CPU, which is a
 * worse experience than being told it will not work here.
 */
export function checkSupport(): Promise<Support> {
  if (!supportPromise) {
    supportPromise = (async (): Promise<Support> => {
      if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        return { ok: false, reason: 'This browser has no WebGPU, which this needs.' };
      }
      try {
        /* Typed locally rather than pulled from @webgpu/types, which would add
           a dependency for three lines. Only the two things used are declared. */
        const gpu = (navigator as unknown as {
          gpu: { requestAdapter(): Promise<{ features: { has(f: string): boolean } } | null> };
        }).gpu;
        const adapter = await gpu.requestAdapter();
        if (!adapter) {
          return { ok: false, reason: 'No graphics adapter is available to the browser.' };
        }
        if (!adapter.features.has('shader-f16')) {
          return { ok: false, reason: 'This graphics adapter cannot do half precision maths.' };
        }
        return { ok: true, device: 'webgpu', dtype: 'fp16' };
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : 'WebGPU could not start.',
        };
      }
    })();
  }
  return supportPromise;
}

/**
 * Loads once per page and reuses the instance.
 *
 * Held in a module level promise rather than component state, so moving between
 * tools does not pay the download twice.
 */
export function loadSegmenter(onProgress?: (fraction: number) => void): Promise<Pipe> {
  if (!pipePromise) {
    pipePromise = (async () => {
      const support = await checkSupport();
      if (!support.ok) throw new Error(support.reason);

      const { pipeline, env } = await import('@huggingface/transformers');
      // Weights come from the hub and are cached by the browser. Bundling them
      // would mean 109MB in the repository and in every deploy.
      env.allowLocalModels = false;

      return (await pipeline('background-removal', SEGMENT_MODEL, {
        dtype: support.dtype,
        device: support.device,
        progress_callback: (p: { status: string; progress?: number }) => {
          if (p.status === 'progress' && typeof p.progress === 'number') {
            onProgress?.(p.progress / 100);
          }
        },
      })) as unknown as Pipe;
    })();
    // A failed load must not poison every later attempt.
    pipePromise.catch(() => {
      pipePromise = null;
    });
  }
  return pipePromise;
}

/** True once the weights are cached, so the UI can stop warning about the size. */
export async function isModelCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open('transformers-cache');
    const keys = await cache.keys();
    return keys.some((k) => k.url.includes('BiRefNet_lite'));
  } catch {
    return false;
  }
}

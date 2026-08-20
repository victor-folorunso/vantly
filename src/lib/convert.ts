/**
 * Calling the conversion service.
 *
 * The service is a container with LibreOffice in it, on Modal, and it turns
 * Office files into PDF. Everything after that happens in the browser, because
 * the site already renders PDFs.
 *
 * This is the first thing on the site that leaves the visitor's machine, which
 * is why `serverBacked` exists: any tool using it has to say so on the page
 * rather than inheriting the "nothing is uploaded" line that is true of
 * everything else.
 */

/* The deployed endpoint, as a default rather than a required setting.
   NEXT_PUBLIC_ values are compiled into the client bundle, so this is public
   the moment anybody opens the page and there is nothing to keep out of the
   repo. Hardcoding the default means a fresh clone works, and the Cloudflare
   build does not need an environment variable somebody has to remember to
   set. The variable still wins when present, for pointing at a local
   container. */
const DEFAULT_CONVERT_URL = 'https://victorfolorunsoofficial--vantly-convert-web.modal.run';

export const CONVERT_URL = process.env.NEXT_PUBLIC_CONVERT_URL || DEFAULT_CONVERT_URL;

/** False when the service is not configured, so pages can say so honestly. */
export const conversionAvailable = CONVERT_URL.length > 0;

export type ConvertResult =
  | { ok: true; blob: Blob; filename: string }
  | { ok: false; error: string };

const FRIENDLY: Record<number, string> = {
  413: 'That file is too large. The limit is 40MB.',
  415: 'That file type cannot be converted.',
  422: 'That file could not be converted. It may be corrupt or password protected.',
  429: 'Too many conversions at once. Try again in a moment.',
  504: 'That file took too long to convert.',
};

export async function convertFile(
  file: File,
  to: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'txt' | 'md' | 'epub' = 'pdf',
  signal?: AbortSignal,
): Promise<ConvertResult> {
  if (!conversionAvailable) {
    return { ok: false, error: 'The conversion service is not configured yet.' };
  }

  const body = new FormData();
  body.append('file', file);

  try {
    const res = await fetch(`${CONVERT_URL}/convert?to=${to}`, {
      method: 'POST',
      body,
      signal,
    });

    if (!res.ok) {
      // The server sends a useful message for the cases it knows about. Its
      // detail beats a generic status line, so prefer it when present.
      let detail = '';
      try {
        detail = (await res.json())?.detail ?? '';
      } catch {
        /* not JSON, fall through to the status map */
      }
      return {
        ok: false,
        error: detail || FRIENDLY[res.status] || `The conversion failed (${res.status}).`,
      };
    }

    const stem = file.name.replace(/\.[^.]+$/, '');
    return { ok: true, blob: await res.blob(), filename: `${stem}.${to}` };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, error: 'Cancelled.' };
    }
    /* A cold start can take several seconds and a phone on a bad connection
       can drop it. Saying so beats "failed to fetch", which reads as a broken
       site rather than a slow one. */
    return {
      ok: false,
      error: 'Could not reach the conversion service. It may be starting up, so try again.',
    };
  }
}

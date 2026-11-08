/**
 * Render a PDF page by page to pictures and build a new PDF from them.
 *
 * Shared by Flatten PDF and Redact PDF, which both want the same end state: a
 * document where nothing is left except what can be seen. Flatten wants that
 * so form answers and comments stop being editable. Redact wants it because a
 * black box drawn over text in an ordinary PDF hides the text from the eye and
 * leaves it in the file, which is how redactions in court papers keep leaking.
 * Here the text is gone, because the page is a photograph of itself.
 *
 * Pages keep their size in points, so paper size and proportions survive.
 */

export type Painter = (ctx: CanvasRenderingContext2D, pageIndex: number, width: number, height: number) => void;

export async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  return pdfjs;
}

export async function rasterisePdf(
  bytes: ArrayBuffer,
  {
    dpi = 150,
    quality = 0.9,
    paint,
    onPage,
  }: {
    dpi?: number;
    quality?: number;
    /** Draws on top of each rendered page, in canvas pixels. */
    paint?: Painter;
    onPage?: (done: number, total: number) => void;
  } = {},
): Promise<Blob> {
  const pdfjs = await loadPdfJs();
  const { PDFDocument } = await import('pdf-lib');

  // pdf.js takes ownership of the buffer it is given.
  const task = pdfjs.getDocument({ data: bytes.slice(0) });
  const reader = await task.promise;
  const out = await PDFDocument.create();
  const scale = dpi / 72;

  for (let i = 1; i <= reader.numPages; i++) {
    onPage?.(i, reader.numPages);
    const page = await reader.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d')!;
    // JPEG has no transparency, so without a white ground the margins come
    // out black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // The default annotation mode draws form answers, highlights and stamps
    // into the canvas, which is exactly what flattening means.
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    paint?.(ctx, i - 1, canvas.width, canvas.height);

    const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!jpeg) throw new Error('A page was too large for this browser to draw.');
    const image = await out.embedJpg(await jpeg.arrayBuffer());
    const size = page.getViewport({ scale: 1 });
    out.addPage([size.width, size.height]).drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
    // Free the canvas memory before the next page rather than at the end.
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  // The loading task owns the worker side of the document.
  await task.destroy();
  const saved = await out.save();
  return new Blob([saved as BlobPart], { type: 'application/pdf' });
}

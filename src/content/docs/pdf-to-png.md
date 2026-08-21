---
updated: "2026-08-21"
title: What resolution should I export PDF pages at?
description: 150 dpi for reading on a screen, 300 for printing. Why PNG suits documents and JPG suits scans, and what page size has to do with it.
keywords: [pdf to png, pdf to image, export pdf pages, pdf dpi]
---

150 dpi if the images are going on a screen. 300 dpi if they're going anywhere
near a printer. 72 is fine for a thumbnail and too soft for anything else.

A PDF has no resolution of its own. It stores instructions for drawing a page,
so the pixels only exist once something decides how densely to draw them.
That's the number you're picking.

## What the numbers give you

A PDF page is measured in points, and there are 72 points to an inch. So an A4
page is 595 by 842 points, and the pixel size follows from the dpi you choose:

- **72 dpi:** 595 by 842 pixels. Thumbnail size.
- **150 dpi:** 1240 by 1754. Comfortable on any screen.
- **300 dpi:** 2480 by 3508. Print quality, and roughly four times the file size
  of 150.

Doubling the dpi quadruples the pixels, because it doubles in both directions.
That's the thing people miss when a batch of exports turns out enormous.

## PNG or JPG

**PNG** is lossless. Text edges stay crisp, and flat areas of white stay
exactly white. It's the right choice for a document that's mostly text,
diagrams or line art. Files are larger, though not as much larger as you'd
expect on a page that's mostly white.

**JPG** is lossy and much smaller on photographs. It's the right choice for a
scanned page, a page that's mainly a picture, or a batch where the total size
matters more than perfect edges.

The failure to avoid: JPG on a page of text at a low quality setting. JPEG
compression puts a faint halo around hard edges, and text is nothing but hard
edges, so it looks dirty in a way PNG never does.

If you can't decide, the page content decides for you. Words means PNG.
Photographs means JPG.

## Transparency

PDF pages are transparent where nothing is drawn. PNG keeps that, so an
exported page can have a see-through background rather than a white one.

JPG has no transparency at all, so those areas have to become something. They're
filled with white here, which is what almost everyone wants. Without that fill
they'd come out black, which is the classic surprise when exporting to JPG.

If you want a genuinely transparent page image, PNG is the only option of the
two.

## Why an export can be huge

A 300 dpi PNG of a full colour page can be several megabytes on its own, and a
fifty page document at that setting is a lot of data for something that was a
2MB PDF.

The PDF was small because it stored instructions. The images are large because
they store every pixel those instructions produce. That's not a fault, it's the
trade you're making, and it's why exporting at 300 when 150 would do is the most
common way to end up with an unmanageable folder.

## Mixed page sizes

Pages keep their own dimensions, so a document containing an A4 report and a
wide landscape appendix produces images of different sizes. Anything laying them
out in a grid afterwards will need to cope with that.

Rotation is handled: a page marked as rotated is exported the way it's meant to
be read, not the way it's stored.

## Going the other way

Turning the images back into a PDF is [a separate tool](/images-to-pdf), and
it's worth knowing that the round trip is lossy. The text stopped being text the
moment it became pixels, and putting the pixels back in a PDF doesn't recover
it. The result looks the same and can't be searched, selected or read aloud.

If you need the words rather than the appearance, [pull the text
out](/pdf-to-txt) instead. If the PDF is a scan and has no text to pull,
[recognising it](/pdf-ocr) is the way.

## Where the work happens

Rendering is done by your browser, using the same engine that displays PDFs in
it. Nothing is uploaded. A long document at high resolution is limited by your
own machine's memory, so if a two hundred page export at 300 dpi stalls, doing
it in halves is the way through.

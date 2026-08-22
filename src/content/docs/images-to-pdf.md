---
updated: "2026-08-22"
title: How do you turn a set of photos into one PDF?
description: Drop them in, drag them into order, download one file. Why page size and orientation matter, and what to do about photos that come out sideways.
keywords: [images to pdf, jpg to pdf, combine photos into pdf, scan to pdf]
---

Add the pictures, put them in the order you want, and download a single
document. Each image becomes one page.

The order is the thing to check before downloading. Files rarely arrive in the
order you want, because most systems sort by filename, and `IMG_10` sorts before
`IMG_2`.

## Why photos sometimes come out sideways

A phone doesn't rotate a photo when you turn the camera. It stores the pixels
the way the sensor saw them and adds a note saying which way up it should be
displayed. That note is called EXIF orientation.

Most viewers read the note. Some don't. So a photo that looks upright in your
gallery can land sideways in a document, and both are showing the same file.

The orientation is applied here before the page is made, so what you see is
what you get. If a picture is still wrong, the note itself is wrong, which
happens with images that have been through several apps. Rotating and re-saving
in any editor fixes it permanently.

## Page size and why it matters

A PDF has a page size in points, and the images have a size in pixels. Something
has to reconcile them.

Fitting each page to its image means no white margins and no cropping, and it
means a document whose pages are all different sizes. That's fine on screen and
awkward to print.

Fitting the images to a fixed page, A4 or Letter, gives a document that prints
predictably and puts white space around anything whose proportions don't match.

If the PDF is going to be printed or submitted somewhere, use a fixed page size.
Plenty of upload systems reject documents with inconsistent page dimensions, and
a printer will scale unpredictably.

## File size

The pictures are the file. A PDF of twenty phone photos is roughly the size of
twenty phone photos, which is often 60MB or more and too big to email.

[Resizing them](/image-resizer) first is the fix, and it costs nothing visible.
A photo at 4000 pixels wide printed at A4 shows no more detail than the same
photo at 2000, because the paper can't resolve it. Halving the dimensions
quarters the file.

Compressing afterwards is possible too, and it's the worse order: you're
compressing images that have already been embedded, rather than embedding
smaller images.

## Which formats go in

JPG and PNG embed directly, because PDF understands both.

WebP, AVIF, GIF, BMP and HEIC don't, so they're converted first. That
conversion is lossless where the source was lossless, so nothing is lost that
wasn't already.

HEIC is worth calling out because it's what iPhones produce by default. It goes
in fine here, which saves converting first.

## Scans specifically

If you're photographing documents rather than scanning them, a few things make
a large difference:

Fill the frame with the page and shoot straight down. Perspective distortion is
much harder to fix afterwards than it is to avoid.

Use even light. A shadow across the page or a bright reflection both cost more
than resolution does.

Shoot in colour even for black and white documents, then convert if you want.
A phone in black and white mode makes decisions you can't undo.

If the goal is a searchable document rather than a picture of one, you'll want
[recognition](/pdf-ocr) afterwards, since a photo of text is not text.

## Ordering, again

It's the most common mistake and the easiest to avoid. Check the first page and
the last page before you download. Those two catch almost every ordering
problem, because a reversed or offset sequence shows immediately at the ends.

Everything happens in your browser. The pictures aren't uploaded, which matters
given that this is the tool people use for passports, contracts and receipts.

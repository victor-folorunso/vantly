---
updated: "2026-08-21"
title: Why won't my PDF get smaller?
description: Most PDFs are big because of the pictures inside them. Which of the two methods to use, and what flattening quietly destroys.
keywords: [compress pdf, reduce pdf size, pdf too large to email, shrink pdf]
---

Because the thing making it big is almost certainly a picture, and tidying up
the file structure doesn't touch pictures. A 40MB PDF is usually a scan, or a
report somebody dropped phone photos into at full resolution. The text in it
weighs almost nothing.

That's why there are two methods here and why they give such different results.
Picking the wrong one either does nothing or ruins the document.

## Tidy up

This rewrites the file's internal bookkeeping, packs it more efficiently and
drops anything nothing points at any more. Deleted pages leave debris behind,
and editors often keep old versions of objects around.

It's lossless. Every pixel and every character comes out identical. Nothing can
go wrong.

It also usually saves very little. On a PDF exported cleanly from Word you
might see five percent. On one that's been through several rounds of editing,
sometimes thirty. On a scan, close to nothing, because a scan is one enormous
picture per page and that picture is already compressed.

Try this first. If it gets you under the limit, stop.

## Flatten to pictures

This renders every page as a picture and rebuilds the document around those.
That's where the large savings live, and it's destructive in a way worth
understanding before you press it.

Afterwards the text is not text. Nobody can select it, copy it, or search it.
Ctrl+F finds nothing. A screen reader finds nothing, which means anyone using
one can't read the document at all. Links stop working. Form fields disappear.

For a scan, none of that matters, because a scan already was pictures and had
none of those things to lose.

For a contract, a CV, or anything somebody needs to quote from, it matters a
great deal. A CV flattened to pictures is invisible to the software most
employers screen with.

## The two dials

**Resolution** decides how many pixels each page gets. 72 dpi is a screen, 150
is comfortable reading, 300 is proper print. Most documents that only need to
be looked at are fine at 150. Going from 300 to 150 cuts the file to roughly a
quarter, because you're halving in both directions.

**Quality** is the JPEG setting. Below about 60 percent you start seeing
blocky patches around text edges, and text is exactly where JPEG artefacts show
worst. 70 to 80 is the useful range.

If the result is still too big, drop the resolution before you drop the
quality. A smaller sharp page reads better than a large mushy one.

## Why a scan is so big

A page of text stored as text is a few kilobytes. The same page photographed is
a million pixels or more, and no compression makes that as small as the letters
it depicts.

If your scanner offers black and white for text documents, use it. A page
scanned in colour carries three values per pixel to represent something that's
only ever black or white. Switching modes often cuts a scan by eighty percent
before any tool touches it.

If you need the words back out of a scan, that needs recognition rather than
compression. [Read the text off it](/pdf-ocr) instead.

## What we can't do here

We can't recompress the images inside a PDF while leaving the text as text.
That's what the good desktop tools do, and it's the ideal answer: shrink the
photographs, keep everything else intact. Doing it properly means unpicking the
PDF's internal image streams, handling every colour space and every compression
type they might use, and putting them back without breaking the references.
That's a big piece of work and doing it badly produces corrupt files.

So the honest position is two blunt instruments rather than one sharp one:
lossless and modest, or drastic and destructive. If your PDF is mostly text with
a few heavy images and neither option suits, a desktop tool will beat this.

## Before you send it

Check the result before you attach it. Open it, search for a word you know is
in it, and see whether it's found. If it isn't, you flattened something that
shouldn't have been flattened, and the original is still sitting where you left
it.

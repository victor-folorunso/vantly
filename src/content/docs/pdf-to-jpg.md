---
updated: "2026-08-22"
title: What resolution should you export PDF pages at?
description: 150 dpi for screens, 300 for print. Why the pages come out soft at the default, and when JPG is the wrong choice for a page of text.
keywords: [pdf to jpg, pdf to image, export pdf pages, pdf page resolution]
---

150 dpi for anything read on a screen, 300 if it will be printed. The default
in most tools is 72, which is where the "why is it blurry" question comes from:
72 dpi is a screen measurement from the 1980s and no current display is that
coarse.

A PDF page has no resolution of its own. It's a description of shapes and text,
so it can be drawn at any size, and the number you choose decides how many
pixels you get. An A4 page at 150 dpi is about 1240 by 1754.

## What each setting is for

**72 dpi** is a thumbnail. Fine for a preview grid, unreadable for body text.

**150 dpi** is the useful default. Text is comfortably legible on a screen and
the files stay reasonable.

**300 dpi** is print quality, and what a printer or a print shop expects. An A4
page comes out around 2480 by 3508.

**600 dpi** is for scanning workflows and archival reproduction. The files are
large and the difference is invisible on a screen.

Doubling the dpi roughly quadruples the pixel count, so the jump from 150 to
300 is not a small one.

## JPG or PNG

This matters more than people expect for pages of text.

**JPG** suits pages that are mostly photographs. It's much smaller and the
compression artefacts hide well in continuous tone.

**PNG** suits pages that are mostly text, line art or diagrams. JPG puts a
faint halo around every hard edge, and text is nothing but hard edges. At small
sizes that halo is what makes exported text look slightly dirty.

If the page is a scanned document, it's already a photograph of text and JPG is
usually fine. If the page was typeset, [PNG](/pdf-to-png) will look noticeably
cleaner at the same size.

## Why the margins sometimes come out black

JPG has no transparency. A PDF page is transparent wherever nothing is drawn,
so converting without filling the background first leaves those areas as
whatever the encoder defaults to, and black is common.

The pages here are drawn onto white first, which is what a page is. If you see
black edges from another tool, that's the cause.

## When exporting images is the wrong answer

**If you want the words**, [extract the text](/pdf-to-txt) instead. Images of
text can't be searched, selected or read by a screen reader, and running
recognition on an image you exported from a text PDF is a long way round to
something you already had.

**If you want to send the document**, send the PDF. It's smaller than a folder
of page images and it stays one file.

**If you want to edit a page**, an image is a dead end. Nothing recovers the
text once it's pixels.

Exporting to images is right when something only accepts images: a slide deck,
a forum that won't take PDFs, a design tool, or a page you want to crop.

## Large documents

Every page is rendered separately, so a two hundred page document takes a while
and produces two hundred files. The work happens on your own machine, so the
limit is memory, and a long document at 300 dpi can be a lot to hold at once.

If you only need a few pages, [take them out first](/split-pdf) and export
those. It's faster and it avoids the memory question entirely.

Nothing is uploaded. The document is rendered in your browser, which matters
given that the things people export pages from are usually contracts,
statements and reports.

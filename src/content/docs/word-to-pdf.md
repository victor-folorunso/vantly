---
updated: "2026-08-21"
title: Why does my Word document look different as a PDF?
description: Fonts you have and the converter doesn't are the usual reason a converted document reflows. Here's what shifts, what doesn't, and how to stop it.
keywords: [word to pdf, docx to pdf, convert word to pdf, word formatting changed]
---

Nine times out of ten it's the fonts. Your computer has the font the document
was written in, the converter doesn't, so it substitutes the nearest thing it
has. If that substitute is even slightly wider, every line reflows, and a
document that was three pages becomes four with a heading stranded at the
bottom of page two.

Everything else in a Word file converts pretty faithfully. Tables, images,
headers, footers, page numbers, footnotes, columns. It's almost always type
that moves.

## Which fonts survive

This converter carries the Liberation family, which is metric compatible with
Arial, Times New Roman and Courier New. Metric compatible means each character
occupies exactly the same width as the font it replaces, so text set in Arial
reflows not at all. It looks very slightly different if you know what to look
for, and it breaks in the same places.

It also carries DejaVu and Noto, which between them cover Cyrillic, Greek,
Arabic, Hebrew, Chinese, Japanese, Korean and most Indic scripts. If your
document is in one of those and comes back as rows of empty rectangles
somewhere else, that's a missing font, not a broken file.

Calibri is the interesting case. It's been the Word default for years and it
isn't free, so the converter substitutes Carlito, which is metric compatible
with it. Same trick as Liberation, same result: your line breaks hold.

The fonts that do move things are the ones you installed yourself. A brand
typeface, something bought from a foundry, a face that came with another
application. Those get replaced by something with different widths and the
document reflows.

## How to stop it moving

Embed the fonts before you convert. In Word, go to File, Options, Save, and
tick "Embed fonts in the file". Save, then convert. The font travels inside the
document and gets used instead of a substitute.

There's a checkbox under it that says "Embed only the characters used in the
document". That makes the file smaller and it's fine for a document nobody will
edit again. Leave it off if the document is going to somebody who will keep
working on it.

Some fonts refuse to embed. Their licence forbids it, Word knows, and it
quietly skips them. If you embed and the type still moves, that's why.

## What actually gets lost

Nothing visible, in most documents. Some things worth knowing:

**Tracked changes and comments.** These convert as they are currently
displayed. If your document is showing markup, the markup lands in the PDF. If
it's showing the final version, it doesn't. Check which view you're in before
converting, because a contract exported with somebody's comments still on it is
an awkward email.

**Links.** Both kinds survive. Web links stay clickable and internal links to
headings still jump.

**Forms.** Word form fields don't become PDF form fields. They convert to their
appearance: a box with a line under it, and nothing to type into. If you need a
fillable PDF, that's a different job.

**Video and audio.** Anything embedded becomes a still picture of itself.

## Page size

The PDF uses whatever page size the document was set to. A document set to US
Letter converts to a Letter PDF even if you're in a country that uses A4, and
it'll print with odd margins.

Word takes the page size from the printer that was default when the document
was created, so a document written on a machine in the United States arrives on
a machine in Europe still set to Letter. Change it in Layout, Size before
converting, not after. Changing paper size in a PDF means scaling it, and
scaled text prints slightly soft.

## The one thing this can't do

It can't go backwards. There's no reliable way to turn a PDF back into an
editable Word file, and tools promising it hand you a page of loose text boxes
that look right and cannot be edited. Keep the original .docx. The PDF is the
copy you send, not the copy you keep.

If you only need the words out of a PDF, [pull the text out](/pdf-to-txt),
which is a different and much more solvable problem.

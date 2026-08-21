---
updated: "2026-08-21"
title: How do you take a few pages out of a PDF?
description: Pick the pages you want and save them as a new file. What splitting keeps, what it drops, and why the result can be bigger than you expect.
keywords: [split pdf, extract pages from pdf, separate pdf pages, take pages out of pdf]
---

Choose the pages, and what comes out is a new PDF containing only those. The
original is untouched, because nothing here writes back to the file you
uploaded.

The pages themselves come across exactly. Text stays text, images keep their
original quality, and nothing is re-rendered or re-compressed.

## Numbering catches people out

Page numbers here are the position in the file, counting from one. That isn't
always the number printed on the page.

A report with a cover, a contents page and then roman numerals before the main
text will have its "page 1" somewhere around the fifth or sixth position. If
you extract by the printed number you'll get the wrong pages, and the mistake
looks correct until somebody reads it.

Check the first and last page of the result before sending. It takes ten
seconds and catches nearly every version of this.

## Why a two page extract isn't tiny

A PDF stores fonts once for the whole document and shares them across every
page. Take two pages out and those two pages still need their fonts, so the
font data comes with them.

An extract of two pages from a two hundred page report can easily be a few
hundred kilobytes even though the pages look almost empty. Embedded fonts are
often the bulk of a small PDF.

The same applies to anything else shared: a logo appearing in a header on every
page is stored once and travels with any page that uses it.

If the result needs to be smaller, [compressing it](/compress-pdf) afterwards
is the way, and on a text document the lossless option usually does something
because the debris of the original is left behind.

## What doesn't come across

**Bookmarks.** The outline down the side of the reader is built for the whole
document and isn't rebuilt for the extract. A split long report has no outline.

**Links between pages.** An internal link pointing at a page that didn't make
it into the extract has nowhere to go. Links to the web still work.

**Digital signatures.** Any cryptographic signature is invalidated, and it must
be, since it attested to the whole document and you now have part of it.

**Form field relationships.** Fields survive individually. Anything computing a
total from fields on a page you didn't extract will come out blank.

## Splitting versus deleting

Two ways to get to the same place, and which one is less work depends on how
much you're keeping.

Extracting takes a few pages out of many. Deleting removes a few from many and keeps the rest.

If you want twenty pages of a two hundred page document, extract. If you want a
hundred and ninety eight of them, delete the two.

## Common reasons this is needed

The everyday ones are boring and constant. Sending one invoice from a statement
covering a year. Submitting the two pages of a form that were asked for.
Separating a scanned batch where several documents went through the feeder
together. Pulling one chapter out for a class.

The scanned batch is the fiddliest, because the page boundaries between
documents aren't marked anywhere and you have to look. Viewing the pages first
in [the reader](/pdf-viewer) is usually quicker than guessing and re-doing it.

## After splitting

If the pages are going to be recombined in a different order later, [merging
them back](/merge-pdf) works and the order is yours to set.

If the document was confidential and you're extracting the harmless pages to
share, check what's on the pages either side of your selection. Headers and
footers frequently carry a case number, a client name or a reference that the
body of the page doesn't.

Everything happens in your browser, so the document isn't uploaded. That's
worth something here, because splitting is usually done to documents that
contain more than the recipient is meant to see.

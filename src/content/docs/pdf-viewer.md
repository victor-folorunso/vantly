---
updated: "2026-08-22"
title: How do you read a PDF without installing anything?
description: Open it here and read it a page at a time or scroll the whole thing. Why it stays on your machine, and what a viewer can and can't tell you about a file.
keywords: [pdf viewer, open pdf online, read pdf without adobe, pdf reader]
---

Drop the file in and read it. There's nothing to install, no account, and the
document doesn't leave your machine.

Two ways to move through it. One page at a time, with arrows and the keyboard,
which suits a document you're reading properly. Or the whole thing as a scroll,
which suits skimming and lets the browser's own find work across what's on
screen.

Pages can be reordered and saved, which is the one thing here that changes the
file rather than just showing it.

## Why it stays on your machine

Every page is rendered in the browser. Nothing is uploaded, and there's no
server holding a copy afterwards.

That's the practical difference from most online PDF tools, and it matters
because of what people open: contracts, payslips, medical letters, bank
statements, tax documents. Handing those to a service to save a download is a
poor trade, and it's a trade most viewers make quietly.

The one exception on this site is the Office viewers, which genuinely can't
work in a browser and say so on their own pages.

## What a viewer can't tell you

**Whether the text is real text.** A scan looks identical to a typeset
document until you try to select something. If your cursor draws a box rather
than highlighting words, it's pictures of pages, and getting the words out
needs [recognition](/pdf-ocr) rather than
[extraction](/pdf-to-txt).

**Whether it's been altered.** A PDF carries no visible history. Edits made
before you received it are invisible, and a document that looks untouched may
not be.

**Whether a signature means anything.** A drawn or pasted signature is a
picture. A cryptographic signature is a different thing entirely, and reading
it requires software that checks the certificate rather than displays the page.

## Reordering pages

Moving pages here rewrites the document properly rather than rearranging
pictures of it. The real pages are copied into the new order, so the text stays
text and stays searchable.

Pages are labelled by position rather than by the number they came from,
because once something has moved, the original number is misleading.

The saved file is a copy. The original you opened is untouched, which is the
behaviour you want when a reorder turns out wrong.

## Files that won't open

**Password protected documents.** A viewer can't open what it can't decrypt. If
you know the password, opening it in a reader and [removing
it](/unlock-pdf) first is the route.

**Damaged files.** A truncated download or an interrupted transfer produces a
file that starts rendering and stops. If a document opens partially, that's
usually why, and re-downloading it is the fix.

**Very large documents.** Everything is held in memory, so a several hundred
megabyte file can struggle where a smaller one is instant. Splitting it is the
practical answer.

## Reading long documents

The scroll view is better for finding something, because the browser's find
works on the pages that have rendered.

The page-at-a-time view is better for reading, and the arrow keys move through
it without reaching for the mouse.

For a document you'll come back to repeatedly, downloading it and using a
desktop reader is still the better experience. This is for opening something
once, on a machine that may not have a reader installed, without giving the
file to anyone.

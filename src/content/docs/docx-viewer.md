---
updated: "2026-08-22"
title: How do you open a Word file without Word?
description: The document is converted to a PDF and shown here. What survives, what doesn't, and why this one tool sends your file to a server when the rest don't.
keywords: [docx viewer, open docx without word, view word document online, doc file opener]
---

Drop the file in and it's converted to a PDF, then displayed page by page. You
get the document laid out as it was written, with the fonts, tables, images,
headers and page breaks intact.

You can read it and download the PDF. You can't edit it, which is deliberate:
an editor that half works on someone's contract is worse than an honest viewer.

## This one uploads your file

Every other tool on this site does its work in your browser. This one can't.

Nothing in a browser reads the Word format properly. The formats are large,
old and full of features, and the only software that handles them faithfully is
a full office suite. So the file goes to a server running LibreOffice, which
converts it to a PDF and sends that back. The file is converted and discarded,
not stored.

That's a real difference from the rest of the site and it's why it's said here
rather than buried. If the document is sensitive enough that this matters, open
it in something local instead.

## What survives the conversion

Text, formatting and styles. Tables, including merged cells. Images and their
positioning. Headers, footers and page numbers. Footnotes and endnotes.
Multiple columns. Links, both to the web and within the document.

## What doesn't

**Tracked changes appear as they were last displayed.** If the document was
saved showing markup, the markup is in the PDF. If it was showing the final
version, it isn't. Worth checking before you send anyone the result.

**Comments** behave the same way.

**Form fields** become their appearance: a box with a line under it, and
nothing to type into.

**Macros** don't run, which is a feature. A document arriving by email with
macros in it is the oldest trick there is, and viewing it this way can't
execute anything.

**Embedded video and audio** become a still picture.

## Why the layout sometimes shifts

Fonts. If the document uses a typeface the converter doesn't have, it
substitutes the nearest available, and if that substitute is even slightly
wider, lines reflow and page breaks move.

The converter carries metric-compatible replacements for the common Microsoft
fonts, so Arial, Times New Roman, Courier New and Calibri all hold their
spacing exactly. It also carries broad coverage for non-Latin scripts.

What shifts is anything unusual: a brand typeface, something bought from a
foundry, a face that came with another application. If the layout matters,
embed the fonts in Word before converting, under File, Options, Save.

## The formats it accepts

`.docx` and the older `.doc`, plus `.odt` from LibreOffice and OpenOffice, and
`.rtf`.

The old `.doc` format converts well but is less predictable than `.docx`,
because it's a binary format from the nineties with a great deal of
undocumented behaviour.

## When something else is the better answer

**If you need to edit**, use a real editor. Word Online and Google Docs are
both free and both handle `.docx` properly.

**If you just want the words**, and layout doesn't matter, converting to PDF
and [pulling the text out](/pdf-to-txt) gets you plain text you can paste
anywhere.

**If you need a PDF to send someone**, [convert it directly](/word-to-pdf).
Same machinery, and it hands you the file rather than displaying it.

## Files that won't open

**Password protected documents** can't be converted, because the converter
can't open them either. Remove the password in Word first.

**Corrupt files** sometimes convert partially, producing a PDF that's missing
sections. If the result looks wrong, it probably is.

**Very large documents** take a while. A two hundred page report with images
can take a minute or so, and the first request after an idle period is slower
because the container has to start.

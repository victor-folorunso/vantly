---
updated: "2026-11-07"
title: Can someone remove a watermark from a PDF?
description: Yes, with the right editor. A text watermark marks a copy as a draft or as yours, but it doesn't lock anything. What it's for, and what to do when you need more.
keywords: [watermark pdf, add watermark to pdf, pdf watermark, draft watermark pdf, confidential watermark]
---

Yes. The watermark is real text added on top of each page, so anyone with a
PDF editor can select it and delete it, or cover it. It's a label, not a lock.
It tells everyone who opens the file that this copy is a draft, or
confidential, or yours, and that's what it's for.

If you need a copy nobody can lift clean pages out of, the watermark alone
won't do it. There's a way to get much closer, further down.

## What the tool adds

One line of text, centred on every page, in grey bold type. You choose the
words, how faded it is (from 5% to 60%) and the angle (flat to upright, in
steps of 15 degrees). The size is worked out from the page, so the text spans a
portrait or landscape page without running off the edge.

Every page gets the same mark. There's no way yet to mark only some pages, or
to put an image or logo there instead of text.

The rest of the document isn't touched. Text stays selectable and links still
work. The font is one every PDF reader already has, so it isn't embedded in
the file.

## Picking the opacity

The default is 18%, and that's about right for most documents: visible on
every page, faint enough that the text underneath still reads cleanly when
printed.

Go higher, around 30% to 40%, when the point is to stop the copy being passed
off as final. A proof for a client, a sample chapter, a contract that isn't
signed yet. Go lower when the mark is only a reminder for people who already
know it's a draft.

Check one page at full size before you send the file. Grey on a page full of
photographs or dark tables disappears much sooner than grey on white paper.

## Short words work best

The text is scaled so its length fits across the page. One word like DRAFT
comes out large and obvious. A whole sentence comes out small and is easy to
miss. If you need to say more than a word or two, a sentence in the document
itself will do it better.

## Letters it can't use yet

The watermark is drawn in one of the fonts every PDF reader carries, and that
font only covers Western European letters. Accents like é and ü are fine.
Cyrillic, Greek, Arabic, Chinese and Yoruba letters with dots underneath (ẹ,
ọ, ṣ) aren't, and the tool will tell you which character it couldn't use. For
now, write the watermark without them.

## Making it harder to remove

A watermark someone can delete is a strong hint. To make it a lot of work to
remove, flatten the file after marking it, so every page becomes a picture
with the watermark baked in.

The [PDF compressor](/compress-pdf) can do that. Mark the file here, then
compress it with Flatten to pictures chosen. The text and the watermark become
part of one image per page, and there's no separate line of text left to
delete.

Flattening has a cost. Nobody can select, copy or search the text afterwards,
and a screen reader has nothing to read. That's fine for a proof you're
sending to a client to look at. It's wrong for anything someone has to work
with or fill in.

Even then, nothing stops someone retyping a document or editing the picture.
If the content truly mustn't leave your hands, don't send the file.

## Password protected PDFs

If the PDF needs a password to open, the watermark can't be added. Remove the
password first with [unlock PDF](/unlock-pdf), using the password you already
have, mark the unlocked copy, and keep the original somewhere safe.

## Watermarks and printing

The mark is part of the page, so it prints wherever the page prints. Most
printers lighten pale grey a little, so a mark that looks faint on screen can
come out fainter still on paper. If the printed copy is the one that matters,
nudge the opacity up a step and print a test page.

---
updated: "2026-08-22"
title: How accurate is reading text from a picture?
description: A clean scan reads almost perfectly. A photo taken at an angle reads badly, and handwriting mostly doesn't work. What to change to get a better result.
keywords: [image to text, ocr online, extract text from image, screenshot to text]
---

A clean, straight scan of printed text reads at around 98% or better. A
screenshot reads close to perfectly, because the letters are already sharp
pixels. A photograph of a page taken at an angle, in poor light, reads badly
enough that retyping is sometimes faster.

Handwriting is not what this is for. The recogniser here is trained on printed
type, and cursive in particular comes back as nonsense.

## What makes the difference

**Resolution.** Accuracy falls off a cliff below about 300 dots per inch. Text
that's 20 pixels tall reads well. Text that's 8 pixels tall mostly doesn't. If
you're photographing a page, fill the frame with it rather than capturing the
whole desk.

**Straightness.** A page photographed at an angle has letters that lean and
lines that curve across the frame. A few degrees is fine. Fifteen degrees is
not. Scanning apps that flatten the perspective first are worth using for this
reason alone.

**Contrast.** Black on white is ideal. Grey on cream, a photocopy of a
photocopy, or text over a photograph all cost accuracy. Increasing contrast
before you start helps more than any setting here.

**Even light.** A shadow across half the page, or a bright spot from a lamp,
splits the image into regions the recogniser handles differently. Flat,
indirect light beats a bright direct one.

## Picking the language

Set it before running, not after. The recogniser uses the language to decide
between characters that look alike, so telling it the wrong one costs real
accuracy rather than just labelling the output.

For a document mixing two languages, run it twice and keep the better result
for each section. There's no reliable way to do both at once.

Languages that don't use the Latin alphabet work, and they download their own
data the first time you pick them.

## What comes back, and what doesn't

You get the words. You mostly don't get the layout.

Columns are the usual disappointment. A two column page reads as one long
column with the lines interleaved, because the recogniser reads across the
page. If the layout matters, crop each column and run them separately.

Tables lose their structure and come back as rows of words. Headings lose
their size. Bold and italic disappear. Anything set in an unusual display face
reads worse than the body text around it.

## The mistakes it makes

They're consistent enough to be worth knowing when proofreading:

- `0` and `O`, `1` and `l` and `I`, `5` and `S`, `8` and `B`
- `rn` read as `m`, which is the classic one
- `cl` read as `d`
- Accented characters dropped when the language is set to English

Numbers are worth checking specifically. A misread digit in a reference or an
amount is both easy to make and hard to spot, because the surrounding text
reads fine and nothing looks wrong.

## Scanned PDFs

A PDF that's pictures of pages needs this rather than the ordinary
[text extraction](/pdf-to-txt), which finds nothing because there's no text in
the file to find. If selecting text in your reader does nothing, that's the
case you have.

The [PDF version of this tool](/pdf-ocr) renders each page and reads it. Long
documents take a while, since every page is processed separately.

## What it downloads, and what it doesn't send

The picture stays on your machine. The recogniser itself is downloaded the
first time you use it, about 5MB plus the language data, and then cached, so
the first run is slower than the ones after it.

That's the trade being made here: a few megabytes once, in exchange for your
documents never being uploaded anywhere. Most online OCR sends your file to a
server, and for a passport, a payslip or a contract that's a meaningful
difference.

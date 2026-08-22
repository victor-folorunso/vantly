---
updated: "2026-08-22"
title: Does converting a JPG to PNG improve the quality?
description: No. The damage is already in the pixels and PNG just stores them faithfully, at a much larger size. Here's when the conversion is still worth doing.
keywords: [jpg to png, does png improve quality, convert jpg to png, jpeg to png]
---

No, and this is the most common misunderstanding about the two formats. PNG is
lossless, so it stores exactly what it's given. What it's given is a JPG that
already had detail thrown away when it was first saved, and nothing can put
that back.

The result is a file three to five times larger holding an identical picture,
compression artefacts and all.

## When it's still worth doing

**You need transparency.** This is the real reason. You can't make a JPG
transparent, but converting to PNG gives you a format that supports it, and
then you can erase a background. The conversion doesn't create transparency, it
just gives you somewhere to put it.

**You're about to edit repeatedly.** Every JPG save loses a little more. Convert
to PNG first, do your editing, and export a JPG once at the end. That way the
damage happens once rather than at every save.

**Something demands PNG.** Some print workflows, some app store listings and
some documentation tools accept nothing else. Fair enough.

**You need exact pixels.** For a screenshot going into a bug report or a
comparison, PNG guarantees nobody's viewer recompresses it further.

## When it isn't

If the picture is a photograph that's staying a photograph, converting to PNG
just makes it heavier. A 500KB JPG becomes a 2MB PNG and looks identical.

Uploading that to a website makes the page slower for no benefit. If size is
the concern, go the other way, or use WebP.

## What it can't fix

**Blockiness and banding.** Those blotchy squares in a sky, or the ringing
around text and edges, are in the pixel values now. PNG copies them faithfully.

**Colour that was already crushed.** JPG stores colour at lower resolution than
brightness, which is why sharp red or blue edges look smeared. That's baked in.

**A low resolution image.** Converting doesn't add pixels. If it's 400 across,
it stays 400 across.

The general rule: a lossless format preserves what it's given. It doesn't
recover what was lost before it arrived.

## About "upscaling" and repair claims

Tools promising to restore a damaged JPG are either sharpening, which makes
artefacts more visible while looking crisper at a glance, or generating new
detail with a model, which invents plausible pixels rather than recovering the
real ones.

That can look good and is fine for a wallpaper. It's not fine for anything
where the picture is evidence of something: a document, a product photo, a
photograph of a person.

## File sizes to expect

Rough numbers for a typical photograph at 2000 pixels wide:

| Format | Size |
|---|---|
| JPG at 80% | 400KB to 600KB |
| WebP, similar quality | 250KB to 400KB |
| PNG | 2MB to 4MB |

PNG only wins on size when the image has few colours and large flat areas: a
logo, an icon, a diagram, a screenshot of text. For those it can be smaller
than JPG as well as sharper.

## If transparency is the goal

Convert to PNG, then remove the background in an editor. The conversion is step
one of two, and doing only step one leaves you with a large file and the same
opaque rectangle.

WebP is worth considering instead. It supports transparency, it's lossless if
you want it to be, and it's smaller than PNG either way. Every current browser
reads it.

Everything happens in your browser. Nothing is uploaded, and there's no limit
on how many you convert at once.

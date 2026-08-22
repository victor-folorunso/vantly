---
updated: "2026-08-22"
title: Why did my PNG turn black when I saved it as JPG?
description: JPG has no transparency, so anything see-through has to become a colour. Black is the usual default. Here's how to control what it becomes.
keywords: [png to jpg, png transparent background black, convert png to jpg, jpg no transparency]
---

Because JPG cannot store transparency at all, and your PNG had some. Every
see-through pixel needs an actual colour, and whatever tool converted it picked
one for you. Black is the common default, which is why logos and cut-out
product photos arrive as a dark rectangle.

Here the transparent areas become white, which is right far more often. If you
need a different colour behind the image, put one there before converting.

## When to convert at all

**Do it** when the image is a photograph. JPG was designed for photographs and
will be several times smaller than the same picture as PNG, with no visible
difference. A 4MB PNG photo is usually a 400KB JPG.

**Don't** when the image is a logo, an icon, a screenshot of text, or a diagram.
JPG smears hard edges, and text and line art are all hard edges. The artefacts
show up as a faint halo around every letter.

**Don't** when you need the transparency. There's no way to keep it. If the
reason for converting is file size, [WebP](/png-to-webp) keeps transparency and
is usually smaller than both.

## What you lose, precisely

**Transparency**, as above.

**Exactness.** PNG is lossless: every pixel comes back exactly as it went in.
JPG throws information away to get smaller. On a photograph that's invisible.
On a screenshot it isn't.

**Repeat edits.** Each save re-compresses and loses a little more. Editing a
JPG five times leaves visible damage. PNG can be edited endlessly with no loss,
which is why it's the better working format even when you deliver JPG.

**Colour depth beyond 8 bits**, if you had it. Rare outside photography and
design work, but real.

## Choosing the quality

Around 80% is the useful default. Most people can't tell it from the original
at 90% and the file is meaningfully smaller.

Below about 60% you start seeing blocky patches in flat areas like skies, and
ringing around any sharp edge. Above 95% the file grows quickly and the
improvement is hard to see.

If the picture contains text, use a higher setting than you would for a
photograph, or convert something else.

## The transparency question, in practice

Think about what the image will sit on. A logo converted with a white
background looks fine on a white page and wrong on a coloured one, where it
shows as a white box.

If you don't know where it will be used, don't convert. Keep the PNG, or use
WebP so the transparency survives.

If you're converting for a specific place, match the background of that place.
That's the only way to make a flattened image look like it still has
transparency.

## Screenshots specifically

Screenshots should stay PNG. They're mostly flat colour and sharp text, which
is what PNG compresses well and JPG compresses badly. A screenshot saved as JPG
is often *larger* than the PNG as well as worse, which surprises people.

The exception is a screenshot of a photograph or a video frame, which is really
a photograph and behaves like one.

## Getting the size down another way

If the problem is the file being too big, try these before flattening:

- [Resize it](/image-resizer). Halving the width and height cuts the file to
  roughly a quarter and is invisible if the image was larger than it's
  displayed.
- [Compress the PNG](/image-compressor). PNGs from screenshots and design tools
  often carry metadata and unused palette entries.
- Convert to WebP instead, which keeps transparency and beats JPG on size.

Everything runs in your browser, so the image isn't uploaded and there's no
limit on how many you do at once.

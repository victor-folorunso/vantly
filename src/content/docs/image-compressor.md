---
updated: "2026-08-19"

title: Which image format should you actually use?
description: JPG for photos, PNG for graphics, WebP for the web. Here is why, and why compressing a photo to PNG makes it bigger.
keywords: [jpg vs png, webp vs jpg, image format, compress images, avif]
---

Photographs go in JPG or WebP. Screenshots, logos and anything with flat colour
or transparency go in PNG or WebP. If the file is for a website and you do not
need to support software older than about 2020, WebP beats both.

That covers most decisions. The rest of this explains why, and what goes wrong
when you pick the other one.

## Lossy and lossless, which is the whole distinction

JPG, WebP and AVIF are **lossy**. They throw information away permanently and
store an approximation. Done well you cannot see the difference, and the file is
a fraction of the size.

PNG is **lossless**. Every pixel comes back exactly as it went in. Nothing is
discarded, which is why it cannot get anywhere near the same size on a
photograph.

This is why compressing a photo to PNG makes it larger rather than smaller, and
it surprises people constantly. A 3MB JPG saved as PNG can come out at 12MB. PNG
is not doing a bad job, it is doing a different job. It is preserving detail that
JPG had already thrown away and that your eye was never going to notice.

The reverse is just as bad. A screenshot of text saved as JPG picks up a halo of
smeared pixels around every letter, because JPG's compression assumes it is
looking at a photograph where sharp edges are rare.

## What to use, and when

**JPG** is right for photographs going anywhere at all. Every piece of software
written in the last thirty years reads it, including print shops, old versions of
Office and whatever a government upload form is running. It has no transparency.

**PNG** is right for screenshots, logos, diagrams, icons and anything with a
transparent background. Flat areas of colour compress extremely well in PNG, so a
logo can be smaller as PNG than as JPG *and* look sharper.

**WebP** is right for the web. It does both jobs: lossy for photos, lossless with
transparency for graphics, and it is typically 25 to 35 percent smaller than JPG
at the same visible quality. Every current browser reads it. Older desktop
software often does not, so it is a poor choice for a file you are emailing to
somebody.

**AVIF** compresses better still, often another 20 percent below WebP, and
browser support is now broad. It is slower to encode and support outside browsers
is thinner. Worth using when the saving matters more than universal
compatibility.

## Quality settings, and where the money is

Quality on a lossy format is not a percentage of anything meaningful. It is a
dial on how aggressively detail is discarded, and the relationship between the
number and the file size is steep at the top.

Between 75 and 85 you get most of the saving for a difference you will struggle
to see on a photograph. Above 90 the file grows fast in exchange for detail your
eye is not collecting. At 100 a JPG can be double the size of the same image at
92 and look identical.

Below about 60 it starts to show, first in areas of subtle gradient like skies and
skin, where you will see banding and blocky patches.

**Compression is not reversible.** Once the detail is gone it does not come back,
and saving a compressed file again compresses what is left. Keep the original if
the image might need editing later.

## Dimensions usually matter more than quality

The single biggest thing people miss: a 4000 pixel wide photo displayed in a 800
pixel wide column is carrying five times the pixels it needs. Dropping the
dimensions saves far more than any quality setting, and costs nothing visible
because those pixels were never being shown.

If a photo is going on a website, [resize it first](/image-resizer), then
compress. Doing it the other way round means you carefully compressed pixels you
were about to throw away.

## What compression cannot fix

It cannot sharpen a blurry photo, recover a blown out sky, or add detail that the
camera did not capture. Compression only ever removes.

It also cannot make a badly chosen format behave. If your PNG of a photograph is
enormous, no amount of PNG compression will fix it, because the problem is the
format rather than the settings.

## A quick table

| You have | Going where | Use |
|---|---|---|
| Photograph | A website | WebP, or AVIF |
| Photograph | Email, print, an upload form | JPG |
| Screenshot or logo | Anywhere | PNG |
| Logo with transparency | A website | WebP |
| Anything | Editing later | Keep the original too |

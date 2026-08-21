---
updated: "2026-08-21"
title: Should you convert PNG to WebP?
description: WebP is usually 25 to 35 percent smaller than PNG with no visible difference. When it helps, when it doesn't, and what breaks.
keywords: [png to webp, convert png to webp, webp vs png, smaller images for web]
---

For anything going on a website, almost always. WebP is typically 25 to 35
percent smaller than the same PNG with no visible difference, and every browser
still receiving security updates has read it since 2020.

For anything else, probably not. If the image is going into a print job, a
document somebody will edit, or an application that isn't a browser, PNG is
still the safer thing to hand over.

## Why it's smaller

PNG compresses losslessly, and it's good at flat colour: logos, screenshots,
diagrams, anything with large areas of exactly the same pixel. It's poor at
photographs, because a photograph has no repeated runs to compress.

WebP does both. Its lossless mode beats PNG at PNG's own game, usually by
around a quarter. Its lossy mode does what JPEG does, but better at the same
file size, and unlike JPEG it can keep transparency.

That last part is the useful bit. Before WebP, an image needing transparency
had to be a PNG, so a photographic image with a soft edge was enormous. WebP
lets it be lossy and transparent at once.

## Lossless or lossy

Convert lossless if the image has flat colour and hard edges. A logo, an icon,
a screenshot with text in it. Lossy compression puts a faint halo around hard
edges, and on a screenshot of text that halo is visible and ugly.

Convert lossy if the image is photographic. At around 80 percent quality most
people can't see the difference from the original, and the file is a fraction of
the PNG.

If you're unsure, look at the image and ask whether it has text or sharp lines
in it. Text means lossless.

## What breaks

**Old software.** Photoshop needed a plugin until 2022. Plenty of desktop
applications, image viewers and print workflows still can't open a WebP without
being told how. If the file is going to a person rather than a web page, that's
a real cost.

**Email.** Some mail clients won't display WebP inline. An embedded image that
shows as a broken box in Outlook is worse than a slightly larger PNG.

**Social previews.** Most platforms handle WebP now, but a few still want JPEG
or PNG for the link preview image, and a preview that silently doesn't render
costs more than the bytes saved.

**Anything printed.** Print workflows run on CMYK, and WebP has no CMYK. A
printer will ask for something else.

## The transparency edge case

WebP keeps an alpha channel in both modes, so transparency survives. What
doesn't always survive is a PNG that uses a colour palette with a single
transparent index, which is common in very old graphics. Those convert fine but
sometimes come back a byte or two larger, because WebP has no equivalent trick
for that specific case.

If a converted image has a faint dark fringe where it used to be clean, the
original was probably stored with unpremultiplied alpha and the converter has
composited it against black. Converting from the original source rather than
from an already-converted copy usually fixes it.

## Don't convert twice

Every lossy conversion throws away detail permanently. Converting a JPEG to a
lossy WebP means the WebP carries the JPEG's losses plus its own, and the result
is worse than either would have been from the original.

Keep the original. Convert from it each time you need a different format. That
sounds obvious and it's the single most common way images end up looking
mushy after a few years of being passed around.

## What this does with yours

The conversion happens in your browser using its own image encoder. The file
isn't uploaded, and there's no limit on how many you can do beyond what your own
machine will hold in memory.

One consequence worth knowing: browsers will encode PNG, JPEG and WebP, and
that's the whole list. If you need AVIF, which is smaller again, a browser
cannot produce one and any tool claiming to do it locally is either using a
large WebAssembly encoder or quietly handing you a PNG with the wrong name on
it.

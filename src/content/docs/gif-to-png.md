---
updated: "2026-08-22"
title: Why did my animated GIF become a single still image?
description: PNG holds one frame, so an animation converts to its first frame only. What to do if you wanted the movement, and what to do if you wanted one picture.
keywords: [gif to png, animated gif to png, gif first frame, convert gif]
---

Because a PNG holds one image and a GIF can hold hundreds. Converting takes the
first frame and discards the rest, which is the only thing it can do.

If you wanted a still, that's the right answer. If you wanted the animation to
survive, PNG is the wrong destination.

## Keeping the animation

**WebP** is the practical choice. It stores animation, every current browser
reads it, and it's usually a fraction of the size of the same GIF. An animated
GIF converted to WebP commonly drops by 60 to 80%.

**MP4 or WebM** is better still for anything longer than a couple of seconds.
Video codecs are enormously more efficient than GIF, which is why every social
platform quietly converts uploaded GIFs to video. A 5MB GIF is often a 300KB
MP4.

**APNG** is animated PNG. It works in current browsers and keeps proper
transparency, but support in editors and apps is patchy, so it's a niche
choice.

## Why the colours look wrong

GIF stores at most 256 colours per frame. A photograph converted to GIF has
already been reduced to that palette, usually with dithering, which is the
speckled pattern you see in gradients and skies.

Converting to PNG preserves that speckle exactly, because PNG is lossless. It
looks no better than the GIF, and the file may be larger.

Nothing can recover the original colours. They were discarded when the GIF was
made.

## What PNG does gain you

**Proper transparency.** GIF transparency is one bit: a pixel is either fully
visible or fully invisible, which is why GIFs with soft edges have that jagged
fringe, often in white or grey. PNG supports 256 levels of transparency.

Converting won't smooth an existing jagged edge, since the information isn't
there, but it does mean any editing you do afterwards can have soft edges.

**No palette limit.** Anything you paint into the converted image can use the
full colour range, which the GIF couldn't have held.

## Picking a different frame

The conversion takes the first frame because that's the sensible default, and
the first frame of most GIFs is a reasonable representative.

It isn't always. Plenty of GIFs open on a blank or dark frame and the
interesting moment is in the middle. If you need a specific frame, the reliable
route is to open the GIF in something that shows the frames, or convert it to
video and take a still from there.

## Sizes to expect

A short GIF converted to a single PNG is nearly always much smaller, because
you're keeping one frame out of many.

A single-frame GIF converted to PNG is usually similar or slightly smaller, and
PNG compresses flat colour better than GIF's older scheme.

A photograph in GIF form converted to PNG can grow, because the dithering
pattern is noise, and noise is exactly what lossless compression struggles
with. For a photograph, [JPG](/gif-to-jpg) or WebP will be far smaller.

## What GIF is still good for

Not much, honestly. It survives because it's universally supported and because
messaging apps and forums accept it. For anything you control, WebP is smaller
with better colour, and video is smaller still.

The one real advantage is that a GIF plays anywhere without a player and
without autoplay rules getting in the way, which is why they persist in email
and older forums.

Everything runs in your browser, so nothing is uploaded and there's no limit on
how many you convert at once.

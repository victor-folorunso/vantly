---
updated: "2026-08-22"
title: Why is my GIF bigger than the video it came from?
description: GIF is a format from 1987 with no motion compression, so every frame is stored almost whole. What to change to get it down, and when to send video instead.
keywords: [mp4 to gif, gif file size, convert video to gif, gif too large]
---

Because GIF stores frames almost independently. Modern video codecs describe
what changed between one frame and the next, which is why a ten second clip
can be a few hundred kilobytes. GIF has nothing like that, so a ten second clip
at full size and frame rate can easily be 20MB.

It's a format from 1987 and it was never meant for this. The good news is that
three settings account for nearly all of the size.

## The three levers, in order of effect

**Length.** File size is close to linear with duration, so trimming five
seconds off a fifteen second clip removes a third of the file. Nothing else
comes close. Most GIFs that need to be smaller are simply too long.

**Frame rate.** 10 to 12 frames a second reads as motion and is perfectly
watchable for a screen recording or a reaction clip. Going from 24 down to 12
halves the file. Below about 8 it starts to look like a slideshow, though for
a slow pan even that can be fine.

**Width.** Halving the width quarters the pixel count. 480 pixels is plenty
for something people watch inline in a chat or a document.

Do all three before touching anything else, and most clips land somewhere
sensible.

## Why the colours look wrong

GIF holds at most 256 colours per frame. A video holds millions.

So converting has to choose 256 colours to represent everything, and gradients
suffer most: skies, shadows, skin tones and anything with a smooth fade turn
into visible bands or a speckled dither pattern.

Footage with flat colour, like a screen recording or an animation, converts
almost perfectly. Footage with a lot of tonal range doesn't, and no setting
fixes it, because the limit is the format.

## When to use something else

**WebP** does animation, holds full colour, and is commonly a fifth of the size
of the same GIF. Every current browser reads it. If the destination is a
website you control, it's simply better.

**MP4 or WebM** is far smaller again for anything over a couple of seconds.
Every social platform quietly converts uploaded GIFs to video for exactly this
reason.

The case for GIF is that it plays absolutely anywhere with no player, no
autoplay rules and no controls: email, old forums, chat apps, documentation
that has to work offline. That's a real advantage and it's the only one.

## What it can't do

**Sound.** GIF has no audio track at all. If the clip needs sound, it needs to
be video, and there's no way around it.

**Long clips.** Anything over about fifteen seconds is the wrong shape for
this format. It'll produce a file, and it'll be enormous.

## A practical recipe

For a screen recording to put in a bug report or a document: 10 frames a
second, 640 wide, trimmed to the seconds that matter. That's usually under 2MB
and completely legible.

For a short reaction clip: 12 to 15 frames a second, 480 wide, under five
seconds.

For anything longer or with sound, send the video.

## Where the limits bite

Most messaging apps cap what they'll carry, often around 8 to 16MB, and some
convert GIFs to video on upload anyway. Email attachments are usually capped
at 20 to 25MB.

If a GIF is being rejected, it's nearly always length rather than resolution.
Trim first.

Everything happens in your browser. The converter is about 30MB and downloads
the first time you use it, then stays cached, so the first conversion is
slower than the ones after it. Your video is not uploaded.

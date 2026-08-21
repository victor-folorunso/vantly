---
updated: "2026-08-21"
title: How do you make a video small enough to send?
description: Resolution first, then quality. Why a phone video is enormous, what the limits actually are, and how long compressing takes in a browser.
keywords: [video compressor, compress video, video too big to email, reduce video size]
---

Drop the resolution first, then the quality. Halving the width and height cuts
the file to roughly a quarter on its own, and a 1080p clip watched on a phone
looks the same at 720p.

Quality is the second dial. Below a certain point video goes blocky in fast
motion, and the point varies with the footage.

## Why phone video is so large

A minute of 4K at 60 frames a second is around 400MB. That's not a fault, it's
what recording eight million pixels sixty times a second costs.

Most phones default to something high because the footage looks good on the
phone's own screen. Almost nobody watching your video needs that, and email and
messaging services all cap what they'll carry.

The everyday limits worth knowing:

- **Gmail:** 25MB, and it offers a Drive link above that
- **Outlook:** 20MB
- **WhatsApp:** 16MB for a video sent in a chat
- **Slack:** 1GB on paid plans
- **Discord:** 10MB without a paid plan

## What to set

**Resolution.** 720p is the useful default for anything watched on a phone or
in a message. 1080p if it's going somewhere it'll be watched properly. 480p if
it just has to arrive.

**Quality.** The slider runs from high to small. High is worth it for footage
with detail that matters, like a screen recording where text has to be legible.
Small is fine for a clip of something happening.

Text is the thing that suffers first. A screen recording compressed hard becomes
unreadable well before ordinary footage looks bad, so if you're sending a screen
capture, keep the quality up and drop the resolution less.

## Trimming beats compressing

If the video is three minutes and only twenty seconds matter, cutting it is
worth more than any compression setting. File size is roughly proportional to
length, so removing eighty percent of the footage removes eighty percent of the
file.

That's obvious and it's routinely the last thing people try.

## How long this takes

The work happens on your own machine, in your browser, so speed depends on your
machine. A one minute clip at 720p takes a couple of minutes on a laptop.
Longer clips scale roughly with length. A phone will be considerably slower and
may run out of memory on anything long.

The first run also downloads the converter, which is around 30MB, once. If the
first attempt seems to stall before anything happens, that's the download rather
than the conversion.

The converter here runs on a single thread. There's a faster multi-threaded
version and using it would require security headers that break other tools on
this site, so this is slower than a desktop application and always will be. For
a two hour recording, a desktop tool is the right answer.

## Formats

**MP4** with H.264 plays everywhere. It's the safe choice and the default.

**WebM** is smaller at the same quality and plays in every browser, but not in
every desktop player or on some TVs. Good for a website, risky for sending to
somebody.

If a video won't play for the person you sent it to, it's almost always this,
and re-sending as MP4 fixes it.

## What compressing can't do

It can't make blurry footage sharp, and it can't recover detail that a previous
compression removed. Compressing an already-compressed video adds its losses to
the existing ones, which is why a clip forwarded through several apps ends up
smeared.

Compress once, from the original, and keep the original.

## Nothing is uploaded

The video stays on your machine. That's not only a privacy point here, it's a
practical one: there's no upload wait and no file size cap imposed by a server.
The constraint is your own memory, which is why very large files can fail where
a small one succeeds.

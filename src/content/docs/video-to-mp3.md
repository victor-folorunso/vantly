---
updated: "2026-08-21"
title: What bitrate should I pick when pulling audio out of a video?
description: Converting never adds quality back. How to tell what the video already has, and why a higher bitrate than the source only wastes space.
keywords: [video to mp3, mp4 to mp3, extract audio from video, mp3 bitrate]
---

Match the source, or go slightly below it. Picking a higher bitrate than the
audio already has doesn't improve anything. It just stores the same sound less
efficiently, and you get a bigger file that sounds identical.

Most video from the web carries audio at 128 or 192 kbps. Converting that to
320 gives you a file two and a half times the size with nothing extra in it.

## Why quality can't come back

The audio in your video is already compressed, and compression works by
throwing away detail it decides you won't hear. That detail is gone from the
file. Nothing downstream can recover it, because there's nothing left to
recover from.

So every conversion is at best a copy and usually slightly worse, because
compressing already-compressed audio makes new decisions on top of old ones.
That's generation loss, and it's why a file converted back and forth a few times
starts sounding watery and hollow, particularly on cymbals and applause.

Convert once, from the best source you have, and keep that source.

## What to pick

- **320 kbps** for music you'll listen to properly, on decent headphones, from
  a good source. Overkill for anything else.
- **192 kbps** is the sensible default. Most people can't reliably tell it from
  320 on ordinary equipment.
- **128 kbps** is fine for a podcast, a lecture, or anything spoken.
- **96 kbps** for speech where size matters more than warmth. An hour of talk
  comes to around 40MB.

If you don't know what the source is, 192 is a safe choice. It's above what
most web video carries, so nothing is lost, and it doesn't waste much.

## Formats other than MP3

MP3 is the one everything plays. Every car, every cheap speaker, every ancient
device. That's its whole argument, and it's a strong one.

**M4A** using AAC sounds better than MP3 at the same bitrate, noticeably so
below 128. Apple devices prefer it. Some older car stereos won't play it.

**Ogg** with Vorbis also beats MP3 at low bitrates and carries no patent
history. Support outside browsers and Android is patchy.

**WAV** is uncompressed. It'll be roughly ten times the size and it does not
sound better than the compressed source it came from, because the detail was
already discarded. Only use it if you're feeding the file into an editor that
wants uncompressed input.

## Length, and how long this takes

Everything happens in your browser, so the work is done by your own machine.
A three minute track takes a few seconds. A two hour recording takes a while,
and a phone will be slower than a laptop.

The first conversion also downloads the converter itself, which is around 30MB.
That happens once and the browser caches it, so the second conversion starts
immediately. If the first one seems to hang for a minute, that's the download.

Very large videos can run the browser tab out of memory, because the file has
to be held while it's worked on. If a two hour video fails, trimming it first is
the way through.

## The legal part, briefly

Pulling the audio out of a video you own, or that you made, or that's licensed
for it, is fine. Doing it to a copyrighted music video and then distributing
the result isn't, and no tool changes that.

This one doesn't fetch anything from anywhere. It works on a file you already
have on your machine, which keeps the question about what you do with the
result rather than about the tool.

## If the result is silent

A few videos carry more than one audio track, and some carry a track in a codec
that the converter can't read. If you get silence, or a file of nearly no size,
that's usually why.

The other common cause is a video that genuinely has no audio track at all,
which happens with screen recordings more often than people expect.

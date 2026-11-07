---
updated: "2026-11-07"
title: Why won't my iPhone video play on Windows or upload anywhere?
description: iPhones record MOV files, usually in HEVC, which plenty of players and sites refuse. Converting to MP4 with H.264 makes it play nearly everywhere.
keywords: [mov to mp4, convert mov to mp4, iphone video to mp4, mov file won't play, hevc to mp4]
---

Because an iPhone saves video as a MOV file, and usually compresses the
picture with HEVC, also called H.265. Windows without the right add-on, older
Android phones, many web upload forms and plenty of video editors can't play
HEVC, or won't accept a MOV at all. Converting it to an MP4 with H.264 video
and AAC sound gives you the combination that plays on almost anything made
in the last fifteen years.

## MOV and MP4 are boxes, not the video itself

A video file is a container holding a picture track and a sound track, each
compressed with its own codec. MOV is Apple's container. MP4 is the standard
one, and it's closely related: the MP4 format was based on MOV in the first
place.

The container is rarely the real problem. The codec inside is. A MOV holding
H.264 video plays almost everywhere already. A MOV holding HEVC is the one
that causes trouble, and renaming the file to .mp4 doesn't help, because the
HEVC is still inside.

So this tool re-encodes. The picture is decoded and compressed again as
H.264, and the sound as AAC at 128 kbps, then the two are packed into an MP4.

## The quality slider

The slider runs from High through Balanced to Small, and starts at Balanced.

- **High** keeps the picture closest to the original and makes the biggest
  file. Use it for video you're going to edit, or footage with lots of fine
  detail like foliage, water or crowds.
- **Balanced** looks the same as the original to most people on a phone or a
  laptop, at a much smaller size than High. It's the right choice for sending
  and uploading.
- **Small** saves the most space and starts to show blockiness in dark scenes
  and fast movement.

Re-encoding always loses a little, even on High, because the video was already
compressed once by the phone. Each round of compression throws away some
detail. Convert from the original file each time rather than converting a
converted copy.

## Why the MP4 might be bigger

HEVC is roughly twice as efficient as H.264. At the same visible quality, an
H.264 file is usually larger than the HEVC original, sometimes nearly twice
the size. That's the price of compatibility.

If the result is too large to send, move the slider towards Small, or use the
[video compressor](/video-compressor), which can also reduce the resolution.
A 4K clip shrunk to 1080p loses very little on a phone screen and drops most
of its size.

## How long it takes

The conversion runs in your browser, on one processor core, so it's slower
than desktop software would be. A short clip takes moments. A few minutes of
4K footage can take a good while, and a phone is slower than a laptop. Leave
the tab open and in front while it works: browsers slow down pages in
background tabs.

The first conversion also downloads the converter itself, about 30MB, which
your browser keeps for next time.

## Very large files

The whole video is held in your browser's memory while it's converted, and
browsers cap how much memory one page may use. Clips of a few hundred
megabytes are fine. Files over a gigabyte or so may fail, more often on phones
and tablets. If one does, a desktop converter such as HandBrake, which is
free, has no such limit.

## HDR videos can look flat

Recent iPhones record in HDR by default, which stores a wider range of
brightness than most screens show. When HDR video is converted to ordinary
H.264, the extra range isn't carried over in a way every player understands,
and the result can look a little washed out or grey compared with the
original on the phone.

If that matters, you can stop the phone recording HDR in the first place:
on an iPhone, open Settings, then Camera, then Record Video, and turn off HDR
Video.

## Avoiding the conversion next time

Under Settings, then Camera, then Formats, choosing **Most Compatible** makes
the iPhone record H.264 instead of HEVC. The files are larger, but they play
everywhere straight away. **High Efficiency** is the default and gives smaller
files that need converting more often.

Separately, when you send a video from an iPhone by AirDrop, email or a
messaging app, iOS often converts it to a compatible format on the way out.
Copying the file straight off the phone with a cable is when you're most
likely to get the original HEVC MOV.

## Where the work happens

The video isn't uploaded. It's converted on your own device and saved as a new
file, and the original isn't changed.

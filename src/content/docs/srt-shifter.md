---
updated: "2026-08-22"
title: Why do my subtitles drift out of sync?
description: A constant offset is one fix and a growing gap is another. Shifting handles the first, frame rate handles the second, and telling them apart takes ten seconds.
keywords: [srt shifter, subtitles out of sync, subtitle delay, srt to vtt]
---

Two completely different faults, and the fix for one does nothing for the
other. Telling them apart takes ten seconds and saves a lot of fiddling.

**Check the start of the film, then check the end.** If the subtitles are out
by the same amount in both places, it's an offset and shifting fixes it. If
they're fine at the start and further out by the end, it's a frame rate
mismatch and no amount of shifting will help.

## The constant offset

The subtitles were timed against a copy of the film that starts at a slightly
different point, usually because of a distributor logo, a studio card, or a few
seconds of black at the head.

Measure it once. Find a clear line of dialogue, note the time it's spoken and
the time the subtitle appears, and shift by the difference. Negative moves them
earlier.

One measurement is enough, because the error is the same throughout.

## The growing gap

This is a frame rate problem, and it's the one people waste an evening on.

Film is shot at 24 frames a second. Television in much of Europe runs at 25.
Converting between them by simply playing the film faster, which is what
happened for decades, makes it run about 4 percent short. Subtitles timed
against one version drift steadily against the other.

Four percent doesn't sound like much. Over a two hour film it's nearly five
minutes by the end, which is why subtitles that start perfectly can finish in
the wrong scene entirely.

Stretching or compressing the whole file by the ratio is the fix, and the
common pairs are here: 23.976 to 25, 25 to 23.976, 24 to 25, 25 to 24.

If neither direction quite works, the file may need both a rate change and a
small shift afterwards, in that order.

## SRT and VTT

The same file with three differences, and getting them wrong is why a subtitle
file sometimes loads with no subtitles in it.

**The separator.** SRT puts a comma between seconds and milliseconds. VTT uses
a full stop.

**The header.** VTT needs `WEBVTT` on the first line. SRT has no header.

**The numbering.** SRT numbers each cue. VTT allows it and doesn't require it.

Browsers play VTT and won't touch SRT, which is why a subtitle file that works
in VLC does nothing on a web page. Most desktop players read both.

## Encoding

Subtitles with accented characters that come out as `Ã©` or as question marks
are an encoding mismatch: the file is UTF-8 and something read it as Latin-1,
or the reverse.

Save as UTF-8 without a byte order mark. That's what browsers expect and what
most players handle correctly. A byte order mark at the start of an SRT makes
some players skip the first subtitle entirely.

## What shifting past the start does

A large negative shift pushes early subtitles before the beginning of the film.
Those can't be shown, so they're dropped rather than clamped to zero, and the
count tells you how many survived.

Clamping them all to zero would leave a stack of subtitles with no duration,
sitting in the file and never appearing, which looks like the tool failed
rather than like a choice.

## Checking your work

Look at the first subtitle and the last one, and spot-check something in the
middle. Those three points catch every offset and every drift.

Everything happens in your browser. Subtitle files are text, so this needs no
video and nothing is uploaded.

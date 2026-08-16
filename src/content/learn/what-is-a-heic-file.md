---
# ── LOCKED. Do not invent or change these. ────────────────────────────────
slug: what-is-a-heic-file
tool: heic-to-jpg
updated: 2026-08-15

# ── EDITABLE. This is your job. ───────────────────────────────────────────
title: What is a HEIC file, and why will it not open?
description: HEIC is the format iPhones save photos in. Windows and older software often cannot read it. Here is why, and the three ways to fix it.
keywords: [heic, heic file, what is heic, heic vs jpg, open heic on windows]
---

A HEIC file is a photo. Your iPhone made it. It will not open on your Windows
laptop because Windows does not ship with the code to read it, and Apple does.

That is the whole problem. Nothing is corrupted and nothing went wrong with the
transfer.

## Where HEIC came from

Apple switched the iPhone camera to HEIC in 2017, with iOS 11. Before that,
phones saved JPG, which every piece of software on earth can read.

The switch was not arbitrary. HEIC files are roughly **half the size of a JPG**
at the same visible quality, because the compression is far newer. JPEG was
standardised in 1992. HEIC is built on HEVC, a video codec from 2013, and two
decades of research sit between them.

It also stores things JPG cannot: 16 bits of colour per channel instead of 8,
transparency, depth information for portrait mode, and several images in one
file, which is how Live Photos work.

For a phone with finite storage, halving the size of every photo is worth a lot.

## So why will nothing open it

Two reasons, and only one of them is technical.

**The technical one.** HEVC is patented. Reading HEIC properly means licensing
the patents, and Microsoft chose not to bundle that cost into Windows for every
user. So Windows 10 and 11 can show you a thumbnail but often cannot open the
file, and for years the codec was a paid extension in the Microsoft Store.

**The practical one.** Software follows demand slowly. Plenty of websites,
printing services, older versions of Photoshop and most corporate document
systems only ever learned to accept JPG and PNG. They are not broken. Nobody
asked them to change.

The result is a format that is better in every measurable way and cannot be
opened by the person you just emailed it to.

## Three ways to fix it

### Convert the photos you already have

This is what most people need, because the photos are already taken.
[Convert them here](/heic-to-jpg). Drop in as many as you like, get JPG or WebP
back, and download the set as a zip.

Pick **JPG** if anything at all needs to open it: old software, a printing
service, a form upload. Pick **WebP** if the photos are going on a website,
since the files are meaningfully smaller at the same quality and every current
browser reads them.

### Stop your iPhone making them

If it keeps happening, change the camera itself:

**Settings → Camera → Formats → Most Compatible**

New photos will be JPG from then on. Two things to know. It uses noticeably more
storage, and it does nothing to the thousands of photos already on the phone.

### Install the codec on Windows

Windows can be taught to read HEIC by installing the HEIF Image Extensions from
the Microsoft Store. This fixes opening and previewing on that one machine, and
fixes nothing for anyone you send a file to. Worth doing if the photos are for
you. Not worth doing if you are sending them on.

## Does converting lose quality?

Slightly, and less than people fear.

HEIC and JPG are both lossy, so converting means the image is compressed a
second time. At a high quality setting the difference is invisible on a
photograph. What you actually lose is the extra information HEIC was carrying:
depth data, the second frame of a Live Photo, and colour precision beyond 8 bits
per channel. If any of that matters, keep the original alongside the JPG.

Converting back and forth repeatedly is the thing to avoid. Each round throws
away a little more, and it never comes back.

## What about HEIF, HIF and AVIF

**HEIF** is the container format. **HEIC** is HEIF with HEVC compression inside
it, which is what Apple uses. In everyday use the two words get swapped freely
and it rarely matters.

**HIF** is the same thing again, used by some Canon and Sony cameras.

**AVIF** is the newer relative, built on the AV1 video codec. It compresses
about as well and, unlike HEIC, is royalty free, which is why browsers adopted
it quickly. If you are choosing a format for the web today, AVIF or WebP are the
sensible answers. HEIC is not.

## The short version

Your photos are fine. The format is genuinely better than JPG and genuinely
inconvenient, because the patents made everyone else slow to support it. Convert
what you need to send, and switch the camera to Most Compatible if you are tired
of dealing with it.

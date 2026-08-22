---
updated: "2026-08-22"
title: What size should a placeholder image be?
description: Whatever the real picture will be. The sizes worth knowing for social, ads and layouts, and why a hotlinked placeholder service is a bad dependency.
keywords: [placeholder image generator, dummy image, image size for layout, placeholder png]
---

The same size as the picture that will replace it. That's the entire point: a
placeholder at the wrong dimensions tests a layout that will never exist, and
the real image arrives and everything moves.

The sizes people are actually asked for:

| Use | Size |
|---|---|
| Link preview when a page is shared | 1200 × 630 |
| YouTube thumbnail | 1280 × 720 |
| Instagram feed post | 1080 × 1080 |
| Story, reel or short | 1080 × 1920 |
| Full HD hero or slide | 1920 × 1080 |
| Card or grid thumbnail | 600 × 400 |
| Avatar | 400 × 400 |
| Medium rectangle ad | 300 × 250 |
| Leaderboard banner | 728 × 90 |
| X profile header | 1500 × 500 |

## Why not use a placeholder service

The usual approach is an image URL from a third-party service, dropped straight
into the markup. It's quick and it has two problems.

**It's a live dependency in a mockup.** The mockup outlives the service.
Several popular placeholder services have gone away or started rate limiting,
and every design that hotlinked them broke at once, often years later when
nobody remembered why the images were there.

**It leaks.** Every render fetches from someone else's server, which means your
page's visitors, or your client's, are making requests to a third party you
have no agreement with.

A file downloaded once has neither problem. It sits in the project with
everything else.

## The diagonal lines

They look decorative and they aren't. They make it immediately obvious when a
layout has stretched an image out of proportion, because straight diagonals
become visibly skewed. A flat grey rectangle hides that completely, and
squashed images then ship.

Same reason the dimensions are written on the image: when six placeholders are
on a page, the one that's wrong is the one whose label doesn't match what you
asked for.

## Which format

**PNG** for anything going into a design tool or a document. Lossless, sharp
edges on the text.

**JPG** if you're testing how a page behaves with realistically sized
photographs, since a JPG placeholder is closer in weight to the real thing.

**WebP** if you're testing modern delivery.

For layout work the format rarely matters. For performance testing it does,
because a 40KB PNG placeholder tells you nothing about a page that will
eventually carry 400KB photographs.

## Testing a layout properly

Use the real proportions, not the real content. A grid of identical grey boxes
looks tidy in a way the finished page never will.

Vary them. Real galleries have portrait and landscape mixed, and a layout that
only handles one is a layout that breaks on launch.

Include an extreme. A very wide banner or a very tall vertical will find the
places where nothing constrains the size.

Check the empty case too, because some images never arrive.

## Colours

Five palettes here, and the choice matters less than the contrast. A
placeholder should be obviously a placeholder: if it's subtle enough to look
like part of the design, it will ship in the design.

Grey is the conventional choice and the safest.

Everything is drawn in your browser and downloaded directly. There's no service
to call, no link to rot, and nothing is uploaded.

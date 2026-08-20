---
updated: "2026-08-19"

title: What is an SVG, and why does it go blurry when you export it?
description: An SVG has no resolution until you give it one. Pick the wrong number on export and it turns soft. Here is how to choose.
keywords: [svg, svg to png, vector, export svg, svg blurry]
---

An SVG is a set of instructions, not a picture. It says "a circle here, this
wide, filled with this colour", and the browser draws it fresh at whatever size
it is asked for. That is why it stays sharp at any scale.

A PNG is a grid of pixels. Once you convert, that flexibility is gone and the
size you chose is the size you have. Choose too small and it looks soft the
moment anything enlarges it.

## Why there is no such thing as an SVG's resolution

People often ask what resolution their SVG is. It does not have one. It has a
coordinate space, usually declared as a `viewBox`, and that space can be painted
at 16 pixels or 16,000 with identical crispness.

So exporting is not a conversion in the usual sense. You are choosing a
resolution for something that never had one, and that choice is permanent.

## Picking the number

Work out the size it will actually be displayed at, then **double it**. Most
phones and many laptops have high density screens that pack two or more physical
pixels into each CSS pixel, and an image exported at the nominal size looks
noticeably soft on them.

A logo shown at 200 pixels wide on a website wants a 400 pixel export. A hero
image spanning a 1200 pixel container wants 2400.

For print, forget screen pixels entirely and work from physical size at 300 DPI.
A 3 inch wide logo needs 900 pixels across. Anything less and it prints fuzzy
regardless of how good it looked on your monitor.

Going far beyond what you need is not free either. An 8K export of an icon is a
large file that will be scaled back down anyway, and browsers do that scaling
with less care than the exporter would have.

## Keep the transparency

SVGs frequently have no background, and that is often the point. Export to PNG
and the transparency survives.

Export to JPG and it does not. JPG has no alpha channel at all, so the
transparent area gets filled, usually with white or black. This catches people
out with logos: it looks fine on a white page and then reveals a white rectangle
the moment it lands on a coloured background.

If the background must stay clear, the answer is PNG or WebP. There is no JPG
setting that fixes it.

## Fonts are the usual failure

This is the most common reason an export looks wrong, and it is worth knowing
before it happens rather than after.

An SVG that uses text refers to a font by name. It does not contain the font. If
whatever is rendering the file does not have that font installed, it silently
falls back to something else, and your careful spacing turns into a different
typeface at a different width.

Two fixes. Either convert the text to outlines in your design tool before
exporting, which turns the letters into shapes and removes the dependency
entirely, or embed the font in the SVG. Outlines are simpler and almost always
what you want for a logo, since the text is not going to change.

The tradeoff: outlined text is no longer text. It cannot be selected, searched or
read by a screen reader, and it cannot be edited without going back to the
original.

## What does not survive

A few things in an SVG are instructions the renderer may not follow the same way:

- **External images** referenced by URL rather than embedded. If the link is
  unreachable at export time, that part comes out blank.
- **Scripts and animation.** An SVG can contain both. A PNG is a still frame, so
  you get whatever the first frame looks like.
- **Filters and blend modes** render slightly differently between tools. Usually
  close, occasionally not.

## When not to convert at all

If the destination is a website and the graphic is a logo, icon or diagram, use
the SVG directly. It will be smaller than the PNG, sharp on every screen, and can
be recoloured with CSS.

Convert when something on the other end cannot read SVG: an email client, an
older design tool, a print workflow, a platform that only accepts raster uploads.
That is the actual reason to do this, rather than a default step.

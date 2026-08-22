---
updated: "2026-08-22"
title: How do you open a PowerPoint without PowerPoint?
description: The deck is converted to a PDF and shown slide by slide. What survives, what doesn't, and why this tool sends your file to a server when the rest don't.
keywords: [pptx viewer, open powerpoint online, view pptx without powerpoint, ppt viewer]
---

Drop the file in and step through it, one slide at a time. Fonts, layout,
images and charts come across as they were laid out, and you can download the
PDF if you want to keep or forward it.

You can read it. You can't edit it, and that's deliberate: an editor that half
works on someone's deck is worse than an honest viewer.

## This one uploads your file

Every other tool on this site works in your browser. This one can't.

Nothing in a browser reads the PowerPoint format properly. It's large, old and
full of features, and the only software that handles it faithfully is a full
office suite. So the deck goes to a server running LibreOffice, is converted to
a PDF, and comes back. It's converted and discarded, not stored.

That's a real difference and it's said here rather than buried. If a deck is
commercially sensitive, opening it locally is the better route, and both
PowerPoint Online and Google Slides are free.

## What doesn't survive

**Animations and transitions.** A PDF has no motion. Anything built to appear
on click is flattened, which usually means everything on the slide is visible
at once.

That matters for a specific kind of deck: builds where points appear one at a
time end up showing all the points together, and a slide designed as a reveal
loses its point entirely.

**Speaker notes.** Not included in the converted pages.

**Embedded video and audio.** These become a still image of the frame.

**Slide numbers and dates** appear only if the deck was set to show them.

**Macros** don't run, which is a feature. A deck arriving by email with macros
in it is an old trick, and viewing it this way can't execute anything.

## Why the layout sometimes shifts

Fonts, almost always. If the deck uses a typeface the converter doesn't have,
the nearest available one is substituted, and if that substitute is even
slightly wider, text reflows and can overflow its box.

The converter carries metric-compatible replacements for the common Microsoft
fonts, so Arial, Times New Roman, Courier New and Calibri hold their spacing
exactly. Broad coverage for non-Latin scripts is there too.

What shifts is anything unusual: a brand typeface, something bought from a
foundry, or a face that arrived with another application. Text boxes filled to
the edge are the first thing to break, because they have no room to absorb a
change.

If layout matters, embed the fonts in PowerPoint before converting, under File,
Options, Save.

## The formats it takes

`.pptx` and the older `.ppt`, plus `.odp` from LibreOffice and OpenOffice.

The old `.ppt` converts well but is less predictable, being a binary format
from the nineties with a lot of undocumented behaviour.

## When something else is better

**To present**, use presentation software. A PDF has no presenter view, no
notes and no timing.

**To edit**, use a real editor.

**To send someone a deck they only need to read**, [converting it
yourself](/pptx-to-pdf) is often the kinder option. A PDF opens everywhere and
looks the same for everyone, which a .pptx does not.

## Files that won't open

**Password protected decks** can't be converted, because the converter can't
open them either. Remove the password first.

**Very large decks** take a while. A hundred slides with images can take a
minute, and the first request after a quiet period is slower because the
container has to start.

---
updated: "2026-08-21"
title: Why won't my printed QR code scan?
description: Printed too small, blown up from a small PNG, or too little contrast. What each setting does and which file to take for print.
keywords: [qr code generator, qr code not scanning, qr code for wifi, print qr code]
---

Usually one of three things. It's printed too small for the distance people
stand at, it was enlarged from a small PNG so the edges have gone soft, or
there isn't enough contrast between the code and what's behind it.

All three are fixable before you print. None are fixable afterwards, which is
why it's worth a minute now.

## Take the SVG for anything printed

An SVG has no resolution. It's a set of shapes, so it's exactly as sharp on a
business card as on the side of a van.

A PNG has a fixed number of pixels. Take a 300 pixel PNG, blow it up to fill an
A4 poster, and every square in the code becomes a soft grey smudge. Scanners
work by finding hard edges between light and dark, so soft edges are exactly
what stops them.

Use PNG for a screen, a slide, or an email. Use SVG for anything that goes near
a printer.

## How big to print it

The working rule is that a code needs to be about a tenth of the distance
people will scan it from. A code read at arm's length, roughly 30cm, wants to be
around 3cm across. One on a poster people stand two metres from wants 20cm.

Then add the quiet border. That's the empty margin around the code, and it
isn't decoration: the scanner uses it to find where the code starts. The
standard asks for four modules of clear space, and the default here is a
sensible amount of it. Codes that fail on busy packaging usually fail because
somebody trimmed that margin to fit.

## Error correction

Four levels, L through H. Higher levels add redundancy, so the code survives
being scuffed, folded or partly covered. They also make it denser, which means
it needs to be printed larger to stay readable.

- **L** recovers from about 7 percent damage. Fine on a screen.
- **M** about 15 percent. The default, and right for most printing.
- **Q** about 25 percent.
- **H** about 30 percent. Use it on anything handled, laminated, or stuck to a
  surface that gets wiped.

H is also what lets people drop a logo in the middle. The code survives because
the redundancy covers the hole. If you're doing that, keep the logo under about
a fifth of the width and test it on more than one phone.

## Contrast, and the dark and light the wrong way round

Scanners expect the code dark and the background light. Inverting it, light
code on a dark background, fails on a lot of readers even though some cope.

Colours other than black are fine as long as they're genuinely dark. The
practical test is to photograph it and convert to greyscale: if the code and
the background look similar in grey, it won't scan. Yellow on white fails.
Mid-grey on light grey fails. Dark green on cream is fine.

Avoid printing over a photograph. Even a busy pattern behind a code is enough
to lose it.

## The wifi code

A wifi QR code isn't a link. It's a specific string holding the network name,
the security type and the password, and phones know how to read it.

The part that goes wrong is punctuation. Semicolons and commas separate the
fields inside that string, so a password containing one has to be escaped or
the phone reads the password as ending early. This tool escapes them for you.
If you're building the string by hand somewhere else, that's the thing to check.

Hidden networks need the hidden flag set, or the phone looks for a network it
can't see and gives up.

One warning worth saying plainly: a wifi QR code contains your password in
plain text. Anyone who photographs the sign has it. That's fine for a café and
not fine for the network your accounts are on. Put guests on a guest network.

## Test before you print a thousand

Print one. Scan it with an old phone, not your newest one, and in the light the
real thing will live under. Codes that work on a desk under a lamp fail on a
wall in a dim restaurant.

Scan it with the camera app rather than a dedicated scanner app, because that's
what people actually use.

And point the code at something you control. A shortened link through a service
that might disappear turns your printed sign into litter the day that service
shuts down.

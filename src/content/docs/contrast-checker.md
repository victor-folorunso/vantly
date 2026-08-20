---
updated: "2026-08-19"

title: What does a contrast ratio actually mean?
description: It compares how much light two colours reflect, not how different they look. Two vivid colours can be equally bright and fail badly.
keywords: [contrast ratio, wcag, accessibility, colour contrast, aa aaa]
---

A contrast ratio compares how much light two colours emit, nothing else. It runs
from 1:1, identical, to 21:1, black on white.

Which means it has almost nothing to do with how *different* two colours look. A
vivid red on a vivid green is unmistakably two colours and fails badly, because
both sit at a similar brightness. Contrast is about light, not hue.

## The numbers you need

**4.5:1** for body text. This is WCAG AA, the level referenced by most
accessibility law, including the European Accessibility Act and the ADA in
practice.

**3:1** for large text, meaning 18pt and up, or 14pt bold. Bigger letters have
more pixels carrying the shape, so they survive lower contrast.

**3:1** for interface components and meaningful graphics: input borders, icons
that carry information, the focus ring. This one gets missed constantly, since
people check their text and stop.

**7:1** is AAA. Worth aiming at for long reading, and rarely required.

Nothing applies to disabled controls or purely decorative graphics.

## How it is calculated

Each colour is converted to relative luminance, a weighted measure of how much
light it produces. Green is weighted heaviest because the eye is most sensitive
to it, then red, then blue by a long way.

The ratio is then `(lighter + 0.05) / (darker + 0.05)`. The 0.05 accounts for
ambient light reflecting off the screen, which is why the scale tops out at 21
rather than infinity.

The practical consequence: **pure blue text is far worse than it looks.** Blue
contributes very little luminance, so `#0000FF` on white is only about 8.6:1
despite looking strongly coloured, and any lighter blue drops below AA quickly.

## Who it is for

Not only people with severe visual impairment, though it matters most to them.

Around one in twelve men has some form of colour vision deficiency. Everyone's
contrast sensitivity declines with age. And the largest group by far is anyone
reading on a phone in daylight, on a dim screen, or on a cheap monitor with the
brightness turned down. Contrast failures affect all of them.

This is the most common accessibility problem on the web by a wide margin, and
also the cheapest to fix, because it is a colour value rather than a rebuild.

## What the number does not catch

**Text on an image.** The ratio depends on which part of the photo sits behind
which word, and it changes as the image is cropped at different screen sizes. A
scrim or a solid panel behind the text is the only reliable fix.

**Placeholder text.** Usually the worst contrast on any form, and it is real text
carrying real instructions.

**Colour as the only signal.** A red border on an invalid field passes contrast
and still tells a colour blind user nothing. Errors need an icon or words, not
just a hue.

**Thin fonts.** A 300 weight at 4.5:1 is harder to read than a 400 weight at the
same ratio. The standard measures colour, not stroke width, so passing is a floor
rather than a guarantee.

**Hover and focus states.** People check the resting state and forget the rest.
The focus ring in particular needs 3:1 against what is behind it, or keyboard
users cannot see where they are.

## Fixing a failure

Adjust lightness, not hue. Your brand colour can usually stay recognisable while
getting darker or lighter, and that is the axis the ratio actually responds to.

Two practical habits. Keep one darker variant of the brand colour specifically
for text on light backgrounds, since the colour that works in a logo rarely works
in a paragraph. And check both themes: a palette that passes in light mode
routinely fails in dark, because the relationship between the colours has
inverted.

---
updated: "2026-08-22"
title: Why does a new 1TB drive show up as 931GB?
description: Nothing is missing. Manufacturers count a gigabyte as 1000 megabytes and operating systems mostly count 1024, so the same drive gets two honest numbers.
keywords: [unit converter, 1tb shows as 931gb, gb vs gib, convert units]
---

Nothing has been taken. The drive holds exactly what it says. The disagreement
is over what a gigabyte means.

Drive manufacturers use powers of ten, so a gigabyte is 1,000,000,000 bytes.
Most operating systems use powers of two, where a gigabyte works out as
1,073,741,824 bytes. Divide one by the other and you lose about 7.4%, which is
where 1TB becomes 931GB.

Both are correct. They're just different definitions, and the gap widens as
the numbers get bigger: about 2.4% at kilobytes, 4.9% at megabytes, 7.4% at
gigabytes, and roughly 10% at terabytes.

## The names that were supposed to fix it

There's a standard for this. Powers of two are meant to be called kibibytes,
mebibytes and gibibytes, written KiB, MiB and GiB, leaving kilobyte and
megabyte to mean the powers of ten they mean everywhere else in science.

Nobody adopted it consistently. Linux and macOS mostly report in powers of ten
now. Windows still reports powers of two while calling them GB. So the same
drive plugged into two machines shows two different numbers, both labelled the
same way.

Both meanings are listed here for that reason. Picking one and hiding the
other would just move the confusion.

## Where else this bites

**Network speeds are bits, not bytes.** A 100 Mbps connection carries 100
megabits a second, which is about 12.5 megabytes. That factor of eight is why
a fast connection seems to download slower than expected. The lowercase b is
bits and the uppercase B is bytes, which is a lot of weight for one letter to
carry.

**RAM is genuinely powers of two.** Memory is addressed in binary, so a 16GB
stick really is 16 gibibytes. Storage isn't built that way, which is why the
two are counted differently even inside the same machine.

**Video and photo sizes** are usually quoted in powers of ten by cameras and
powers of two by the computer you copy them onto.

## The other conversions worth a word

**Temperature is not a ratio.** Twice 10°C is not 20°C in any meaningful
sense, because zero on that scale is an arbitrary point rather than an absence
of heat. Converting a temperature works; scaling one doesn't.

**Fluid ounces differ by country.** A US fluid ounce is about 29.57ml and an
imperial one is about 28.41ml. That's a 4% difference, which matters in a
recipe and matters more in a cocktail. US and imperial pints and gallons
differ by considerably more: an imperial pint is 568ml against the US 473ml.

**Tons come in three sizes.** A metric tonne is 1000kg, a US short ton is
about 907kg, and an imperial long ton is about 1016kg. Shipping quotes that
don't say which one are a recurring source of argument.

**Miles and nautical miles** are different by about 15%. A nautical mile is
one minute of latitude, which is why it exists and why aviation and shipping
use it.

## Rounding

Results are rounded for reading rather than truncated, so a converted value
may not round-trip to exactly the number you started with. That's normal and
it's the right trade for a display: showing 0.9999999999 instead of 1 helps
nobody.

If you need the exact figure for something that has to reconcile, like an
invoice, do the arithmetic at full precision and round once at the end. Round
at every step and the errors accumulate.

## Nothing is sent anywhere

The conversion happens as you type, in your browser. There's no request and
nothing recorded, which is worth knowing given how often the number being
converted is a salary, a dose or a measurement from work.

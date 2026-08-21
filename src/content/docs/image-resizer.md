---
updated: "2026-08-21"
title: What size should I resize an image to?
description: Match the space it will sit in, then double it for high density screens. Why enlarging never works, and what the aspect ratio is doing.
keywords: [image resizer, resize image online, image dimensions for web, resize photo]
---

Whatever size it'll actually be displayed at, then double it. A picture sitting
in a 600 pixel wide column should be about 1200 pixels wide, because most
phones and a lot of laptops pack two physical pixels into every one the layout
counts.

Anything beyond double is waste. A 4000 pixel photograph in a 600 pixel column
downloads four megabytes to show something the visitor sees at a fraction of
that.

## Common sizes worth knowing

- **Full width banner:** 1920 wide is plenty. Beyond that you're serving pixels
  almost nobody has the screen to see.
- **Article image:** 1200 to 1600 wide.
- **Thumbnail in a grid:** 600 to 800 wide.
- **Profile picture:** 400 square is comfortable everywhere.
- **Email:** 600 wide, and no wider. Mail clients are narrower than you think
  and several won't scale images down.

If you're supplying an image to somebody else's platform, use their stated size
rather than guessing. [Placeholder images at the standard
sizes](/placeholder-image-generator) are handy for checking a layout before the
real picture exists.

## Enlarging doesn't work

Making an image bigger cannot add detail that was never captured. The tool has
to invent the new pixels by guessing from their neighbours, and guessing
produces softness. A 400 pixel image stretched to 1200 looks like a 400 pixel
image that somebody stretched.

This resizer won't enlarge for that reason. If you need a bigger version, go
back to the original photograph. There's almost always a larger one on the
camera or the phone that took it.

The exception is vector art. An SVG has no fixed size, so [rendering it at
whatever size you need](/svg-to-png) is genuinely lossless.

## Aspect ratio

Setting the longest edge keeps the shape of the picture. A 4000 by 3000 photo
resized to 1200 becomes 1200 by 900, because both sides are scaled by the same
amount.

That's what you want almost always. Forcing an image into a different shape
stretches faces and makes straight lines lean, and everybody can see it even if
they can't say why.

If you need a specific shape, crop rather than stretch. Crop throws away part of
the picture and keeps the rest correct. Stretching keeps everything and makes
all of it wrong.

## Resizing and file size

Halving both dimensions gives you roughly a quarter of the pixels, and usually
something near a quarter of the file. That's a much bigger saving than
compression alone, which is why resizing first and [compressing
after](/image-compressor) beats compressing a huge image hard.

The order matters. Compress a 4000 pixel image to 80 percent quality and you've
made a large file slightly smaller. Resize it to 1200 first and the same
compression produces something a tenth of the size that looks identical on the
page.

## What happens to the extra information

Resizing rewrites the picture, so anything attached to the original file is not
carried across. Camera settings, the lens used, the date, and the GPS
coordinates if the camera recorded them.

That last one is worth a thought. Photographs from a phone often carry the exact
location they were taken, and it travels with the file when you send it. Losing
it in a resize is usually a small privacy win rather than a loss.

Rotation is the one piece worth keeping, and it's handled: a photograph taken
sideways carries a flag saying which way up it goes, and the resized copy is
written the right way up rather than relying on the flag.

## Which format to save as

Keep photographs as JPEG or convert them to [WebP](/jpg-to-webp), which is
smaller at the same quality.

Keep screenshots, logos and anything with text as PNG or WebP lossless. JPEG
puts a faint halo around hard edges, and text is nothing but hard edges.

If the image needs transparency, PNG and WebP have it and JPEG does not. A JPEG
with a transparent background comes out with a white one, or occasionally a
black one, which is the single most common surprise in this whole area.

## Doing a lot at once

Every file is handled by your own machine, so there's no upload wait and no cap
on how many you can do. A few hundred photographs is fine. The limit is memory,
and if a very large batch stalls, doing it in two goes will get through.

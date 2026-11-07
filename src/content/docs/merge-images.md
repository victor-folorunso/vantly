---
updated: "2026-11-07"
title: How do I put two pictures side by side, or one above the other?
description: Drop them in, choose down or across, and download one PNG. Why pictures get resized to match, why the file can be large, and how to keep it sharp.
keywords: [merge images, combine images, put pictures side by side, join photos, stitch images together]
---

Add the pictures, choose down to stack them or across to line them up, and
download the result as one PNG. Use the arrows next to each name to change the
order, and the gap slider if you want space between them.

That covers most uses: a before and after, a set of screenshots for a bug
report, two halves of a long receipt. The rest of this page is about the
things that catch people out.

## Why the pictures change size

Pictures rarely share the same dimensions, and a straight join between a
narrow one and a wide one would leave an awkward step down the side. So the
edges that touch are made to match.

- **Down**: every picture is scaled to the width of the widest one.
- **Across**: every picture is scaled to the height of the tallest one.

The shape of each picture is kept. Nothing is stretched or cropped, only made
larger or smaller as a whole.

The catch is that small pictures get scaled up. A 600 pixel wide screenshot
stacked under a 4000 pixel wide photo is enlarged nearly seven times, and it
comes out soft. Enlarging can't add detail that wasn't there.

If one picture looks blurry in the result, [resize the big
one](/image-resizer) down first, close to the size of the smallest, then merge.
The result is smaller and everything in it is equally sharp.

## Why the file can be big

The result is always a PNG. PNG keeps every pixel exactly, which is right for
screenshots, diagrams and anything with text in it. It's a poor fit for
photographs: two phone photos merged into one PNG can easily come out at 20MB
or more, far larger than the two originals together.

If the merged picture is photographs and it's going on the web or into a
message, run it through the [image compressor](/image-compressor) afterwards
and save it as JPG or WebP. The file shrinks by most of its size and looks the
same.

## Gaps and the background colour

The gap goes between pictures, not around the outside. With a gap of zero the
pictures touch.

When there is a gap, it's filled with the background colour you choose, white
unless you change it. Black or a dark grey usually looks better between
photographs, and white or a light grey between screenshots, so the gap reads as
a border rather than as part of either picture.

Transparent areas in a picture also show the background colour, because the
merged picture is drawn on a solid background.

## Getting the order right

Pictures go in the order you add them. Selecting several at once from a
folder doesn't always keep the order the folder shows, so check the list
before you download. The first picture in the list is at the top when
stacking down, and at the left when lining up across.

## Very large merges

Everything happens in your browser, and browsers limit how big a single
picture they'll draw. Stacking a dozen full size phone photos makes a picture
tens of thousands of pixels tall, and on some browsers and phones that's more
than they'll handle. Safari on an iPhone gives up sooner than Chrome on a
laptop.

If a big merge fails or comes out blank, resize the pictures down first, or
split them into two smaller merges. For a long scrolling screenshot or a
receipt, a width of 1080 to 1500 pixels is plenty to read on any screen.

## What happens to the originals

Nothing. They aren't changed or uploaded. The merged picture is made on your
device and saved as a new file. It also doesn't carry over the photos'
metadata, so the camera details and any location stored in them don't come
along.

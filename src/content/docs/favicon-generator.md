---
updated: "2026-08-22"
title: Why won't my favicon update?
description: Browsers cache favicons harder than anything else on a site. Which sizes you actually need, and why the .ico file still matters in 2026.
keywords: [favicon generator, favicon not updating, favicon sizes, apple touch icon]
---

Because browsers cache favicons more aggressively than almost anything else,
and a hard refresh usually doesn't clear them. Chrome in particular will keep
showing an old icon for days.

To check whether the new one is actually live, open the icon's URL directly,
something like `yoursite.com/favicon.ico`. If the new icon appears there, the
site is serving it correctly and you're looking at a cache. If the old one
appears, the file hasn't deployed.

Opening the site in a private window is the quickest way to see what a new
visitor gets.

## The sizes that matter

**16 and 32 pixels** for browser tabs. 16 is what most tabs actually show.

**48 pixels** matters more than people realise: it's what Google's search
results use, and it's the size their guidance asks for.

**180 pixels** for the Apple touch icon, used when someone adds your site to an
iPhone home screen.

**192 and 512 pixels** for Android and progressive web apps, referenced from a
web manifest rather than a link tag.

Everything else is historical. The long lists of twenty favicon sizes date from
an era of many more device conventions, and most of those files are never
requested.

## Why the .ico still matters

An `.ico` file can hold several sizes in one file, and browsers pick the one
they need. It's an old Windows format and it hasn't gone away.

More importantly, **anything that can't find a declared icon falls back to
`/favicon.ico` at the root of the domain**. Search engine crawlers, link
preview generators, feed readers and older browsers all do this. Serving one
there costs nothing and quietly fixes a class of problems you'd otherwise never
see.

This site learned that the hard way: every icon on it was updated except the
`.ico`, and Google carried on showing the original logo in search results for
weeks, because that's the file it reads first.

## Design for 16 pixels, not for 512

The single most common mistake is taking a detailed logo and shrinking it. At
16 pixels you have 256 pixels in total, which is roughly enough for one letter
or one simple shape.

Wordmarks turn into grey smudges. Thin lines disappear. Gradients become flat
blocks.

If your logo is detailed, make a simplified mark for the favicon: one letter,
one symbol, strong contrast. Look at the 16 pixel version before deciding, not
the 512.

## Transparency and dark mode

A transparent background adapts to whatever the browser puts behind it, which
is usually right.

But browser tabs are dark in dark mode and light otherwise, so a dark icon on a
transparent background vanishes for half your visitors. Either use a colour
that works on both, or give the icon its own solid background so it's always
readable.

Testing in both themes takes ten seconds and catches this immediately.

## Where the files go

The `.ico` belongs at the root of the domain, not in a subfolder, because
that's where the fallback looks.

The rest can live anywhere as long as your head tags point at them. Paste the
generated tags into your `<head>` and the paths follow.

## When it still doesn't show

**Check the file actually deployed.** Open its URL directly.

**Check the path in the head tag.** A leading slash means the root of the
domain; without it, the path is relative to the current page, which breaks on
every page except the top level.

**Check the file isn't blocked.** A `robots.txt` disallowing a folder can stop
crawlers fetching an icon in it, which affects search results rather than
browsers.

**Wait.** Search engines refresh favicons on their own schedule, separate from
page indexing, and it can take weeks. There's no way to hurry it beyond
requesting reindexing.

Everything here is generated in your browser. The picture isn't uploaded.

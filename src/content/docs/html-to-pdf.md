---
updated: "2026-08-22"
title: Why does my web page look different as a PDF?
description: Because a page has no fixed width and a PDF does. What print stylesheets control, why a saved page loses its images, and when the browser's own export is better.
keywords: [html to pdf, web page to pdf, save webpage as pdf, print stylesheet]
---

Because a web page has no fixed size. It reflows to whatever window it's in,
and a PDF is a fixed rectangle, so the layout has to be resolved to one width
that was never designed for.

Anything sized in percentages, anything relying on the viewport, and anything
positioned relative to the window all land differently on a page than they do
on a screen.

## A saved page usually loses its pictures

The commonest disappointment. An HTML file saved from a browser is often just
the markup, and the images, stylesheets and fonts live in a separate folder
beside it or on the original server.

Converting the file on its own gives you the text with the layout mostly gone,
because none of the supporting files came with it.

Two ways round it. Save the page as a single file, which most browsers offer as
"Web Page, Complete" or a `.mhtml` option, so everything is embedded. Or use
the browser's own Print to PDF on the live page, where every resource is still
loading normally.

For a page that's still online, the browser's export is almost always the
better result. This tool is for HTML you already have as a file.

## Print stylesheets

Well built sites carry a separate set of rules for printing, and those decide
what happens here: navigation and adverts hidden, backgrounds dropped, link
addresses printed after the link text, page breaks kept out of the middle of a
heading.

Sites without them convert as they look on screen, which usually means a
navigation bar sitting at the top of the first page and a sidebar taking a
third of every page.

If you control the page, `@media print` is where the improvement lives, and it
costs very little to add.

## What doesn't survive

**Anything interactive.** Menus, accordions, tabs and anything that expands are
captured in whatever state they were in. Content hidden behind a click is
usually absent entirely.

**Anything a script builds after loading.** The conversion sees the markup, not
the result of the page running. Sites that assemble their content in the
browser can come out nearly empty.

**Video and audio** become a still or nothing.

**Fixed and sticky positioning** behaves oddly. An element pinned to the top of
the screen can repeat on every page or land in one strange place.

## Page breaks

Without instructions, breaks fall wherever the page runs out, which puts them
through headings, tables and images.

`break-inside: avoid` on a block keeps it together, and `break-before: page`
forces a new page. Both belong in the site's print styles.

If you don't control the page, there's no way to influence this from outside,
which is a real limitation rather than something to work around.

## What it's genuinely good for

Documentation and articles saved as complete pages. Invoices and receipts
generated as HTML. Reports produced by a system that only outputs a web page.
Anything simple, text-led, and built with printing in mind.

It's poor at: complex application interfaces, dashboards, anything
script-driven, and pages that were only ever meant to be scrolled.

## This one uploads your file

Nothing in a browser converts HTML to PDF faithfully, so the file goes to a
server running LibreOffice, is converted, and is discarded rather than stored.

Every other tool on this site works locally. For a page containing anything
private, the browser's own Print to PDF does the job without the file going
anywhere.

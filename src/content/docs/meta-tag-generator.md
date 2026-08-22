---
updated: "2026-08-22"
title: Why doesn't Google show the description I wrote?
description: Google rewrites descriptions about two thirds of the time, usually because the page has a better answer in it. What each tag does and which lengths matter.
keywords: [meta tag generator, meta description, open graph tags, google ignores description]
---

Because Google treats your description as a suggestion. It rewrites them
frequently, and it does so when it thinks something else on the page answers the
search better than the line you wrote.

That isn't a fault to fix. A rewritten description is usually more relevant to
that particular search than one line could be for every search. What you write
still matters: it's used often enough to be worth doing well, and it's used
almost verbatim when someone shares the link.

## The lengths that actually matter

**Title, 50 to 60 characters.** Google truncates by pixel width rather than
character count, so capitals and wide letters cost more. Put the important
words first, because the end is what gets cut.

**Description, 150 to 160 characters.** Same truncation behaviour. It has no
direct effect on ranking, and it has a real effect on whether anybody clicks.

**Open Graph title, up to about 60.** **Open Graph description, up to about
200**, and unlike the search description this one is shown as written.

## The tags worth having

**`<title>`** is the single most important one, for search and for the browser
tab.

**`<meta name="description">`** for the line under the title in results.

**`og:title`, `og:description`, `og:image`, `og:url`** for link previews.
Facebook, LinkedIn, WhatsApp, Slack, Discord and most others read these.

**`twitter:card`** set to `summary_large_image` if you want the big preview
rather than the small square one. X reads the Open Graph tags for everything
else, so you rarely need the rest of the twitter set.

**`canonical`** if the same content is reachable at more than one address.

Everything else in the long lists you'll find is either obsolete or ignored.
`meta keywords` has done nothing for over a decade.

## The preview image

**1200 by 630 pixels**, which is the size the [placeholder
generator](/placeholder-1200x630) produces if you need to test a layout.

Two things break previews more than anything else:

**A relative path.** `og:image` needs the full address including `https://`.
A relative one works on your own page and fails everywhere it matters.

**Aggressive caching.** Facebook, LinkedIn and X all cache the preview the
first time anyone shares a link, sometimes for weeks. Change the image
afterwards and the old one persists. Each platform has a debugging tool that
forces a refresh, and using it is the only reliable fix.

Test the preview before the link goes anywhere public. A wrong image on a post
that's already circulating can't be recalled.

## Why the preview looks different on each platform

Because each one crops differently. 1200 by 630 is close to 1.91:1, which most
platforms use, but WhatsApp often shows a square crop and some apps show a
narrow strip.

Keep anything essential, especially text, well inside the middle. A headline
running to the edges of the image will be cut on at least one platform.

## Writing a description worth clicking

Say what the page gives someone, not what it is. "Convert HEIC photos from an
iPhone so they open on Windows" beats "A tool for converting image files".

Front-load it. The last third may be cut, and it's read in a list of ten
similar-looking results.

Don't repeat the title. You have two lines of attention and spending both on
the same words wastes one.

Avoid making it a keyword list. It reads badly to a person, and the person is
the one deciding whether to click.

## Where these go

In the `<head>` of the page, before the content. Paste the generated block in
and adjust the paths.

If you're using a site builder or a CMS, it almost certainly has fields for the
title and description already, and those write these tags for you. Adding them
twice by hand creates duplicates, which is worse than not adding them.

Everything is generated in your browser and nothing is sent anywhere.

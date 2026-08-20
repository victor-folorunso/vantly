---
updated: "2026-08-19"

title: Why did my site disappear from Google overnight?
description: Usually one line. Disallow slash in robots.txt hides everything, and it normally arrives by being copied from a staging server.
keywords: [robots.txt, disallow, site not in google, noindex, deindexed]
---

Check `yoursite.com/robots.txt` first. If it contains this, that is your answer:

```
User-agent: *
Disallow: /
```

That asks every crawler to ignore the entire site. It is correct on a staging
server and catastrophic on a live one, and it usually arrives by being copied
from one to the other during a launch. Fix the file and the site returns over the
following days or weeks, not instantly.

If robots.txt looks fine, the next place to look is a `noindex` meta tag in the
page source, or an `X-Robots-Tag` header. Those are stronger than robots.txt and
much easier to miss, because nothing about the page looks wrong.

## What robots.txt actually does

It is a request, not a control. Well behaved crawlers read it and comply.
Everything else ignores it, and there is no mechanism to make them comply.

The file lives at the root of the domain, `example.com/robots.txt`, and nowhere
else. In a subfolder it does nothing at all. Subdomains need their own, since
`blog.example.com` and `example.com` are separate as far as this is concerned.

## Two things it is not

**It is not security.** The file is public, so listing a path in it tells
everyone that path exists. `Disallow: /admin-backup-2024/` is an advertisement.
Anything that must stay private needs authentication, not a polite note.

**It does not reliably remove a page from search.** This is the one that catches
people out. Blocking a URL stops it being *crawled*, and Google can still list a
URL it has never crawled if other sites link to it. You get a result with no
description, saying no information is available.

Worse, blocking the page means the crawler cannot see the `noindex` tag you put
on it. The instruction to remove the page never gets read. To take a page out of
results properly, **let it be crawled** and serve `noindex`.

## AI crawlers

Blocking GPTBot, ClaudeBot, CCBot and the rest keeps your content out of training
data. It also keeps you out of the answers those systems give, which is
increasingly how people find things.

That tradeoff is genuinely yours to make. A publisher whose product is the words
may want them out. A tools site that wants to be recommended when somebody asks
an assistant for a converter probably wants them in.

Worth knowing that some hosts add these blocks for you. Cloudflare injects a
managed robots.txt on new zones that disallows every major AI crawler by default,
and it appends before your own file, so yours loses. If you did not write those
rules and they are there, that is where they came from.

## Rules that trip people up

Matching is prefix based and more literal than it looks:

- `Disallow: /admin` blocks `/admin`, `/administrator` and `/admin-panel`. Use
  `Disallow: /admin/` for just the folder.
- `Disallow:` with nothing after it allows everything. It is the opposite of
  `Disallow: /`, and one character apart.
- The most specific matching rule wins, not the first one, so `Allow` can carve
  an exception out of a broader `Disallow`.
- `Crawl-delay` is ignored by Google entirely. Bing honours it.
- Blocking your CSS and JavaScript stops Google rendering the page properly, and
  it judges what it can render. This used to be common advice and is now actively
  harmful.

## After you change it

Google recrawls robots.txt on its own schedule, usually within a day. You can
force a recheck in Search Console, which also shows what Google last fetched, and
that is worth looking at, because the file it has may not be the file you think
you published.

Recovery is not instant. Pages come back as they are recrawled, and a large site
takes weeks. Nothing about that means it failed.

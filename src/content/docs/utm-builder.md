---
updated: "2026-08-19"

title: Why does one campaign show up as four rows in analytics?
description: Because Email and email are different mediums. UTM values are case sensitive, and inconsistent tagging splits one campaign into several.
keywords: [utm parameters, utm builder, campaign tracking, utm source, google analytics]
---

Because analytics treats `Email` and `email` as two different mediums. Tag the
same campaign four slightly different ways and you get four rows, each showing a
quarter of the traffic, each looking like it underperformed.

Nothing errors. Nobody notices until somebody tries to total it up weeks later
and the numbers do not match the send.

## The five parameters

Only two of them matter most of the time.

**`utm_source`** is where the visit came from. `newsletter`, `twitter`,
`partner-blog`. This is the one you cannot skip.

**`utm_medium`** is how it travelled. `email`, `social`, `cpc`, `referral`. Also
not optional, because without source and medium the visit is filed as direct
traffic and the tag may as well not exist.

**`utm_campaign`** groups a set of links into one effort. `spring-launch`.

**`utm_term`** was built for paid search keywords. Mostly unused now.

**`utm_content`** distinguishes variants within one campaign: which button, which
image, which position in the email. Useful when you are testing, noise when you
are not.

## Rules worth following

**Lowercase everything, always.** This is the entire problem above, and it is
solved by never deviating.

**Hyphens rather than spaces.** A space becomes `%20`, which is ugly in a report
and easy to mistype. Underscores work but hyphens read better.

**Keep a list.** Write down the source and medium values your team uses and stick
to them. `facebook` and `fb` and `Facebook` are three campaigns as far as your
reports are concerned.

**Never tag internal links.** Putting UTM parameters on a link from one page of
your site to another restarts the session and overwrites the original source. The
visit that came from your newsletter is now attributed to your own homepage, and
the campaign you were measuring loses the credit.

## Where the parameters go

Before the `#`, always. Anything after a fragment never leaves the browser, so
analytics never sees it. If your URL already has a fragment, the parameters go
before it:

```
https://example.com/page?utm_source=newsletter#section
```

If the URL already has a query string, add to it with `&` rather than a second
`?`.

## A few things people assume wrongly

**They are not a Google feature.** UTM parameters are a plain convention that
every serious analytics tool reads. They started with Urchin, which Google bought
and turned into Analytics, which is where the name comes from.

**They are visible.** They sit in the address bar, they get copied when somebody
shares the link, and they end up in other people's referral reports. Do not put
anything internal or embarrassing in a campaign name.

**They can affect SEO.** A tagged URL is technically a different URL, and if
tagged versions get indexed you have duplicate content competing with itself.
A canonical tag on the page pointing at the clean URL prevents this, and most
platforms do it already. Worth checking if you tag heavily.

**Shortened links keep working.** A short link redirecting to a tagged URL passes
the parameters through the redirect, so tracking survives.

## When not to bother

Tagging every link everywhere produces noise. The point is answering a question:
did the newsletter work, is that partnership worth renewing, which of the two
subject lines pulled better.

If nobody is going to look at the row, the tag is just an uglier URL.

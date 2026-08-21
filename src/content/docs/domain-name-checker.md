---
updated: "2026-08-21"
title: Why do domain checkers disagree about whether a name is free?
description: Most of them ask DNS, which doesn't know who owns a name. This one asks the registries. Here's the difference and where it still can't answer.
keywords: [domain name checker, is this domain available, domain availability, whois]
---

Because most of them are answering a different question. They ask DNS whether
the name resolves, and resolving has almost nothing to do with being owned.

Somebody can register a name and never point it anywhere. It won't resolve, so
a DNS based checker calls it available, and you find out otherwise at checkout.
Going the other way, a name parked on a for sale page resolves perfectly well,
so the same checker calls it taken when it's actively being sold.

This one asks the registry that runs the ending, over a protocol called RDAP.
The registry is the thing that keeps the list, so it's the only source that
actually knows.

## What the answers mean

**Taken** means the registry holds a record for it. Someone registered it. That
doesn't mean it's in use, and it doesn't mean it isn't for sale.

**Free** means the registry answered and has no record. Nobody has registered
it.

**Unknown** means we couldn't get an answer worth trusting, and that's the one
worth explaining.

## Why some endings say unknown

IANA publishes a list of which endings run a lookup service and where it lives.
Most do. Some don't, and two popular ones are missing: .io and .co.

For those, there's no service to ask from a browser. We could guess from DNS,
and guessing is how a checker ends up telling you google.io is available. It
isn't. Saying we don't know is less useful and considerably more honest.

To check a .io or .co, use a registrar's search. They have arrangements with
those registries that a web page doesn't.

## A free answer isn't a reservation

Nothing here holds the name. Between seeing it's free and paying for it,
somebody else can register it, and popular names do go in minutes.

There's a long-standing worry about domain front running, where searching for a
name is what causes somebody to snap it up. It's mostly folklore now, but the
mechanism it feared is real enough: if you search somewhere that also sells
domains, your search is data they hold. This tool asks the registry directly and
stores nothing, because there's nowhere here to store anything.

If a name matters, buy it. It's a few pounds and the certainty is worth more
than the few pounds.

## What taken doesn't tell you

It doesn't tell you who, and increasingly nothing does. Registration records
used to carry the owner's name, address and email. Since the GDPR, most of that
is redacted for anyone who isn't law enforcement or the registrar.

So a taken name might be actively used, sat on by an investor, or held by
somebody who forgot about it eight years ago. You can't tell from the record,
and most registrars offer a broker service if you want to make an offer.

Worth knowing: a name that expires isn't immediately free. There's a grace
period of about thirty days where the original owner can renew, then a
redemption period of another thirty, then it's deleted. Names with any value at
all get caught by a drop catching service the second they're released, so
waiting for a good name to expire is rarely a plan.

## Choosing an ending

The .com is still what people type when they half remember a name, and what
they assume when you say a name aloud. If yours is taken and you use something
else, expect to lose some traffic to whoever has the .com.

That's a real cost, and it's often worth paying. Plenty of good businesses run
on .io, .app or .xyz. What causes trouble is a name where the .com belongs to
somebody in the same line of work, because then the confusion is constant.

The other thing to check before committing is what the name looks like as one
lowercase string with no spaces. Read it aloud to somebody who hasn't seen it
written. If they spell it back wrong, that's the name, not them.

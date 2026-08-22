---
updated: "2026-08-22"
title: Is Base64 a way of encrypting something?
description: No. It's a way of writing binary data as plain text, and anyone can reverse it instantly. What it's actually for, and why it makes files bigger.
keywords: [base64 encoder, base64 decode, is base64 encryption, encode file to base64]
---

No, and this is the misunderstanding worth clearing up first. Base64 offers no
protection whatsoever. It's a way of writing arbitrary bytes using 64 ordinary
characters, and anyone who sees it can decode it in seconds with any tool,
including this one.

If something needs to be secret, it needs encryption. Base64 is about
transport, not secrecy.

## What it's for

Some channels only carry text safely. Email bodies, JSON fields, XML documents,
config files, HTTP headers, and anything that might pass through a system that
mangles unusual bytes.

Base64 lets you put a picture, a certificate or any binary file through those
channels without it being corrupted on the way. That's the whole job.

## Where you'll meet it

**Email attachments.** Every attachment you've ever sent travelled as Base64.

**Data URLs**, the `data:image/png;base64,...` you see in HTML and CSS, which
embed a small image directly in the file instead of fetching it separately.

**JSON Web Tokens.** The three dot-separated parts of a JWT are Base64. Which
is exactly why a JWT is not a secret: anyone holding one can read its contents.
Its security comes from the signature proving it wasn't altered, not from
anyone being unable to read it. Decoding the middle section shows you exactly
what a token claims.

**Basic authentication headers**, where the username and password are Base64
encoded and therefore effectively in plain sight. That's why HTTP Basic auth
over plain HTTP is unsafe: the credentials aren't hidden, only lightly
disguised.

**Certificates and keys** in PEM format, which is Base64 with header lines.

## Why it makes things bigger

Every three bytes become four characters, so the result is about 33% larger
than what you started with. Line breaks in some variants add a little more.

That matters for data URLs. Embedding a 100KB image in your CSS costs about
133KB and can't be cached separately from the stylesheet. It's worth it for a
tiny icon that would otherwise be its own request, and not worth it for a
photograph.

## The variants that trip people up

**Standard Base64** uses `+` and `/` as its last two characters, and `=` to
pad the end.

**URL-safe Base64** replaces `+` with `-` and `/` with `_`, because the
originals have meanings in a URL. JWTs use this, which is why they contain
hyphens and underscores.

Feeding one into a decoder expecting the other produces either an error or
garbage. If a decode fails on a string that looks fine, this is the first thing
to check.

**Padding.** The trailing `=` signs bring the length to a multiple of four.
Some systems strip them and some require them. A decoder that fails on a string
ending without `=` is usually strict about this.

## When decoding fails

**Whitespace and line breaks.** Base64 copied out of a certificate or an email
comes wrapped across lines. Most decoders cope; some don't.

**It wasn't Base64.** Hexadecimal looks similar at a glance and is a different
thing entirely. Base64 uses upper and lower case letters, digits, and two
symbols; hex uses only 0 to 9 and A to F.

**It was encoded twice.** Decodes to something that is itself Base64. Decode
again.

**The wrong variant**, as above.

## Encoding files

A file encodes to a very long string. That's expected, and for anything above a
few hundred kilobytes it becomes unwieldy: browsers slow down handling
multi-megabyte strings, and pasting one into a config file is rarely the right
answer.

For small images, icons and certificates it's the normal approach. For anything
large, send the file.

## Nothing leaves your browser

Encoding and decoding both happen locally. That matters more here than on most
tools, because the things people paste into a Base64 decoder are frequently
tokens, credentials and certificates. Pasting a production secret into a website
that sends it somewhere is a genuine incident, and it happens.

---
updated: "2026-08-19"

title: Base64 is not encryption, and what it is actually for
description: Base64 makes binary data survive text-only channels. Anyone can decode it instantly, so it hides nothing. Here is when to use it.
keywords: [base64, base64 encode, base64 decode, data uri, encoding vs encryption]
---

Base64 turns arbitrary bytes into a string of 64 safe characters. That is the
entire purpose: getting binary data through something that only handles text.

It is not encryption and provides no secrecy whatsoever. There is no key.
Anybody who sees the string can decode it in one step, which is exactly what this
tool does. If you have encoded something sensitive and felt reassured, that
feeling was misplaced.

## Why it exists

Plenty of systems only accept text, and mangle anything else. Email was designed
for 7-bit ASCII. HTTP headers, JSON strings, XML documents, URLs and config files
all have characters that mean something structural, and raw binary is full of
bytes that will terminate a string early or get silently rewritten.

Base64 sidesteps all of it by using only `A-Z`, `a-z`, `0-9`, `+` and `/`, none
of which mean anything special anywhere.

The cost is size. Three bytes become four characters, so encoded data is about
**33 percent larger** than what went in. That is the price of the guarantee.

## Where it belongs

**Email attachments.** Every attachment you have ever sent travelled as Base64.
MIME is built on it.

**Data URIs.** A small image embedded directly in CSS or HTML as
`data:image/png;base64,...` saves a network request. Worth it for an icon,
counterproductive for anything large, because the 33 percent overhead lands on
every page load and the data cannot be cached separately.

**JSON and APIs.** A JSON string cannot hold raw bytes, so a file inside a JSON
payload is Base64.

**Basic auth headers.** `Authorization: Basic` is Base64 of `user:password`. This
is the clearest example of encoding not being encryption: those credentials are
plain text to anyone watching, which is why basic auth is only acceptable over
HTTPS, where the transport does the actual protecting.

## Where it does not belong

**Hiding anything.** Storing a Base64 API key in your JavaScript is the same as
storing it in plain text, with an extra step that fools only the person who did
it.

**Large files.** A 10MB video becomes 13MB of text that has to be decoded before
anything can use it. Send the bytes.

**Passwords.** Ever. Passwords get hashed with something slow and salted, not
encoded.

## The padding, and other oddities

Base64 works in groups of three bytes. When the input does not divide evenly, the
output is padded with `=` to keep the length a multiple of four. So a string
ending in `=` or `==` is usually Base64, and that padding is the giveaway.

Some systems strip the padding, and some decoders then refuse the result. If a
string looks like Base64 and fails to decode, missing padding is the first thing
to check.

There is also a **URL safe** variant that swaps `+` and `/` for `-` and `_`,
because the standard characters have meaning inside a URL. JWTs use it. If a
token full of dashes and underscores will not decode with a standard decoder,
that is why.

## Decoding something you were sent

Safe to do here, since it happens in your browser and nothing is transmitted.

Decoding it does not make the contents trustworthy. Base64 is a common wrapper
for malicious payloads precisely because it slips through filters looking for
recognisable patterns. Seeing what is inside is useful. Running it is a separate
decision.

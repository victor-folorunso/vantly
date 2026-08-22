---
updated: "2026-08-22"
title: Why did my link break when it had a space in it?
description: Spaces aren't allowed in a URL, so they become %20. Which characters need encoding, and the common mistake of encoding the whole link.
keywords: [url encoder, percent encoding, url decode, "%20 in url", encode url]
---

Because a space isn't allowed in a URL. Everything after it gets treated as
something else, so the link stops at the space and the rest is dropped or
mangled.

The fix is percent-encoding: the character becomes a `%` followed by its value
in hexadecimal. A space becomes `%20`. That's why `%20` appears in so many
links pasted out of documents.

## What needs encoding

**Always:** space, `"`, `<`, `>`, `#`, `%`, `{`, `}`, `|`, `\`, `^`, `~`, `[`,
`]` and the backtick.

**Sometimes**, and this is where it gets subtle. These have jobs in a URL, so
whether they need encoding depends on whether you mean the job or the
character:

| Character | Its job | Encoded |
|---|---|---|
| `?` | starts the query | `%3F` |
| `&` | separates parameters | `%26` |
| `=` | separates name from value | `%3D` |
| `/` | separates path segments | `%2F` |
| `+` | means space in a query | `%2B` |
| `#` | starts the fragment | `%23` |

**Never:** letters, digits, and `- . _ ~`. These are safe everywhere and
encoding them just makes the link uglier.

## The mistake that breaks things

Encoding the whole URL, including the parts that need to stay as they are.

Encode `https://example.com/search?q=hello` in full and you get
`https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello`, which isn't a link any more.
It's a string that happens to describe one.

**Encode the values, not the structure.** If you're building a link, take each
parameter value on its own, encode that, and assemble the URL around the encoded
pieces. The `?`, `&` and `=` doing the assembling stay as they are.

So a search for `fish & chips` becomes `?q=fish%20%26%20chips`. The `&` inside
the value is encoded because it's part of the search term. The `?` and `=`
aren't, because they're doing their jobs.

## Plus signs and the two conventions

`+` means a space in the query part of a URL, inherited from how HTML forms
have always submitted data. It does not mean a space in the path.

So `/my+file` is a file with a plus in its name, and `?q=my+file` is a search
for "my file". The same character, two meanings, depending on where it sits.

That's why an email address with a plus in it, the `you+shopping@gmail.com`
trick, sometimes arrives as a space and breaks. Whatever handled it encoded it
as a query value when it wasn't one, or failed to encode it at all.

If you mean a literal plus, encode it as `%2B` and it works in both places.

## Encoding twice

`%20` encoded again becomes `%2520`, because the `%` itself gets encoded. If
you see `%2520` in a URL, something encoded an already-encoded string.

It usually happens when a link passes through two systems that both helpfully
encode it. The symptom is a link that visibly contains `%25` and leads nowhere.

Decoding twice fixes it, and the real fix is finding which layer is doing it
twice.

## Accents and other alphabets

Anything outside plain ASCII gets encoded as its UTF-8 bytes, so each character
can become several percent-groups. `é` is `%C3%A9`. A Chinese character is
typically three groups.

Long strings of percent-groups in a link are normal and mean somebody wrote in
a language with more than 26 letters.

Domain names work differently: they use punycode, so `münchen.de` becomes
`xn--mnchen-3ya.de`. That's a separate mechanism and percent-encoding doesn't
apply to it.

## Where this matters most

**Links in emails and documents.** Word and mail clients often break at a space
without warning, and the recipient gets a truncated link.

**Query parameters holding anything typed by a person.** Search terms, names,
addresses.

**Anything with `&` in it.** A company name like "Smith & Sons" in a URL will
split the parameter in half unless the `&` is encoded.

Encoding and decoding both happen in your browser. Nothing is sent anywhere,
which matters given how often the thing being encoded is a link with a token in
it.

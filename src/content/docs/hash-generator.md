---
updated: "2026-08-19"

title: What is a checksum, and why does mine not match?
description: A hash is a fingerprint of a file. If yours differs from the published one, the usual cause is the wrong algorithm, not a tampered download.
keywords: [checksum, sha256, verify download, hash file, md5]
---

A checksum is a short fingerprint of a file. Run the file through a hash
function and you get a fixed length string. Change one byte anywhere and the
string changes completely.

That is what makes it useful: publish the hash of a download, and anyone can
check the copy they received is byte for byte the file you meant to send.

## Reading a mismatch correctly

If your hash does not match the published one, work through these in order. The
last one is the least likely, despite being the one people jump to.

**You used a different algorithm.** SHA-256 and SHA-1 of the same file produce
completely different strings. Check what the download page actually published.
This is the cause most of the time.

**The download did not finish.** A truncated file hashes differently from a
complete one. Check the file size against the published size first, since that is
faster than hashing again.

**You hashed the wrong thing.** A zip and its contents have different hashes.
So does a file that your browser silently decompressed on the way in.

**Line endings changed.** This only affects text files moved between Windows and
Unix. A file where every `\n` became `\r\n` is a different file as far as a hash
is concerned, even though it looks identical.

**The file was actually modified.** Real, and rare. If the first four do not
explain it, do not run the file.

## Which algorithm to use

**SHA-256** is the sensible default. It is fast, widely published, and there is
no known way to construct two files with the same output.

**SHA-512** is not meaningfully more secure for this purpose. It is faster on
64-bit hardware, which is the actual reason to pick it.

**SHA-1** is broken for security. Researchers demonstrated a real collision in
2017, two different files with the same SHA-1. It is still fine for spotting
accidental corruption, and it is here because plenty of older projects published
SHA-1 sums and never updated them.

**MD5** is deliberately absent from this tool. It is thoroughly broken, and
collisions can be generated in seconds on a laptop. Offering it beside SHA-256
in the same list implies they are alternatives, and they are not. If you need to
check an old MD5 sum, use a dedicated tool and understand that it proves the file
was not corrupted, not that it was not swapped.

## What a checksum does not prove

It proves the file matches the hash. That is all.

If an attacker can change the file on the server, they can usually change the
hash on the page beside it, and then everything matches perfectly. A checksum
published on the same page as the download protects against a corrupted transfer,
not against a compromised server.

Protection against that needs a signature rather than a hash: something signed
with a key the attacker does not have, like a GPG signature or a signed installer.
The hash tells you the file is intact. A signature tells you who made it.

## Why this runs on your machine

The usual reason to hash a file is to check it arrived intact. Uploading it to a
stranger's server to find that out would be self defeating, and slow for anything
large. The file is read locally and the bytes never leave.

Comparison is done case insensitively and with whitespace trimmed, because a hash
copied from a download page arrives with whatever spacing and capitalisation that
page used, and a mismatch caused by a stray space is a false alarm about
something that matters.

## Hashing text rather than a file

The same function works on any input. Hashing a short string is useful for
checking two pieces of text are identical without comparing them by eye.

It is not useful for storing passwords. A plain SHA-256 of a password is fast to
compute, which is exactly wrong: an attacker with the hashes can try billions of
guesses a second. Password storage needs a deliberately slow function like
bcrypt, scrypt or Argon2, with a unique salt per user.

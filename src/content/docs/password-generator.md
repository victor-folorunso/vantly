---
updated: "2026-08-19"

title: Are generated passwords actually random?
description: It depends entirely on where the randomness comes from. Math.random is predictable. This uses the browser's cryptographic source instead.
keywords: [password generator, secure password, random password, passphrase]
---

It depends where the randomness comes from, and the difference is not a detail.

A password built from `Math.random()` looks random and is not. It comes from a
fast, predictable algorithm designed for shuffling arrays and animating things.
Given enough output, its future values can be worked out. Several password
generators have shipped exactly that mistake.

This one uses `crypto.getRandomValues`, the browser's cryptographic source. It is
seeded by the operating system from genuinely unpredictable physical events, and
it is the same source that generates the keys protecting your bank connection.

## Length beats complexity, by a lot

The instinct is to add symbols. The maths says add characters.

Each extra character multiplies the number of possibilities by the size of the
alphabet. Going from lowercase only to mixed case, digits and symbols roughly
quadruples the alphabet, from 26 to about 94. Adding four characters to a
lowercase password multiplies the possibilities by 456,976.

So a 20 character passphrase of ordinary words is far stronger than a 10
character jumble, and you can actually type it on a phone.

This is why the old advice about a capital, a number and a symbol has largely
been retired. NIST's guidance dropped composition rules in 2017. They pushed
people toward predictable patterns, the capital at the front and the exclamation
mark at the end, while making passwords harder to remember and no harder to
guess.

## What actually breaks accounts

Not brute force against a strong password. That is not how accounts fall.

**Reuse.** A site with poor security gets breached, the credentials appear in a
dump, and attackers try that email and password everywhere else. This is the
single largest cause, and no password is strong enough to survive being used in
two places.

**Phishing.** A perfect password typed into a convincing fake login page is a
perfect password in somebody else's hands.

**Predictable patterns.** Substituting 3 for e and @ for a is in every cracking
dictionary and has been for twenty years. `P@ssw0rd!` is not meaningfully better
than `password`.

The fix for all three is a password manager: a unique random password per site,
so a breach at one is contained, and autofill that refuses to type your
credentials into a domain that does not match.

## Where two factor fits

A second factor turns a stolen password into an incomplete one. Worth having on
anything that matters, particularly email, since email is how every other
password gets reset.

An authenticator app beats SMS. Phone numbers can be moved to another SIM by
somebody who convinces a phone shop they are you, and that attack is common
enough to have a name.

## Nothing here is stored or sent

The password is generated in your browser and exists only on the page. Reload and
it is gone. Nothing is transmitted, logged or kept.

Worth being blunt about the limit of that promise: a generator you did not write
can always claim this. The reason to believe it here is that the site is a static
export with no server to send anything to, and the code is on GitHub. Judging that
for yourself is more useful than taking anybody's word for it, this page
included.

## A practical setup

1. A password manager holding a unique random password for every account.
2. One long passphrase you actually remember, protecting the manager.
3. Two factor on email first, then anything financial.
4. Stop rotating passwords on a schedule. Forced rotation produces
   `Summer2026!` becoming `Autumn2026!`, which helps nobody. Change a password
   when there is a reason to.

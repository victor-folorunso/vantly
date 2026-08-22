---
updated: "2026-08-22"
title: Should you design with lorem ipsum or real text?
description: Real text where you can get it, because placeholder text hides problems that only appear when the words have meaning and awkward lengths.
keywords: [lorem ipsum generator, placeholder text, dummy text, filler text]
---

Real text, wherever you can get it. Placeholder text has one job, which is
holding a space so you can judge shape and rhythm, and it's bad at almost
everything else.

The problem is that lorem ipsum is uniformly pleasant. Its words are a
comfortable length, it has no proper nouns, no numbers, no long compound words,
no URLs and no all-caps abbreviations. Real content has all of those, and they
are exactly what breaks a layout.

## What placeholder text hides

**Headlines that don't fit.** Lorem ipsum headlines wrap neatly. Real ones
contain a fourteen-letter product name that overflows the box.

**Empty and near-empty cases.** A design tested only with three tidy paragraphs
has never been seen with one sentence, or with nothing at all, and both happen
on a live site.

**Length variation.** Real product descriptions run from six words to two
hundred, and a card grid that looks even with placeholder text goes ragged
immediately.

**Reading weight.** Text you can't read is scanned as texture, so line length
and spacing get judged by how they look rather than by how they read. Prose at
a comfortable measure and prose at 120 characters a line look similar in grey
and feel completely different to read.

## When it's the right choice

When the words genuinely don't exist yet and waiting for them would block
everything else. That's a real situation and this is what it's for.

When you're demonstrating typography rather than content, and meaningful words
would pull attention to what they say.

When you need bulk quickly to test how a page behaves with a lot on it.

In all three cases, use it as scaffolding and replace it before anyone signs
anything off.

## The classic failure

Placeholder text shipping to production. It happens constantly, on real sites,
including large ones, and it usually reaches the live page through a field
nobody thought was visible.

Two habits prevent it. Search the codebase for `lorem` before a release, which
takes seconds. And if you can, use obviously wrong placeholder text rather than
plausible Latin: nobody ships `PLACEHOLDER PLACEHOLDER` by accident, and plenty
of people have shipped lorem ipsum.

## Where it comes from

It's scrambled Latin, based on a first-century text by Cicero, cut up and
altered until it stopped meaning anything. Printers have used it since at least
the 1500s to show typefaces without the words distracting from the letterforms.

That history is the reason it works as a typography specimen and the reason it's
poor at everything else. It was designed to be unreadable on purpose.

## Better alternatives for layout work

Text in the language your site will actually use. Lorem ipsum's letter
distribution is Latin, so it looks wrong under a German site with its long
compounds, and it tells you nothing about a layout that will hold Arabic or
Chinese.

Old copy from a previous version of the page. It's the right subject, the right
register and roughly the right length.

Deliberately extreme content, once the normal case works: the longest plausible
name, the shortest possible description, a paragraph of one word repeated. That
finds the breaks before your users do.

Everything is generated in your browser and nothing is sent anywhere.

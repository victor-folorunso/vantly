---
updated: "2026-08-21"
title: Why do word counts disagree between tools?
description: Hyphens, contractions and numbers get counted differently everywhere. What counts as a word here, and what the reading time is based on.
keywords: [word counter, character count, reading time, how many words]
---

Because there's no agreed definition of a word, and every tool draws the line
somewhere slightly different. Hyphenated words, contractions, numbers, em
rules and URLs are all judgement calls, and reasonable tools disagree on all of
them.

Here, a word is a run of characters separated by whitespace. So `well-known` is
one, `don't` is one, `2026` is one, and a URL is one however long it runs.

Word counts differing by one or two percent between tools is normal. Differing
by ten percent usually means one of them is counting something odd, like
treating each part of a hyphenated word separately.

## When the exact number matters

For an assignment with a stated limit, use whatever the marker will use. That's
almost always Word, and Word counts the way this does with one notable
exception: it counts a number with a space in it, like `10 000`, as two words.

For a journal or a publisher, the guidelines usually say whether footnotes,
captions, the abstract and the bibliography are included. That distinction moves
the number far more than any counting rule, and it's the one people get wrong.

For anything with a hard limit, leave yourself a margin. Being three words over
because of a definition disagreement is a bad way to fail a requirement.

## Characters, with and without spaces

Both are shown because both get asked for.

Character limits on forms almost always include spaces, since they're limiting
storage. A 500 character limit means 500 including spaces.

Typographic and design contexts often quote the count without spaces. Print and
publishing conventions vary.

If a form rejects text that looks short enough, the usual culprit is line
breaks counting as characters, or a paste that brought invisible formatting
characters with it.

## Reading time

Based on 200 to 250 words a minute, which is the ordinary range for an adult
reading prose on a screen for comprehension.

It's a rough figure and it should be treated as one. Dense technical writing is
read far slower. A list is scanned rather than read. Somebody skimming for one
fact isn't reading at all.

Speaking is slower than reading. A comfortable presentation pace is around 130
to 150 words a minute, so a five minute talk is roughly 700 words. That's the
number to use for a speech, not the reading time.

## Sentences and paragraphs

Sentences are counted by terminal punctuation, which means abbreviations
inflate the number. `Dr. Smith arrived at 9 a.m.` counts as three sentences by
most methods, including this one. It's a known limitation of counting this way
and every tool that doesn't parse grammar shares it.

Paragraphs are separated by blank lines. Text pasted from a PDF often arrives
with a line break at the end of every visual line, which turns one paragraph
into twenty. [Stripping the empty lines](/remove-empty-lines) first gives a
sensible count.

## Counting for a specific purpose

- **Meta description:** aim for 150 to 160 characters. Google truncates around
  there, and it truncates by pixel width rather than character count, so capital
  letters and wide characters cost more.
- **Page title:** 50 to 60 characters.
- **A post on X:** 280 characters, and a link counts as a fixed 23 no matter
  how long it is.
- **SMS:** 160 characters for plain text. One non-Latin character switches the
  whole message to a different encoding and drops the limit to 70.

That last one surprises people. A single emoji in an otherwise plain text
message more than halves how much fits in one message.

## Nothing is sent anywhere

The counting happens as you type, in your browser. Nothing is uploaded and
nothing is stored, which matters given how often the text being counted is a
cover letter, an application or a draft nobody else has seen yet.

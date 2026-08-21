---
updated: "2026-08-21"
title: How do you compare two versions of a text?
description: Paste both and the changed lines are highlighted. Why whitespace and line endings cause false differences, and what a line diff can't show you.
keywords: [diff checker, compare two texts, text comparison, find differences between files]
---

Paste the old version on one side and the new one on the other. Lines that
changed are marked, lines that didn't are left alone, and within a changed line
the specific words that moved are highlighted.

The comparison is a line-by-line one, which is what almost every diff tool does,
including the one behind version control. It's the right default and it has one
consequence worth understanding.

## Why a small edit can show as a whole changed line

A line diff works in whole lines. Change one character and the entire line is
marked as removed and added again, because as far as the algorithm is concerned
the old line is gone and a different one has arrived.

Word-level highlighting within the line is what makes that readable, and it's
why a single changed digit in a long line doesn't leave you hunting.

## False differences

Three things cause differences that aren't really differences, and all three
are common when comparing text from different sources.

**Trailing spaces.** Invisible, and they make two identical-looking lines
different. Text pasted out of an email or a PDF frequently carries them.

**Line endings.** Windows ends a line with two characters where Mac and Linux
use one. A file edited on both can show every line as changed. Most tools
normalise this, including this one.

**Indentation.** A tab and four spaces look identical and are not. A file
converted between the two shows as entirely rewritten.

If everything shows as changed and it shouldn't have, one of those three is
almost always why.

## What this can't tell you

**Whether the change matters.** A diff shows what moved, not what it means.
Reformatting JSON changes every line and changes no data. Renaming a variable
throughout changes hundreds of lines and does nothing.

**Moved blocks.** A paragraph moved from the top of a document to the bottom
shows as a deletion in one place and an addition in another, not as a move. The
algorithm has no concept of a block that travelled.

**Formatting in a document.** Pasting from a word processor gives you the words
without the bold, the headings or the styles. Two versions that differ only in
formatting come out identical here, which is occasionally exactly what you want
and occasionally the thing you were looking for.

## Comparing files rather than text

For structured formats, format both sides the same way before comparing. Two
JSON files with different indentation show as completely different and are the
same data. [Formatting both](/json-formatter) first turns a meaningless diff
into a useful one.

The same applies to XML, HTML and CSS. Minified against formatted is never a
useful comparison.

For a CSV, sorting both sides by the same column first is usually necessary,
since two exports of the same data in a different row order otherwise look
entirely unrelated.

## Comparing PDFs and documents

You can't compare PDFs directly here, but you can compare what they say. [Pull
the text out of each](/pdf-to-txt) and compare that.

That catches changed wording, which is usually what matters in a contract. It
won't catch a changed figure inside an image, a changed signature, or altered
formatting, so it's a first pass rather than a legal review.

Two versions of a Word document are better compared in Word itself, which has a
proper compare feature that understands tracked changes and formatting.

## Nothing leaves the page

Both texts stay in your browser. There's no upload and no storage, which is the
point for the common cases here, since the things people compare are contract
drafts, code, and versions of something confidential enough that two copies
exist.

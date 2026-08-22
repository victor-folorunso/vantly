---
updated: "2026-08-22"
title: Why does my sorted list put 10 before 2?
description: Because it's sorting text, not numbers, and in text 1 comes before 2. What alphabetical order does to numbers, capitals and accents, and how to work around it.
keywords: [sort lines, alphabetical order, sort list online, natural sort]
---

Because it's comparing text character by character, and the first character of
`10` is `1`, which comes before `2`. So `1, 10, 100, 2, 20, 3` is correct
alphabetical order, and it's almost never what anyone wants for numbers.

The same reason explains why `item2` lands after `item10`.

## Working around it

**Pad the numbers.** `01, 02, 10` sorts correctly as text, because every entry
is the same width. If you're generating the list, padding at the source fixes
it permanently.

**Put the number last** in the line, if the text before it is identical.
Sorting then compares the text first and the numbers only where the text
matches, which still hits the same problem but on a smaller scale.

**Sort numerically elsewhere.** A spreadsheet or a script that understands
numbers is the right tool for a list that's genuinely numeric.

Natural sorting, which reads runs of digits as numbers, is what file managers
do when they show `file2` before `file10`. It's the intuitive behaviour and
it's not what plain alphabetical sorting does.

## Capitals

In the raw character order that computers use, every capital letter comes
before every lowercase one. So `Zebra` sorts before `apple`, which looks broken
and is technically correct.

Case-insensitive sorting treats `apple` and `Apple` as equal and gives the
order people expect. That's the sensible default for anything a person will
read.

Case-sensitive sorting still matters when the list is code, filenames on a
case-sensitive system, or anything where `ID` and `id` are genuinely different
things.

## Accents and other alphabets

Sorting by raw character value puts accented characters after all the unaccented
ones, so `zebra` comes before `Ångström`, and Cyrillic or Greek text lands in
its own block regardless of meaning.

Proper alphabetical order is language-specific and genuinely disagrees between
languages. In Swedish, å, ä and ö come after z. In German they sort with a, a
and o. In Spanish, ñ has its own place after n. There is no single correct
order, only the correct order for a particular language.

For a list going in front of readers in one language, sorting with that
language's rules is what you want, and that's a job for a spreadsheet or a
locale-aware tool rather than a general text sorter.

## Blank lines and whitespace

Blank lines sort to the top, because an empty string comes before everything.
[Removing them first](/remove-empty-lines) usually gives a cleaner result.

Leading spaces are compared like any other character, so a line beginning with
a space sorts above one that doesn't. Text pasted from a document often carries
them invisibly, which is why a list can sort into two apparent groups for no
visible reason.

## Reversing, and what it isn't

Reversing sorts descending. It's not the same as reversing the order of the
lines as they were, which keeps the original sequence and flips it.

Both are useful and they're different operations. If you want the last line
first, you want the second one.

## After sorting

Sorting brings duplicates next to each other, which is what makes
[removing them](/remove-duplicate-lines) reliable. Doing it in that order is
the usual reason to sort a list at all.

Everything happens as you type, in your browser. Nothing is uploaded, which
matters when the list is names, emails or anything else you'd rather not paste
into a server.

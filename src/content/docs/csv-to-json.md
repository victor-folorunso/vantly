---
updated: "2026-08-21"
title: What happens to numbers and empty cells when CSV becomes JSON?
description: A CSV has no types, so every conversion has to guess. What gets treated as a number, what becomes null, and the leading zero problem.
keywords: [csv to json, convert csv to json, csv parsing, csv leading zeros]
---

A CSV holds nothing but text. There's no difference stored between the number
42 and the characters `4` and `2`, so anything turning a CSV into JSON has to
decide, and the decisions are where things go wrong.

Here, a cell that looks like a number becomes a number, an empty cell becomes
`null`, and `true` or `false` become booleans. Everything else stays a string.

## The leading zero problem

This is the one that bites hardest. A postcode, a phone number, a product code
and a bank sort code all look like numbers and all lose their leading zeros the
moment something treats them as one.

`01234` becomes `1234`. The zero is gone, and nothing downstream can tell it was
ever there.

Spreadsheets do this too, which is why a column of postcodes opened in Excel and
saved again comes back mangled. It's the single most common way real data gets
quietly corrupted.

If your CSV has identifiers in it, check them in the output before you use it.
A column of IDs that all lost a digit is easy to spot and easy to miss.

## Very large numbers

JSON has no size limit on numbers, but almost everything that reads JSON parses
them as doubles, which lose precision above about 9 quadrillion.

Database IDs and the long numeric IDs social platforms use both reach that
range. A number that comes out ending in `00` when the original didn't has hit
this, and the fix is to keep it as a string rather than to find a better parser.

## Empty, null, and the empty string

An empty cell becomes `null`. That's a real choice and not the only defensible
one: an empty cell could equally mean an empty string.

The distinction matters when the difference is meaningful. A blank middle name
column might mean "no middle name" or "we didn't ask", and a CSV cannot tell you
which. Whatever the converter picks, one of those readings gets flattened.

A cell containing the word `null` stays the string `"null"`, because it's text
in the file and guessing otherwise would be worse.

## Quoting and commas inside fields

A field containing a comma has to be wrapped in double quotes, or the parser
sees two fields. `Smith, John` unquoted becomes two columns and every row after
it shifts.

A double quote inside a quoted field is escaped by doubling it: `"She said
""yes"""`. Backslash escaping is not the CSV convention and doesn't work.

Line breaks inside a quoted field are legal, and they're why a naive
line-by-line parser mangles files exported from spreadsheets containing
addresses.

## Separators that aren't commas

Plenty of files called CSV use semicolons, because several European locales use
a comma as the decimal point and a semicolon as the separator. Tabs are also
common.

If a file comes out as one giant column, the separator is the reason. [TSV is
the same thing with tabs](/tsv-to-json) and converts the same way.

## Headers

The first row becomes the keys. That assumes there is a header row, and files
exported from some systems don't have one.

Duplicate header names are a quiet problem: two columns both called `date`
produce one key, and one of them wins. Rename them in the source before
converting.

Blank header cells produce keys you can't easily reference. Worth fixing at the
source rather than in the output.

## The shape you get

An array of objects, one per row, with the header row as keys. That's what most
APIs and most code expects.

It's not the most compact shape. An array of arrays with a separate header list
is smaller on a large file, since the keys aren't repeated on every row. For
anything under a few thousand rows the difference doesn't matter, and objects
are far easier to work with.

## Big files

Everything is parsed in your browser, so the limit is your machine's memory
rather than an upload cap. Tens of thousands of rows are comfortable.

A file of several hundred megabytes may not be, and that's the point where a
proper tool on your own machine beats anything in a browser tab.

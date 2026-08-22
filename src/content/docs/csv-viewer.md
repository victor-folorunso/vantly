---
updated: "2026-08-22"
title: How do you open a CSV that Excel won't handle?
description: Large files open here without waiting, and nothing gets silently reformatted. What Excel changes about your data, and how to read a file with the wrong separator.
keywords: [csv viewer, open large csv, excel ruins csv, view csv online]
---

Drop the file in and it opens. There's no row limit imposed here, and nothing
is uploaded, so the constraint is your own machine rather than a server or a
spreadsheet's maximum.

Excel's own limit is 1,048,576 rows, and files well below that become slow long
before they become impossible.

## What Excel does to a CSV that this doesn't

This is the more important reason to look at a CSV somewhere else first. Excel
interprets values as it opens them, and several of those interpretations are
destructive.

**Long numbers become scientific notation.** A 16-digit account reference
displays as 1.23457E+15, and if the file is saved from that state, the digits
are genuinely gone.

**Leading zeros disappear.** A postcode or product code of `01234` becomes
`1234`.

**Things that look like dates become dates.** The classic case is gene names in
biology, where `SEPT2` becomes a September date, which was widespread enough
that the naming committee renamed the genes. Version numbers and part codes hit
the same problem.

**Long identifiers lose precision.** Anything past 15 significant digits is
rounded, silently.

None of that happens here, because nothing is interpreted. The file is shown as
it is.

That makes this a good first stop when you've been sent a CSV and need to know
what's actually in it before a spreadsheet has an opinion about it.

## When the columns come out wrong

Almost always the separator.

The C in CSV means comma, and plenty of files use something else. Semicolons
are standard across much of Europe, because those locales use a comma as the
decimal point and a file can't use it for both. Tabs are common in exports from
databases.

If your data appears in one long column, the separator is wrong. If it's split
in odd places, the file may be using a separator that also appears inside the
values.

The separator is detected from the file here and shown in the header, so you
can see what it decided.

## Quotes and the fields that contain commas

A value containing the separator has to be quoted: `"Smith, John"` is one
field, not two. A quote inside a quoted field is doubled: `"She said ""hello"""`.

Files that don't follow that convention are broken, and every reader will
disagree about what they mean. If a row has more fields than the header, an
unquoted separator inside a value is the usual cause.

## Encoding, and the odd characters at the start

If the first heading begins with `ï»¿`, the file has a byte order mark and
whatever opened it read it as the wrong encoding. If accented characters look
like `Ã©` instead of `é`, a UTF-8 file has been read as Latin-1.

Both are display problems rather than damage, and both are fixed by opening the
file as UTF-8. Excel is the usual culprit on Windows, and its import dialogue
lets you set the encoding explicitly.

## Very large files

The whole file is read into memory, so a very large one can be slow or can fail
where a smaller one succeeds. Several hundred megabytes is where a browser tab
starts to struggle.

For files beyond that, command line tools are the honest answer. `head`,
`wc -l` and `csvkit` will tell you what you need to know without loading
everything.

## Turning it into something else

[Converting to JSON](/csv-to-json) keeps numbers as numbers and turns empty
cells into null, which is what most code expects.

For anything going back into a spreadsheet, keep it as CSV and import rather
than opening. Excel's import path lets you mark a column as text, which
prevents every one of the problems above.

Nothing is uploaded. The file is read in your browser, which matters here
because CSVs tend to hold exports of exactly the data nobody wants on a server.

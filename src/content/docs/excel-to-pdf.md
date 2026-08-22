---
updated: "2026-08-22"
title: Why does my spreadsheet split across pages when I convert it?
description: Because a sheet has no page size and a PDF does. Set the print area and orientation in the spreadsheet first, since a converter can only follow what's already there.
keywords: [excel to pdf, spreadsheet to pdf, xlsx to pdf, excel columns cut off]
---

Because a spreadsheet doesn't have pages. It's a grid that extends as far as
your data goes, and a PDF is a stack of fixed rectangles, so something has to
decide where to cut.

That decision is made by the print settings inside the file, not by the
converter. If a spreadsheet has never been set up for printing, the split
happens wherever the default paper size runs out, which is usually four columns
in and halfway through the table.

## Fix it in the spreadsheet, not afterwards

Everything below is set in Excel, LibreOffice or Sheets before converting. A
converter follows the file's own print setup, so this is where the control is.

**Set the print area.** Without one, everything gets included, including the
stray value somebody typed in cell BX400 years ago, which quietly makes the
document four hundred pages of empty grid.

**Choose landscape** for anything wider than about six columns. It's the single
most effective change.

**Fit to width.** Set the scaling to one page wide by however many tall. That
stops columns spilling onto their own sheets, which is the failure that makes a
printed spreadsheet unreadable.

**Repeat the header row** on every page. Page four of a table with no column
headings is a page of anonymous numbers.

## What comes across

Every sheet in the workbook, in order, laid out as it would print. Formatting,
borders, cell colours, merged cells, number formats and conditional formatting
all survive.

Charts and images come across as they appear on the sheet.

**Formulas do not.** A PDF holds the results, not the calculations. That's
usually the point, and it's worth knowing if you expected the recipient to see
how a figure was reached.

**Comments and notes** don't appear unless the print settings say to include
them.

**Hidden rows, columns and sheets** stay hidden, which is worth checking before
sending anything to somebody outside your organisation. Hidden is not the same
as removed, and the underlying data is still in the source file even though it
isn't in the PDF.

## Very wide tables

Some tables genuinely don't fit on a page in any orientation. Thirty columns of
data is a screen object, not a paper one.

Options, in order of how well they usually work: split the table across several
sheets by topic, print a summary rather than the raw data, or send the
spreadsheet itself and let the recipient look at it in something built for
grids.

Shrinking to fit is the tempting one and produces four point text nobody reads.

## Page numbers, headers and dates

These come from the spreadsheet's header and footer settings. A document going
to anyone else benefits from a page number and a date, and neither appears
unless it's set there first.

## The conversion happens on a server

This is one of a handful of tools here that uploads your file. Nothing in a
browser reads the spreadsheet formats faithfully, so the file goes to a server
running LibreOffice and comes back as a PDF, converted and discarded rather
than stored.

Every other tool on this site works in your browser. This one can't, and for a
spreadsheet holding salaries, client lists or anything commercially sensitive,
that's worth a thought before uploading. Converting locally in Excel, which has
a perfectly good export, is the better route for anything confidential.

## Checking the result

Open it and look at the last page. Stray data in a far-off cell shows up there,
as pages of empty grid, and it's the commonest reason a small spreadsheet
becomes an enormous PDF.

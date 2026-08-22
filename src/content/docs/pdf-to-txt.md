---
updated: "2026-08-22"
title: Why does the text come out with no line breaks, or not at all?
description: A PDF stores positioned fragments rather than paragraphs, so line breaks are guessed. And a scan has no text in it at all, which needs recognition instead.
keywords: [pdf to text, extract text from pdf, copy text from pdf, pdf text garbled]
---

Two different problems with the same symptom, and it's worth knowing which one
you have.

If you get nothing at all, the PDF is a scan. It's pictures of pages, and there
is no text inside it to extract. That needs [recognition](/pdf-ocr), which is a
different job.

If you get text but the line breaks are wrong, that's normal and it's a
consequence of how PDFs store things.

## A PDF has no paragraphs

It stores text as positioned fragments: this string of characters, at these
coordinates, in this font. There's no structure saying which fragments form a
sentence, or where one paragraph ends and another begins.

So extraction reads the fragments and infers the layout from the coordinates. A
noticeable vertical gap probably means a new paragraph. Fragments on the same
line probably belong together. Usually right, sometimes not.

That's why extracted text often has line breaks at the end of every visual line
rather than every paragraph. The tool can see where a line ended on the page;
it can't always tell whether the sentence continued.

If you get one break per line, [removing the empty lines](/remove-empty-lines)
or joining them in an editor is the quickest fix.

## Columns come out interleaved

The commonest disappointment. A two column page reads across, so you get a line
from the left column, then a line from the right, alternating down the page.

There's no reliable general fix, because working out that a page has columns
means understanding the layout rather than reading it. For a page that matters,
extracting each column separately is the practical answer.

Academic papers, newspapers and annual reports are all affected.

## Other things that come out oddly

**Tables** lose their structure and become rows of words with the column
relationship gone.

**Ligatures.** Some fonts store `fi` and `fl` as a single character, and if the
PDF doesn't include the mapping back to plain letters, `find` comes out as
`nd` or with an odd symbol.

**Hyphenation.** A word broken across two lines stays broken, so you get
`inter-` and `national` separately.

**Headers and footers** appear on every page, in the middle of the flow, since
they were on the page and extraction reads the page.

**Reading order** follows the order the text was written into the file, which
is usually but not always the order it appears on the page. Documents produced
by unusual software can come out shuffled.

## Telling a scan from a real document

Open it in any reader and try to select a line of text. If a selection
highlight appears, there's text in there. If your cursor draws a box instead,
it's a picture.

Searching is the other test. If Ctrl+F finds a word you can plainly see, the
text exists.

Some PDFs are both: a scan with recognised text stored invisibly behind the
image. Those extract fine, and the quality depends entirely on how good the
original recognition was.

## When you need the layout as well

If you want the words *and* the arrangement, plain text is the wrong target.
Converting to a Word document keeps some structure, though it produces loose
text boxes rather than a properly flowing document, which is why this site
doesn't offer that conversion. Nothing browser-based does it well.

For quoting, searching or feeding text into something else, plain text is
exactly right and this is the fastest route to it.

## Nothing is uploaded

The extraction happens in your browser. That matters here more than on most
tools, because the PDFs people pull text out of are contracts, statements,
reports and academic papers, and plenty of them aren't meant to leave the
machine they're on.

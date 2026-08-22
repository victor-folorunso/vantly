---
updated: "2026-08-22"
title: How do you get plain text out of HTML?
description: Paste the markup and the text comes out. What happens to line breaks, why script contents must go, and when a regex is the wrong way to do this.
keywords: [strip html tags, html to plain text, remove html tags, extract text from html]
---

Paste the markup and what's left is the readable text. Tags go, the words
between them stay, and the entities become the characters they stand for, so
`&amp;` comes back as `&` and `&nbsp;` as a space.

## Where the line breaks go

HTML has no line breaks in the sense plain text does. Whitespace in the source
is collapsed by the browser, and the visual layout comes from the elements
rather than from the file.

So stripping tags has to decide. A run of paragraphs with no separation
between them is one wall of text and nearly useless.

Block elements produce breaks: paragraphs, headings, list items, `div`, `br`,
table rows. Inline elements don't: `span`, `a`, `strong`, `em`. That gives text
whose shape matches how the page read, which is almost always what you wanted.

## What gets removed entirely

**Script and style contents.** These sit between tags, so a naive strip leaves
you with a page of JavaScript and CSS rules mixed into the prose. Their
contents go, not just their tags.

**Comments**, which often carry template remnants and editor notes.

**Hidden elements** stay, because "hidden" is usually a CSS decision and the
markup alone can't always tell.

## Why a regular expression is the wrong tool

The classic approach is to match `<[^>]*>` and delete it. It works on tidy
examples and fails on real pages:

- An attribute containing a `>` character, which is legal
- A comment containing something that looks like a tag
- Unclosed tags, which browsers handle and a pattern doesn't
- Script contents, which contain `<` and `>` in ordinary code

HTML nesting is unbounded and a regular expression cannot count. Parsing the
markup properly, which is what happens here, gets all of these right without
special cases.

That's a general point worth carrying: for HTML, JSON, XML and dates, the
parser exists and beats a pattern every time.

## What you lose

Everything that wasn't words. Formatting, links, images, tables as tables. A
link's text survives and its address doesn't, which surprises people extracting
a page of references.

If you need the addresses, they're in the markup and a different job.

Tables are the biggest loss. The cells come out in reading order with the
column relationship gone, and there's no general way to preserve it in plain
text.

## Common reasons to do this

Pasting web content into a plain text field without the formatting following
it. Getting a word count that isn't inflated by markup. Cleaning content copied
out of a CMS. Reading an HTML email whose layout makes it hard to follow.

The other frequent one is cleaning text pasted from a word processor into a
CMS, where the paste carries a large amount of invisible markup that then
fights the site's own styles.

## Afterwards

Text stripped from a page often carries blank lines from the layout.
[Removing the empty lines](/remove-empty-lines) tidies that in one pass, and
[counting the words](/word-counter) on the result gives a figure that isn't
inflated by tags.

Everything happens as you type, in your browser. Nothing is uploaded, which
matters when the markup came from an internal system or an email.

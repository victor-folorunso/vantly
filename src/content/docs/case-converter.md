---
updated: "2026-08-22"
title: What are camelCase, snake_case and kebab-case for?
description: Each convention belongs somewhere specific, and mixing them is how a codebase gets confusing. Which to use where, plus what title case actually capitalises.
keywords: [case converter, camelcase, snake case, kebab case, title case rules]
---

They're conventions rather than rules, but each one has become standard in a
particular place, and following the local convention is worth more than
preferring one personally.

`camelCase` for variables in JavaScript, Java and C#. `snake_case` for Python
and for database columns. `kebab-case` for URLs, CSS class names and HTML
attributes. `PascalCase` for class and component names in most languages.
`SCREAMING_SNAKE_CASE` for constants and environment variables.

## Why kebab-case for URLs

Search engines treat hyphens as word separators and underscores as joiners, so
`blue-suede-shoes` reads as three words and `blue_suede_shoes` reads as one.
That's a real difference for anything you want found.

URLs are also often case-insensitive on the server and case-sensitive
elsewhere, which is a reliable source of broken links. Lowercase with hyphens
avoids both problems, which is why slugs look the way they
do.

## Why snake_case for databases

Most SQL databases fold unquoted identifiers to one case. PostgreSQL lowercases
them, so a column created as `firstName` becomes `firstname`, and every query
referring to `firstName` works by accident until someone quotes it and it
doesn't.

Using `first_name` sidesteps the whole issue, which is why it's near-universal
in database schemas even in projects whose application code is camelCase.

## Title case is not just capitalising everything

The convention most style guides follow: capitalise the first word, the last
word, and everything in between except articles (`a`, `an`, `the`), short
prepositions (`in`, `on`, `of`, `to`, `for`) and coordinating conjunctions
(`and`, `but`, `or`, `nor`).

So it's "The Man in the High Castle", not "The Man In The High Castle".

Guides disagree on the details, particularly on how long a preposition can be
before it gets capitalised, with three, four and five letters all having
adherents. Automatic title case gets the common cases right and can't know
whether "Turn On" is a phrasal verb needing the capital.

Check anything going on a cover or a title page by eye.

## Sentence case is usually better for headings

Most modern style guides prefer sentence case for headings on the web: capital
on the first word and on proper nouns only.

It's easier to read at a glance, it avoids the title case arguments entirely,
and it looks less shouty. If you're writing documentation or a product
interface, sentence case is the safer default.

## What breaks when converting

**Acronyms.** `parseHTMLDocument` in snake_case should probably be
`parse_html_document`, and a naive conversion produces `parse_h_t_m_l_document`.
Handling this properly means knowing that HTML is an acronym, which no
converter can do reliably.

**Numbers.** Whether `address2` becomes `address_2` or `address2` depends on
what the number means, and both conventions exist.

**Names and trademarks.** `iPhone`, `eBay`, `McDonald` and `van der Berg` all
have capitalisation that isn't algorithmic. Any bulk conversion will damage
them.

**Non-English text.** German nouns are always capitalised. Turkish has a
dotless `ı` whose uppercase is `I` while `i` uppercases to `İ`, which has
caused real bugs in software that lowercases identifiers.

Check the output when the input contained any of these.

## Converting a whole codebase

Don't do it with a text tool. Use your editor's rename feature or a language-
aware refactoring tool, which knows which occurrences are the same symbol.

Find and replace across files will change strings, comments and unrelated
identifiers that happen to share a name, and the result compiles while doing
something slightly different.

## Where this tool is genuinely useful

One-off conversions. Turning a heading into a slug, a label into a variable
name, a spreadsheet column into a database column, or a list of names into a
consistent format.

Everything happens as you type, in your browser. Nothing is sent anywhere.

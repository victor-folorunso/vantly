---
updated: "2026-08-22"
title: Why does my regex match more than I expected?
description: Usually greedy quantifiers taking everything up to the last match instead of the first. How to make them lazy, and the patterns that hang the browser.
keywords: [regex tester, regular expression, greedy vs lazy regex, regex not matching]
---

Usually because quantifiers are greedy by default. `.*` takes as much as it
possibly can and only gives characters back when the rest of the pattern fails,
so a pattern meant to grab one tag grabs everything from the first tag to the
last.

Against `<b>one</b> and <b>two</b>`, the pattern `<b>.*</b>` matches the whole
string, not `<b>one</b>`. Adding a `?` makes the quantifier lazy: `<b>.*?</b>`
stops at the first closing tag.

That single character is the answer to a large share of "why did it match
that".

## The pieces worth knowing

`.` any character except a newline. `\d` a digit, `\w` a letter, digit or
underscore, `\s` whitespace. Capitalise any of those to invert it: `\D` is
anything that isn't a digit.

`*` zero or more, `+` one or more, `?` zero or one, `{2,5}` between two and
five.

`^` start of the string, `$` end. `\b` a word boundary, which is the one that
stops `cat` matching inside `concatenate`.

`(...)` captures a group, `(?:...)` groups without capturing, `[abc]` any one
of those characters, `[^abc]` any character that isn't.

## Flags change everything

**`g` global.** Without it you get the first match only. Most "it only found
one" questions are this.

**`i` case insensitive.**

**`m` multiline**, which makes `^` and `$` match at each line rather than only
at the start and end of the whole string. Worth having whenever you're working
line by line.

**`s` dotall**, which lets `.` match newlines too. Without it, a pattern
spanning lines silently fails.

## Patterns that hang the browser

Some regexes take exponential time on inputs that don't match. `(a+)+$` against
a long run of `a` followed by anything else will try every possible split
before giving up, and the number of splits doubles with each character.

The shape to watch for is a repeated group that itself contains a repetition:
`(x+)+`, `(x*)*`, `(a|a)*`. If your pattern has one and your input is
attacker-controlled, that's a denial of service waiting to happen, and it has
taken down real services.

Testing against a long non-matching string is the quickest way to find out.

## Where regex is the wrong tool

**HTML.** Nesting is unbounded, and a regular expression cannot count. Use a
parser. It'll work on your examples and fail on the real page, which is the
worst failure mode.

**Email addresses.** The specification permits far more than people expect, and
the fully correct pattern is thousands of characters. Check for an `@` with
something either side, then send a confirmation email. That's the only real
validation anyway.

**Dates and JSON.** Both have proper parsers that handle the edge cases a
pattern will miss.

Regex is excellent at finding known shapes in flat text: log lines, phone
number formats, code references, anything with a consistent layout.

## Escaping

These are special and need a backslash to match literally: `. * + ? ^ $ { } (
) | [ ] \ /`

A dot is the commonest miss. `3.14` matches `3x14`, because the dot matches any
character. `3\.14` is what you meant.

Inside a character class, most of these lose their special meaning, so `[.]` is
just a dot.

## Named groups

`(?<year>\d{4})` captures into a name rather than a number. It costs a few
characters and makes a pattern readable a year later, when `match[3]` means
nothing to anyone.

Supported everywhere current, including every browser.

## Different flavours

The pattern here runs in JavaScript's engine, which is what the browser uses.
Python, PCRE, Go and the various shell tools differ in lookbehind support,
Unicode handling and a few shorthands.

A pattern that works here will usually work elsewhere, and "usually" is the
operative word. Test it where it will actually run before relying on it.

Everything is evaluated in your browser, so both the pattern and the text stay
on your machine. That matters when the text is a log file.

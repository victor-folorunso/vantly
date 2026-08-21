---
updated: "2026-08-21"
title: Why is my JSON invalid?
description: Trailing commas, single quotes and comments are the usual three. What the line and column number is telling you, and how to read it.
keywords: [json formatter, json validator, invalid json, json syntax error]
---

Three mistakes cause most of it: a trailing comma after the last item, single
quotes instead of double, and comments. All three are legal in JavaScript and
none are legal in JSON, which is why they slip through so often.

The error tells you a line and a column. That's where the parser gave up, which
is usually a character or two after where the mistake is.

## The trailing comma

```
{ "name": "vantly", "live": true, }
```

The comma after `true` says another item is coming and none is. JavaScript
forgives this. JSON doesn't, and neither does any parser that follows the spec.

Same rule in arrays: `[1, 2, 3,]` is invalid.

This is the most common error by a wide margin, and it usually appears after
somebody deletes the last entry of a list and leaves the comma above it.

## Quotes

Keys and string values both need double quotes. Not single, not backticks, and
keys are not optional.

```
{ name: 'vantly' }      invalid, twice over
{ "name": "vantly" }    valid
```

An unescaped double quote inside a string breaks it too. A Windows file path is
the classic: `"C:\Users\me"` is invalid because `\U` isn't a recognised escape.
It has to be `"C:\\Users\\me"`.

## Comments

JSON has none. Not `//` and not `/* */`. If you need a note in a config file,
the usual workaround is a key nobody reads, like `"_comment": "..."`.

Some tools accept comments anyway, which makes this worse rather than better,
because a file that works in one place fails in another.

## Reading the position

The line and column point at the first character the parser couldn't accept,
which is often after the real problem.

A missing comma between two objects reports at the start of the second object,
not at the end of the first. An unclosed brace reports at the very end of the
file, because that's where the parser finally runs out of input.

So when the error points at something that looks fine, look upwards. The
mistake is almost always above the reported position.

## Numbers and the things that aren't allowed

- No leading zeros. `007` is invalid, `7` is fine.
- No `+` on a positive number.
- No `.5`. It has to be `0.5`.
- No `NaN` and no `Infinity`. There's no way to express either in JSON, which
  catches people converting from a language that has them.
- `undefined` isn't a value. `null` is.

Large integers are the subtle one. JSON has no limit on the size of a number,
but JavaScript parses everything into a double, so anything beyond about 9
quadrillion loses precision silently. Database IDs and Twitter-style snowflake
IDs hit this, which is why APIs often send them as strings.

## Formatting and minifying

Formatting adds the indentation back so you can read the structure. Minifying
strips every space that isn't inside a string.

Minified JSON is what you send over a network, and the saving is real on a large
payload. It's also the reason a response looks like one enormous line when you
open it in a browser, which is what most people come here to undo.

Neither changes the data. Formatting and minifying are the same JSON either way,
which is worth knowing if you're comparing two files: [compare them
formatted](/diff-checker), or the diff is meaningless.

## Key order

JSON objects have no defined order. Most parsers preserve the order they read,
and formatting here preserves it too, but nothing in the spec requires it.

If two systems disagree about the order of your keys, neither is wrong. Don't
build anything that depends on it.

## What validation can't tell you

That the JSON is valid says nothing about whether it's the right shape. A parser
will happily accept `{"prot": 8080}` when the program expects `port`, because a
typo in a key is perfectly good JSON.

Checking the shape needs a schema, which is a separate thing and a bigger
subject. This tells you whether it parses, which is the first question and not
the last one.

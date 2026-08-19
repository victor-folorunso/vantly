# Writing for /learn

Everything in this folder becomes a page at `vantly.xyz/learn/<slug>`. One file,
one article, one question a real person types into a search box.

Read this whole file before writing. `npm run learn:check` enforces the parts
that can be enforced; the rest is voice, and voice is why most of these fail.

---

## The frontmatter contract

```yaml
---
# ── LOCKED. Do not invent or change these. ────────────────────────────────
slug: what-is-a-heic-file      # must equal the filename without .md
tool: heic-to-jpg              # must be a real slug from src/lib/site.ts
updated: 2026-08-15            # ISO date, the day the body last changed

# ── EDITABLE. This is your job. ───────────────────────────────────────────
title: What is a HEIC file, and why will it not open?
description: One or two sentences, under 160 characters, written for a search result.
keywords: [heic, heic file, iphone photo format]
---
```

**Locked fields** decide routing and which tool the article links to. Getting one
wrong either 404s the page or points the reader at the wrong tool, and the build
will refuse it.

There is one more, and it decides whether the article exists yet:

```yaml
draft: true
```

A draft is not built, not linked, not in the sitemap and not indexed. Nine
stubs in this folder are drafts waiting to be written. **Delete that line when
the article is finished**, and it goes live on the next build.

While it is a draft, `npm run learn:check` only checks the frontmatter. Once the
line is gone, the length, link and em dash rules all apply.

**Editable fields** are yours entirely.

- `title` is the `<h1>` and the search result headline. Write the question the
  reader actually typed. Under 60 characters if you can.
- `description` is the snippet under it. Under 160 characters. Say what the
  answer is, not what the article "covers".
- `keywords` is 2 to 5 phrases. Not a spam list.

**Everything below the frontmatter is yours.** Write the article.

---

## What an article is for

Someone has a problem and does not yet know a tool exists. They search a
question. This page answers it, and mentions the tool once, where it is
genuinely the answer.

It is not a product page. If it reads like an advert, it will not rank and it
will not be read.

## Shape

- **800 to 1,500 words.** Under 800 is usually thin. Over 1,500 is usually
  padding.
- **Answer in the first paragraph.** Do not build up to it. Someone who leaves
  after two sentences should already have what they came for.
- `##` for sections, `###` sparingly. Never skip a level.
- Short paragraphs. Two to four sentences.
- Tables and lists where the content is genuinely a table or a list, not to
  break up prose.

## Voice

This is where drafts go wrong, so it is specific.

**Do:**

- Use contractions. "doesn't", "you're", "it's".
- Plain words. "use" not "utilise", "bit" not "aspect", "about" not
  "approximately".
- Short sentences. Fragments are fine.
- Say the awkward thing. If the tool cannot do something, write that down. It
  builds more trust than any claim.
- Concrete numbers. "about 45MB" beats "lightweight".

**Do not:**

- **No em dashes.** Not one. Use a comma, a full stop, or brackets.
- No tricolons. "Not this. Not that. Just this." is banned.
- No sentence that exists to sound final. If a line adds no fact and just lands
  a verdict, cut it.
- No "in today's digital landscape", "unlock", "seamless", "leverage",
  "game changer", "dive into", "it's important to note".
- No adjective where a number would do.
- Do not open with a definition of a word everybody knows.

**The test:** read it aloud. If it sounds like something a person would say,
ship it. If it sounds like something written to be read, loosen it.

## Linking

- Link the tool **once**, naturally, at the point it solves the problem. Use a
  root relative path: `[convert them here](/heic-to-jpg)`.
- Link 1 to 3 other articles in this folder where genuinely relevant.
- External links are fine and good when citing a fact. Prefer primary sources.

## Accuracy

Every factual claim has to be true on the day you write it. If you are unsure,
either check it or leave it out. A wrong technical detail on a page aimed at
technical people costs more than the traffic it earns.

Claims about what Vantly does must match what the tool actually does today. Do
not promise a feature because it seems likely. In particular, **do not write
that files are never uploaded** unless you have confirmed that tool runs in the
browser: some future tools will need a server, and a retracted promise is worse
than one never made.

---

## Before you finish

```bash
npm run learn:check
```

To start a new article rather than filling an existing stub:

```bash
npm run learn:new <slug> <tool-slug> "Title as a question"
```

That writes the locked fields for you, which is the point: a slug that does not
match its filename makes a page nobody can reach, and a bad tool reference
points the reader at the wrong tool. Neither one errors at runtime.

It verifies the filename matches `slug`, that `tool` exists, that dates parse,
that required fields are present, and that no em dash slipped in. It does not
check whether the writing is any good. That is on you.

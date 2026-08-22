# Writing the docs

One file per tool. The filename **is** the tool slug, and that is the whole
routing contract: `image-compressor.md` renders on `vantly.xyz/image-compressor`,
below the tool itself, under a heading that says Docs.

There are no separate article URLs. The doc and the tool share one page,
because a new site has no authority to spend and splitting it across two weak
pages helps neither. `/learn` lists every doc and links back here.

Read this whole file before writing. `npm run docs:check` enforces what can be
enforced. The rest is voice, and voice is why most drafts fail.

---

## Frontmatter

```yaml
---
# LOCKED. The filename decides which tool this belongs to. Renaming the file
# moves the doc; getting the name wrong means it renders nowhere.
updated: "2026-08-19"          # quoted, or YAML turns it into a Date object

# EDITABLE. Yours.
title: What is a HEIC file, and why will it not open?
description: One or two sentences under 160 characters, written for a search result.
keywords: [heic, heic file, open heic on windows]

# Remove this line when the doc is written. Drafts never reach a page.
draft: true
---
```

- `title` is the heading on the page. Write the question somebody actually
  typed, not a label. "What is a HEIC file" beats "About HEIC".
- `description` is the sentence under it. Say what the answer is, not what the
  doc "covers".
- `keywords` is 2 to 5 real phrases.

Everything below the frontmatter is the doc. Write it.

---

## Pick the tool from the folder, not from memory

```bash
npm run docs:gaps
```

Lists every live tool with no doc, grouped by category. Add `--have` to see
what already exists.

Do this first, every time. Writing a doc for a tool that already has one
overwrites it in place: the build stays green, the checker still passes, and
the only sign is the published count going up by less than you wrote. That has
already happened once and cost three finished docs, which were only recovered
because they had been committed.

## What a doc is for

Somebody arrived for the tool. They used it, or they are deciding whether to,
and now they have a question the interface cannot answer. Which format should I
pick. Why did the file get bigger. What did I just lose.

It is not a product page and not an advert. It sits at the bottom of a page
whose top already sold the tool.

## Shape

- **600 to 1,200 words.** Under 400 fails the build.
- **Answer in the first paragraph.** Someone who reads two sentences and leaves
  should already have what they came for.
- `##` for sections. `###` sparingly, and never skip a level. There is already
  an `h2` above you, so start at `##`.
- Short paragraphs, two to four sentences.
- Tables and lists only where the content genuinely is one.

## Voice

**Do:**

- Contractions. "doesn't", "you're", "it's".
- Plain words. "use" not "utilise", "about" not "approximately".
- Short sentences. Fragments are fine.
- Say the awkward thing. If the tool cannot do something, write it down. That
  earns more trust than any claim.
- Concrete numbers. "about 45MB" beats "lightweight".

**Do not:**

- **No em dashes.** Not one. The build rejects them.
- No tricolons. "Not this. Not that. Just this."
- No sentence that exists only to sound final.
- No "in today's digital landscape", "unlock", "seamless", "leverage",
  "dive into", "it's important to note".
- No adjective where a number would do.
- Do not open by defining a word everybody knows.

**The test:** read it aloud. If it sounds like something a person would say,
ship it.

## Linking

- Do **not** link the tool. The reader is already on its page, and the tool is
  a few hundred pixels above.
- Link other tools by root relative path where genuinely useful:
  `[resize it first](/image-resizer)`.
- External links are good when citing a fact. Prefer primary sources.

## Accuracy

Every claim has to be true on the day you write it. If you are unsure, check it
or leave it out.

Claims about what Vantly does must match what the tool does today. In
particular, **do not write that files are never uploaded** unless you have
confirmed that tool runs in the browser. Some future tools will need a server,
and a promise you have to retract is worse than one never made.

---

## Before you finish

```bash
npm run docs:check
```

It verifies the filename is a real live tool slug, that the required fields are
present, that the date parses, that the description fits, that the doc is long
enough, and that no em dash slipped in. It cannot tell you whether the writing
is any good.

## Which tools still need one

Anything in `src/lib/site.ts` marked `live: true` with no matching file here.
Not every tool needs a doc: nobody searches a question behind a UUID generator.
Write one where a person genuinely has a question the interface cannot answer.

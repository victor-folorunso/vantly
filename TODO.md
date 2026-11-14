# Outstanding

Kept here rather than in my head, because this list has outlived several
sessions already.

## Done since this list was written

- Settings rails: every tool with settings now uses `ToolLayout`. Sign PDF
  was the last one, moved on 2026-11-07.
- ImageStudio uses `ToolLayout` rather than its own copy.
- Content security policy: `public/_headers`.
- Tool page headings: one `ToolHeader`, with the category above the title,
  on 121 pages since 2026-11-07.
- Every unfinished tool that can run in the browser is finished, the last
  being the PDF annotator, Edit PDF and Scan to PDF on 2026-11-09.

## 1. Docs

69 written, against 204 live tools.

`src/content/docs/_owed.md` holds the explanations stripped out of the tool
interfaces, listed against the tool each came from. Those are facts already
established as worth saying, so they are the cheapest docs to write next.

## 2. Lint

`npx eslint src` reports 41 problems, all older than 2026-11-07: 21
`react-hooks/set-state-in-effect`, 8 `react-hooks/refs`, 7 unused variables
and a handful of single ones. The build does not run lint, so nothing fails
on them, which is how they piled up.

## 3. Two tools built and waiting on a deploy, and one left out

PDF to PDF/A and Pages to PDF are finished on the site and in
`server/convert.py`, but stay `live: false` until the conversion service is
redeployed (`modal deploy server/convert.py`), since the live service does
not know `to=pdfa` or `.pages` yet. After the deploy, flip both to
`live: true` in `src/lib/site.ts` and push.

- PDF/A: Ghostscript with an sRGB output intent. veraPDF passed its output
  at 1b, 2b and 3b, including a file with transparency.
- Pages: the exact PDF a Pages '09 file carries is used when present (in the
  browser, without uploading); otherwise LibreOffice's libetonyek filter.
  That second path has not been tried on a real Pages file yet.
- `pdf-to-html`: left out on purpose (it is in `NEVER`).

## 4. Edit PDF limits worth knowing

Changed text is covered and rewritten in Helvetica, Times or Courier, and
only in Western European letters (WinAnsi). Embedding a Unicode font such as
Noto Sans through fontkit would lift the second limit.

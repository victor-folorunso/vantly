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

## 3. The three tools still marked not live

- `pdf-to-pdfa`: PDF/A needs embedded fonts, an ICC output intent and
  XMP metadata, and checking the result needs veraPDF. That is server work.
- `pages-to-pdf`: Apple Pages files only open in Pages, or through a
  LibreOffice import filter that has to run on the server.
- `pdf-to-html`: left out on purpose (it is in `NEVER`).

## 4. Edit PDF limits worth knowing

Changed text is covered and rewritten in Helvetica, Times or Courier, and
only in Western European letters (WinAnsi). Embedding a Unicode font such as
Noto Sans through fontkit would lift the second limit.

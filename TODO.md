# Outstanding

Kept here rather than in my head, because this list has outlived several
sessions already.

## Done since this list was written

- Settings rails: every tool with settings now uses `ToolLayout`. Sign PDF
  was the last one, moved on 2026-11-07.
- ImageStudio uses `ToolLayout` rather than its own copy.
- Content security policy: `public/_headers`.

## 1. Docs

66 written, against roughly 200 built tools.

`src/content/docs/_owed.md` holds the explanations stripped out of the tool
interfaces, listed against the tool each came from. Those are facts already
established as worth saying, so they are the cheapest docs to write next.

## 2. Lint

`npx eslint src` reports 41 problems, all older than 2026-11-07: 21
`react-hooks/set-state-in-effect`, 8 `react-hooks/refs`, 7 unused variables
and a handful of single ones. The build does not run lint, so nothing fails
on them, which is how they piled up.

## 3. Tool page headings

Every tool page writes its own h1 block, so a change to how tool pages open
(a category label above the title, say) is a hundred-file edit. Worth a
shared `ToolHeader` before the next design pass.

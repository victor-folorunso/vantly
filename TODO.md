# Outstanding

Kept here rather than in my head, because this list has outlived several
sessions already.

## 1. Finish the settings rails

Ten tools still keep their settings somewhere other than the left rail:

- The PDF set: compress, form, edit, pages, sign
- MediaConvert, Calculators, UnitConverter, WebTools
- CsvTools and DataConvert
- PaletteTool, which changes shape between its two modes and needs both
  branches rewritten, the way the date calculator did

Tools with no settings keep their single column. A 300px empty card is worse
than no card.

## 2. Fold ImageStudio onto ToolLayout

It has the right shape, from the first prototype, but carries its own copy of
the layout rather than using the shared one. Two definitions that agree today
are two definitions that disagree later.

## 3. A content security policy

The site has none. It is a static site that handles people's documents, and a
policy is the cheapest hardening available.

Two things to get right when adding it. WebAssembly tools need
`wasm-unsafe-eval` in `script-src`. Terser and Tesseract genuinely use `eval`,
so the three pages that load them, the JavaScript minifier and the two OCR
tools, need it relaxed for those paths only rather than site wide.

Goes in a Cloudflare `_headers` file.

## 4. Docs

28 written, against roughly 200 built tools.

`src/content/docs/_owed.md` holds the explanations stripped out of the tool
interfaces, listed against the tool each came from. Those are facts already
established as worth saying, so they are the cheapest docs to write next.

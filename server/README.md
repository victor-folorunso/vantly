# The conversion service

One container with LibreOffice in it, on Modal, exposed as an HTTP endpoint.
It converts anything LibreOffice understands into PDF, and the browser does
the rest, because the site already renders PDFs with pdf.js.

That is the whole trick. A PPTX viewer is this endpoint plus the PDF viewer
that already exists, and the same container covers the DOCX, XLSX and PPTX
viewers, Word to PDF, Excel to PDF, PowerPoint to PDF, EPUB to PDF and HTML to
PDF. About ten entries off the list from one install.

## Connecting to Modal, once

```bash
pip install modal
modal setup
```

`modal setup` opens a browser, you approve it, and it writes a token to
`~/.modal.toml`. That is the whole authentication step. Nothing to paste and no
key to keep anywhere.

## Deploying

```bash
modal deploy server/convert.py
```

It builds the image the first time, which takes several minutes because
LibreOffice is around 700MB, then prints a URL like:

```
https://<your-workspace>--vantly-convert-web.modal.run
```

Put that in the site:

```bash
# .env.local, and in the Cloudflare Pages environment variables
NEXT_PUBLIC_CONVERT_URL=https://<your-workspace>--vantly-convert-web.modal.run
```

Rebuilds after that are fast, since the image is cached and only the code
changes.

## Trying it before wiring anything up

```bash
curl -F "file=@deck.pptx" \
     "https://<your-workspace>--vantly-convert-web.modal.run/convert" \
     -o out.pdf
```

There is also `/health`, which returns `{"ok": true}` and is the quickest way
to tell whether the deploy worked.

## What it costs

Nothing while nobody calls it. Modal bills per second of actual execution and
the container scales to zero, so an idle endpoint is free.

A conversion uses 2 cores for a few seconds. At Modal's CPU rate that is
roughly **$0.0001 per conversion**, a hundredth of a penny. The $30 monthly
credit on the Starter plan covers a very large number of them.

The first request after an idle period pays a cold start of several seconds,
because the container has to come up. `scaledown_window=60` keeps it warm for a
minute afterwards, so somebody converting three files waits once rather than
three times.

## Things that were deliberate

**Fonts.** LibreOffice does not ship Microsoft's fonts. Without metric
compatible replacements a deck built in Calibri reflows, text overflows its
boxes, and non-Latin characters render as empty rectangles. `fonts-liberation`
covers Arial, Times and Courier at the same metrics; dejavu and noto cover
most of the rest. This is the commonest reason a conversion "works" and looks
wrong.

**A profile per conversion.** LibreOffice keeps a user profile directory, and
two requests inside one container will fight over it, with the second silently
producing nothing. Each conversion gets its own via `-env:UserInstallation`.

**Checking for the output file rather than the exit code.** LibreOffice exits 0
even when it converts nothing, so the exit code proves nothing. The output
file existing is the only reliable signal, and stderr is the only clue about
why it did not.

**CORS locked to the site.** An open endpoint is an invitation to run somebody
else's conversions on your credits. Add any new origin explicitly.

**A 40MB cap.** Covers essentially every real document, and a free endpoint
without a limit is a bill waiting to happen.

## What is not here yet, and needs to be before real traffic

There is no rate limiting and no authentication. Anyone who finds the URL can
call it, and CORS does not stop a script, only a browser on another origin.

That is fine while the site is quiet and is not fine once it is not. The fix is
either a shared token the site sends and the endpoint checks, or Cladior in
front of it, which is the point of Cladior: the tools that cost real money to
run are the ones worth charging a fraction of a penny for.

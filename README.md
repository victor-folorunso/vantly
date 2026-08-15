# Vantly

Small file tools that run in your browser. No account, no watermark, and no
export capped at a size that makes the result useless.

[vantly.xyz](https://vantly.xyz)

## Why it works this way

Most free converters cap something in a way that has nothing to do with what the
work costs. remove.bg hands you 612x408 pixels unless you pay. Others cap the
free tier at two files a day, or burn a watermark across the output.

Almost none of that is a technical limit. A browser can decode, scale and
re-encode an image on its own, using capabilities it already ships with, at a
cost to the operator of exactly zero. So the tools here run on your machine.
The file is never uploaded, which means there is no bandwidth bill, no storage
to pay for, no queue, and nothing for anybody to leak. That is the whole reason
there is no cap: there is no cost to recover.

The limits show up where the browser genuinely cannot do something, and those
are stated on the page rather than hidden behind a plan.

## Running it

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Static export into `out/` |
| `npm run status` | Rewrites `STATUS.md`, and fails if anything is marked live without a route |
| `npm run lint` | ESLint |

## How it is put together

Next.js App Router, TypeScript, Tailwind, and a **static export**. There is no
server, no database and no session. `npm run build` produces plain HTML, CSS and
JS that any host will serve.

That is enforced rather than incidental: `output: 'export'` means adding a route
handler or calling `cookies()` fails the build instead of quietly turning this
back into something that needs a runtime.

### Two lists drive almost everything

- **`src/lib/site.ts`** holds the tools, the ones that are not simply turning
  one format into another.
- **`src/lib/conversions.ts`** holds every format pair, generated from a small
  set of rules rather than typed out.

The home page, the search box, the footer, the sitemap and the routes themselves
all read from those two. Nothing is listed by hand in a second place, because a
hand maintained duplicate goes stale silently: a page ships, the sitemap never
learns about it, and nothing fails.

### Every conversion has its own address

`heic-to-jpg` and `heic-to-webp` are one converter underneath, but they are
different things to search for, and the page is the unit that ranks. So the
pairs are enumerated as real URLs rather than hidden behind a dropdown.

**Addresses exist before the code does.** An unbuilt pair is served by the
catch-all at `src/app/[slug]` with a page saying so, marked `noindex` so it
never ranks for something it cannot do. When it ships, the URL does not change,
because a page that moves after it has been linked to loses whatever it earned.

### Adding a conversion

Add the pair to `RULES` in `src/lib/conversions.ts`. That is the whole change:
it gets a URL, a page, a sitemap entry once live, footer links and a search
entry.

If a canvas can do it, it is already live. `canvasHandles()` decides that, and
`src/app/[slug]` renders the real tool instead of the coming soon page.

### Adding a tool

Add an entry to `TOOLS` in `src/lib/site.ts` with `live: false`. It gets an
address immediately. When you build it, create `src/app/<slug>/page.tsx` and
flip `live` to `true`.

Run `npm run status` afterwards. It fails if something is marked live with no
route, which is not hypothetical: `heic-to-webp` was flagged live, the converter
genuinely handled WebP, no route existed, and the URL served a 404 that nothing
complained about.

## What the browser will and will not do

Worth knowing before adding an image format, because the failure is silent.

Chromium **decodes** PNG, JPEG, WebP, AVIF, GIF and BMP. It **encodes** PNG,
JPEG and WebP only.

Asking `canvas.toBlob` for AVIF, BMP, GIF or TIFF does not fail. It returns a
**PNG**. Trusting the requested type would put PNG data inside a file named
`.avif`, which opens correctly everywhere and is wrong in a way nobody would
ever report. So encodable targets are listed explicitly in `CANVAS_TARGETS`, and
the blob's own `type` is checked after encoding. It refuses rather than
mislabels.

Anything outside that list needs a WebAssembly encoder, which is a real
download, so it is loaded only when somebody actually converts something. HEIC
already works this way: the decoder is about 2.9MB and is absent from every
page's initial load, so a visitor who arrives from a search result and reads
without converting anything never pays for it.

## Status

`STATUS.md` is generated, never edited. It reads the two lists, so it cannot
drift from what actually exists.

```bash
npm run status
```

## Licence

Not yet chosen.

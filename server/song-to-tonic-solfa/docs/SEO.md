# SEO plan

**2026-11-04: the website moved into Vantly** (vantly.xyz, repository `victor-folorunso/vantly`), at
`/song-to-tonic-solfa`. Vantly already had domain history and a live tonic solfa converter, and two sites competing for
the same searches would split them. The page table below is updated to the Vantly URLs.

## Keyword data (Google Trends, worldwide, 2025-10-19 to 2026-10-18)

Source: two Google Trends CSV exports provided by the product owner. Trends values are **relative interest, not
search volumes**, and each export is scaled to its own peak. "audio to sheet music" appears in both exports, so the
second export was rescaled to the first by the ratio of that term's averages (×1.24).

| Keyword | Avg. interest (common scale) | First 3 months → last 3 months | Fit |
|---|---|---|---|
| audio to midi | 57 | 52 → 38 | Large but wants MIDI files; one comparison page |
| solfege | 36 | 35 → 28 | Large; mostly ear training and fixed/movable do learners; one explainer page |
| music transcription | 35 | 24 → 17 | Broad, competitive; covered by the "audio to tonic solfa" page |
| sheet music software | 19 | 15 → 13 | Wrong output (staff notation); not targeted |
| **tonic solfa** | **12** | **11 → 9** | **Exact product match, steadiest trend; primary target** |
| audio to sheet music | 11 | 13 → 5 | Close intent; covered by "audio to tonic solfa" |
| ai music transcription | 8 | 7 → 3 | Covered by "audio to tonic solfa" |
| music transcription software | 3 | 2 → 1 | Covered by "audio to tonic solfa" |
| musical notation software | 0 | 0 → 0 | No measurable interest; dropped |

## Pages and the keywords they target

| Page (on vantly.xyz) | Primary keyword | Also covers |
|---|---|---|
| `/song-to-tonic-solfa` | tonic solfa | song to tonic solfa, tonic solfa for keyboard, audio to solfa |
| `/song-to-tonic-solfa#docs` (was `/audio-to-tonic-solfa`) | audio to sheet music | music transcription, ai music transcription |
| `/learn/how-to-read-tonic-solfa-on-keyboard` | tonic solfa | how to read tonic solfa, solfa on keyboard |
| `/learn/audio-to-midi-or-tonic-solfa` | audio to midi | |
| `/learn/solfege-and-tonic-solfa` | solfege | movable do, fixed do |
| `/tonic-solfa-converter` (Vantly's own) | tonic solfa converter | notes to solfa |

"Audio to tonic solfa" became the doc on the tool page rather than a page of its own: it answers the same search as
the tool, and Vantly keeps a tool and its explanation on one URL so they do not compete.

## What is in place

- Every public page is prerendered HTML with a unique title, meta description, canonical URL and Open Graph tags
  (Vantly's site-wide preview image; until 2026-11-05 `og:image` was missing on every page that set its own
  `openGraph`, about half of Vantly, these pages included).
- Each target keyword in the table appears in the page's own copy and its `keywords`, including "music
  transcription", "ai music transcription" (the tool's doc) and the unaccented "solfege" (the guide). The old SolfaFlow
  pages never used those phrases, despite this plan listing them.
- Sitemap URLs carry the trailing slash, matching each page's canonical, so none of them is a redirect.
- Structured data: `WebApplication` and `FAQPage` on the tool page (the FAQ text is the visible FAQ), `Article` for
  its doc, `Article` and `BreadcrumbList` on each guide.
- Vantly's sitemap lists the tool page and the guides; the player and Your songs pages carry `noindex`.
- `llms.txt` lists the tool.
- No tracking scripts. abcjs (staff notation) loads only when staff notation is switched on.

## Not done yet

- **vantly.xyz is behind Cladior's paywall** except free paths, so crawlers see paid pages only if Cladior's crawler
  access setting allows it. Check that setting for the tool page and the guides; it decides whether any of this ranks.
- **Regional data.** Pull Google Trends "interest by region" and "related queries" for "tonic solfa". Interest is
  expected to concentrate in Nigeria, Ghana, South Africa and Kenya, but that has not been checked.
- **Song-specific searches** ("<song> tonic solfa") are probably a large share of real demand. They conflict with the
  decision not to keep a public library of transcriptions (copyright); the guides are the safe alternative.
- **Search Console and analytics** after launch, to see which queries actually bring visitors.
- Guide copy has not been reviewed by a tonic solfa teacher.

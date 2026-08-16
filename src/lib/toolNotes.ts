/**
 * The things worth knowing before you use each tool.
 *
 * Removing the FAQ blocks left 22 tool pages under 200 words, which Google
 * treats as thin, and thin pages drag the domain rather than only themselves.
 * The answer is not to put the FAQs back. It is to say the true, useful things
 * that a person is actually about to trip over.
 *
 * The test for every line here: would somebody be annoyed if they found this
 * out afterwards instead of now. If not, it does not go in. Padding is worse
 * than a short page, because it teaches a reader the page is not worth reading.
 *
 * Kept out of site.ts so that file stays a list of what exists rather than
 * becoming a wall of prose.
 */

export const TOOL_NOTES: Record<string, string[]> = {
  'heic-to-jpg': [
    'iPhones have saved photos as HEIC since 2017. Windows needs a codec pack to open them, which is why they look broken on a laptop.',
    'Pick JPG if anything at all has to open it, including old software and print shops. Pick WebP if the photos are going on a website, where the files are noticeably smaller.',
    'Depth data and the second frame of a Live Photo do not survive the conversion. Keep the originals if either matters.',
    'To stop it happening again: Settings, Camera, Formats, Most Compatible. That only affects new photos.',
  ],
  'heic-to-webp': [
    'WebP is usually 25 to 35 percent smaller than JPG at the same visible quality, and every current browser reads it.',
    'Older desktop software often will not open a WebP. If the file is going anywhere other than a website, JPG is the safer choice.',
    'Converting is a second round of compression on top of what HEIC already did. At the quality used here that is not visible on a photograph.',
  ],
  'svg-to-png': [
    'An SVG has no resolution of its own, so you choose one. Pick the size you will actually display it at, then double it for a high density screen.',
    'Transparency is kept. Save as PNG rather than JPG if the background needs to stay clear, because JPG cannot store it.',
    'Fonts inside an SVG only render correctly if they are embedded or converted to outlines. A missing font falls back and the result looks wrong.',
  ],
  'remove-background': [
    'This works by colour, not by recognising objects. It is exact on a flat background, so logos, product shots, screenshots and scanned signatures come out clean.',
    'A person photographed in a real room is a different problem and this will not do it well. That needs a segmentation model, which is a separate job.',
    'White inside the subject is kept. The fill spreads inward from the edges rather than deleting every matching pixel, so white eyes and white text survive.',
    'The download is PNG because JPG has no transparency and would fill the background straight back in.',
  ],
  'image-compressor': [
    'Quality 75 to 85 is the usual sweet spot. Above 90 the file grows fast for a difference you cannot see.',
    'PNG is lossless, so compressing a photo to PNG makes it larger, not smaller. Use JPG or WebP for photographs and keep PNG for graphics and screenshots.',
    'Compression is not reversible. Keep the original if the image might need editing later.',
  ],
  'image-resizer': [
    'The aspect ratio is always kept. A free width and height would let you stretch a picture without noticing, which is almost never what anybody wants.',
    'Nothing is ever enlarged. Scaling a small image up invents detail that was never captured and makes the file bigger for a worse picture.',
    'Sizes are set by the longest edge, which is how people actually describe them: make it fit 1920, rather than a pair of exact numbers.',
  ],
  'image-enhancer': [
    'Auto levels stretch the tones that are already in the file. It fixes flat and dull, and it cannot recover detail that was never captured.',
    'A blown out sky or a black shadow has no information left in it. No amount of correction brings those back.',
    'Drag the handle across the picture to compare. Small corrections almost always look better than large ones.',
  ],
  'hash-generator': [
    'The usual reason to hash a file is to check it arrived intact. Uploading it to a stranger to find out would defeat the point, so this reads it locally.',
    'SHA-256 is the sensible default. SHA-1 is here for checking against older published hashes and should not be used for anything security related.',
    'There is no MD5, deliberately. It is broken for security, and offering it next to SHA-256 implies they are alternatives.',
    'A mismatch usually means you picked the wrong algorithm, not that the file is tampered with. Check that first.',
  ],
  'password-generator': [
    'Length matters more than symbols. A long passphrase beats a short jumble, and it is far easier to type.',
    'The randomness comes from crypto.getRandomValues, the browser cryptographic source, rather than Math.random, which is predictable and not built for this.',
    'Nothing generated here is sent anywhere or stored. Reload the page and it is gone.',
    'Use a different password everywhere and a password manager to hold them. Reuse is what actually causes accounts to fall.',
  ],
  'color-palette': [
    'Colours are pulled from an image using median cut, the standard quantisation algorithm. Near white pixels are skipped, since they otherwise dominate every palette from a product photo.',
    'Shades comes first because it is the one a design system needs: one hue at nine lightness steps. You cannot build an interface out of five unrelated hues.',
    'Copy the result as CSS variables, a Tailwind scale, SCSS or JSON, rather than one hex code at a time.',
  ],
  'contrast-checker': [
    'WCAG AA wants 4.5:1 for body text and 3:1 for large text, which means 18pt or 14pt bold. AAA wants 7:1.',
    'Contrast is calculated from relative luminance, not from how different two colours look. Two vivid colours can be equally bright and fail badly.',
    'Failing this is the most common accessibility problem on the web, and it affects anyone reading on a phone in daylight, not only people with low vision.',
  ],
  'color-converter': [
    'HEX and RGB describe the same thing in different notation. HSL is the one worth learning, because changing lightness without touching the hue is a single number.',
    'CMYK here is a rough conversion for reference. Real print colour depends on the paper and the press profile, so treat it as a starting point.',
  ],
  'word-counter': [
    'Reading time assumes about 240 words a minute, which is normal for adults reading on a screen. Reading aloud is closer to 130.',
    'Characters with and without spaces both appear, because different places count differently and the difference matters on a limit.',
    'A word here is any run of characters between spaces, so hyphenated words count once and a URL counts as one word.',
  ],
  'diff-checker': [
    'Comparison is line by line. Two files that differ only in line endings will show as entirely different, which is worth knowing before you panic.',
    'Whitespace is significant unless you turn it off. That is usually right for code and usually wrong for prose.',
    'A moved block shows as a deletion in one place and an addition in another. Line by line comparison has no concept of a move.',
  ],
  'json-formatter': [
    'Formatting also validates. If the JSON is broken, you get the position of the problem rather than a vague failure.',
    'Minify removes whitespace and nothing else. Key order and values are untouched, so the meaning is identical.',
    'Trailing commas and single quotes are not valid JSON, even though JavaScript accepts both. That is the commonest cause of a parse error here.',
  ],
  'base64-encoder': [
    'Base64 is encoding, not encryption. Anyone can decode it instantly, so it protects nothing.',
    'It makes data roughly 33 percent larger. That is the price of representing bytes as text that survives systems which mangle binary.',
    'Use it for data URIs, email attachments and anywhere binary has to travel through a text only channel.',
    'Decoding something you were sent is safe here, since it happens in your browser. Decoding it does not make the contents trustworthy.',
  ],
  'url-encoder': [
    'Encoding makes characters safe to put in a URL. Spaces, ampersands and question marks all mean something in a URL and have to be escaped to survive.',
    'Encode the component, not the whole address. Escaping the slashes and colons of the URL itself will break it.',
  ],
  'uuid-generator': [
    'Version 4 UUIDs are random, from the browser own cryptographic source. Collisions are possible in theory and not worth planning for.',
    'They are not sequential, which makes them poor database primary keys in some engines, because random inserts fragment the index.',
  ],
  'unit-converter': [
    'Temperature is the odd one. It converts by offset as well as scale, so 0 degrees is not zero in another scale the way 0 metres is zero in any length unit.',
    'Digital storage is ambiguous by nature. A kilobyte is 1000 bytes to a drive manufacturer and 1024 to an operating system, which is why a new drive looks smaller than the box said.',
  ],
  'percentage-calculator': [
    'A 20 percent rise is not undone by a 20 percent fall. 100 becomes 120, and 120 falling by 20 percent is 96. To get back you need 16.67 percent.',
    'Percent and percentage points are different. A rate going from 4 to 6 percent rose 2 points, and also rose 50 percent. Both are true and they are used to mislead.',
  ],
  'tip-calculator': [
    'Custom says tip before tax, on the food and drink. Most people tip on the total because it is easier, and the gap only matters on a large bill.',
    'There is no default percentage, because the right answer is entirely local. Around 15 to 20 percent in the United States, often nothing in Japan, and service is usually included in much of Europe.',
  ],
  'loan-calculator': [
    'The payment is not the amount divided by the months. Interest is charged on what is still owed, so early payments are mostly interest and later ones mostly principal.',
    'Paying extra early saves far more than the same amount later, because every pound off the balance removes the interest it would have generated for the rest of the term.',
    'Fees, insurance and property tax are not in this number. Treat it as a floor rather than the real monthly cost.',
  ],
  'compound-interest-calculator': [
    'The split between what you put in and what it earned matters more than the total. Growth usually overtakes contributions later than people expect.',
    'A fixed annual return is a shape, not a forecast. Real returns arrive unevenly, and a bad year early does more damage than a bad year late.',
    'Inflation, fees and tax are not included. A 7 percent return with 3 percent inflation is about 4 percent in what the money will actually buy.',
  ],
  'utm-builder': [
    'Capitals split your reporting. Analytics files Email and email separately, so one campaign becomes several rows that each look like a failure.',
    'Source and medium are the two that matter. Without them the visit is filed as direct traffic and the tag may as well not be there.',
    'Anything after a # never leaves the browser, so parameters placed there are invisible to analytics.',
  ],
  'robots-txt-generator': [
    'Disallow: / hides the entire site from search. It is right for staging and catastrophic on production, and it usually arrives by being copied between the two.',
    'This is not security. It is a request that well behaved crawlers honour, and the file is public, so listing a secret path advertises it.',
    'Blocking a URL does not reliably keep it out of results. To do that, let it be crawled and serve a noindex tag instead.',
  ],
  'meta-tag-generator': [
    'Roughly 60 characters for a title and 160 for a description. Google measures pixels rather than characters, so those are guides, not limits.',
    'The description does not affect ranking. It affects whether anybody clicks, which was the point.',
    'Share images want 1200 by 630. That fits the large card on X, LinkedIn and Facebook without cropping anything important.',
  ],
  'case-converter': [
    'Slug case is the one with rules beyond capitals: accents are folded, punctuation is dropped, and spaces become hyphens, because that is what a URL can carry.',
    'Title Case here capitalises every word. Real editorial style leaves short prepositions lowercase, so check anything going into print.',
  ],
  'text-cleaner': [
    'Removing duplicate lines keeps the first occurrence and preserves the order of what is left.',
    'Stripping HTML removes the tags and keeps the text between them. It is not a sanitiser and should not be relied on for safety.',
  ],
};

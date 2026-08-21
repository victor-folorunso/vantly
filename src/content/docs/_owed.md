# Explanation taken out of the tools, owed to a doc

The tools used to carry paragraphs explaining themselves. That text was moved
out, because a person mid-task is reading controls rather than prose, and an
explanation sitting under a slider is in the way of the thing it explains.

None of it was wrong, so it is listed here rather than thrown away. Each line
is a fact a doc should carry, against the tool it came from. Delete a line once
its doc says it.

Not a doc itself. The filename starts with an underscore so the loader ignores
it.

## Owed

- **image-compressor** and **image-resizer**: the aspect ratio is kept and
  nothing is ever enlarged, so asking for a longer edge than the picture has
  does nothing. Quality around 90% is visually identical for most photographs,
  70% is the usual sweet spot, below that detail visibly softens.
- **loan-calculator**: the monthly payment is not the amount divided by the
  months. Early payments are mostly interest, which is why paying extra at the
  start saves far more than the same amount later.
- **compound-interest-calculator**: it is an estimate at a fixed rate. Real
  returns are not a straight line, and it ignores inflation, fees and tax.
- **json-formatter** and the other formatters: formatting is Prettier, the
  same engine most editors run. Minifying is Terser and csso, which rename and
  remove rather than only stripping spaces.
- **qr-code-generator**: higher error correction survives more damage and
  scuffing and makes the code denser. H is the one for anything handled. Take
  the SVG for print: a small PNG enlarged to poster size is the usual reason a
  code on a sign will not scan.
- **contrast-checker**: large text means 18.66px bold, or 24px and up.
  Falling short by a small amount is usually one step of lightness away.
- **domain-name-checker**: free means nobody has registered it, asked of the
  registry rather than worked out from whether the name resolves. A registered
  name with nothing set up does not resolve, which is why a DNS based check
  reports owned names as available.
- **uuid-generator**: version 4, and 122 of the 128 bits are random, which is
  enough that you will not see a collision.
- **fantasy-name-generator**: names are built from syllables rather than
  picked from a list, so the supply does not run out and two people are
  unlikely to land on the same one.
- **image-to-text** and **pdf-ocr**: recognition is never perfect. A clean
  scan reads almost exactly, a photograph at an angle reads worse, and
  handwriting is not what this is for.
- **compress-pdf**: flattening turns each page into a picture, so nobody can
  select or search the text afterwards and a screen reader finds nothing to
  read. Good for a scan, bad for a contract.
- **fill-pdf**: locking the answers in makes them part of the page so nobody
  can change them later. Leave it off if the form goes to somebody else to
  finish. Already written into the doc.
- **tonic-solfa-converter**: solfa is movable doh, so the same tune in C and
  in F has identical solfa and different note names. An apostrophe is the
  octave above, a comma the octave below. Sharpened notes take the e vowel,
  flattened ones the a vowel.
- **srt-shifter**: negative shifts move subtitles earlier. Subtitles that
  start in sync and drift further out as the film goes on are a frame rate
  problem, and shifting will never fix it. Already written into the doc.
- **typing-speed-test**: a word is five characters including the space, which
  is how typing speed has always been measured. Counting actual words gives a
  number that cannot be compared with anything.
- **unit-converter**: both meanings of kilobyte are listed. Storage
  manufacturers use 1000 and operating systems mostly use 1024, which is the
  whole reason a new 1TB drive shows up as 931GB.
- **robots-txt-generator**: blocking AI crawlers also keeps you out of AI
  answers, which is increasingly how people find things. The file only works
  at the root of a domain, not in a subfolder.

## Kept in the tools on purpose

Not everything went. These stayed because they are not explanation:

- Labels, field names, empty states, errors and status text.
- What a tool accepts, which is a thing you need before choosing a file.
- Warnings that arrive before a cost is paid: the converter being a 30MB
  download, the recogniser being 5MB.
- Notes that stop somebody believing a tool did something it did not. A drawn
  signature is not a cryptographic one. Unlocking a PDF needs the password you
  already have. A robots.txt is not security. Those protect the reader at the
  moment of the mistake, and a doc further down the page is too late.

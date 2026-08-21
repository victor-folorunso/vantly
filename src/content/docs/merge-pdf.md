---
updated: "2026-08-21"
title: What happens to bookmarks and form fields when you merge PDFs?
description: Page order, file size and the things that don't survive a merge. What to check before you send the combined file.
keywords: [merge pdf, combine pdf, join pdf files, merge pdf order]
---

Bookmarks from the original files don't carry over, and form fields lose their
values if two files use the same field names. Everything visible on the page
survives exactly: text stays text, images stay at full quality, links still
work.

That's the short version. The details matter mostly when the files you're
merging are anything more complicated than scans or exported documents.

## Order is decided by you, not by filename

Files come in in the order you add them, and you can drag them around
afterwards. This catches people out when they select twenty files at once,
because the order the browser hands them over isn't always the order they appear
in your folder.

The reliable habit is to check the first and last page of the result before
sending it. A merged document with two pages swapped looks entirely normal until
somebody reads it.

If your files are named with numbers, watch for the classic sorting problem:
`page2` sorts after `page10` in plain alphabetical order. Naming them `page02`
and `page10` fixes it everywhere, not just here.

## Size doesn't quite add up

The merged file is usually a bit smaller than the sum of its parts, because
things that appear in more than one document get stored once. Fonts especially:
five documents each embedding the same font carry five copies, and the merged
one carries fewer.

It won't be dramatically smaller. If you're merging to get under an email
limit, merging alone probably won't do it, and [compressing the
result](/compress-pdf) is the next step.

Occasionally a merged file comes out slightly larger than expected. That
happens when the originals used different versions of the same font, or
different colour profiles, and both have to be kept.

## What doesn't survive

**Bookmarks.** The outline panel down the side of a PDF reader is built from a
structure that has to be rebuilt for the merged document, and this tool doesn't
rebuild it. Long merged documents come out with no outline. For a report people
will navigate, that's worth knowing before you send it.

**Form fields with clashing names.** Two forms that both call a field `name`
can't both keep their value in one document. If you're merging filled forms,
[flatten them first](/fill-pdf) so the answers become part of the page and
can't clash.

**Attachments and file annotations.** Files attached inside a PDF don't come
along.

**Digital signatures.** Any cryptographic signature is invalidated, and it has
to be. A signature attests to a specific document, and the merged document is a
different one. The signature's appearance may still be drawn on the page, which
is misleading, so check if the original was signed.

## Mixed page sizes

Pages keep their own size. Merge an A4 report with a US Letter appendix and the
result has both, which looks fine on screen and prints with inconsistent
margins.

Most readers offer a "fit to page" option when printing, which papers over it.
If the document is going to a printer properly, make the pages consistent
before merging rather than after.

Landscape pages stay landscape. That's usually what you want for a document
containing a wide table.

## Encrypted files

A password protected PDF can't be merged until the password is off it. That's
not a limitation to work around, it's the encryption doing its job. [Remove the
password first](/unlock-pdf) if you know it.

If you don't know it, nothing here will help, and anything that claims to
should be treated with suspicion.

## Everything stays on your machine

Merging happens in your browser. The files aren't uploaded anywhere, which
matters more for this tool than most, because the reason people merge documents
is usually that they're assembling something for somebody else. Contracts,
applications, medical records and invoices are the everyday inputs here.

The practical consequence is that very large merges are limited by your own
machine's memory rather than by an upload limit. A few hundred pages is
comfortable. A few thousand scanned pages may not be, and splitting the job in
two is the way through.

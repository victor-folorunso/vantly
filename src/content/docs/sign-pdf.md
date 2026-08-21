---
updated: "2026-08-21"
title: Is a drawn signature on a PDF legally binding?
description: In most countries yes, for most everyday documents. What a drawn signature actually is, and when you need a certificate-based one instead.
keywords: [sign pdf, electronic signature, esign pdf, is an electronic signature legal]
---

For most everyday agreements, yes. Electronic signatures have the same standing
as ink in the US under the ESIGN Act, in the EU under eIDAS, and in the UK
under the Electronic Communications Act. A signature you draw and place on a
document is an electronic signature under all three.

What matters legally is that you intended to sign and that the document can be
shown to be the one you agreed to. Neither of those is a property of the image
itself.

## What this tool actually does

It puts a picture of your signature on the page. Exactly what printing the
document, signing it and scanning it back would produce, without the printer.

That's genuinely useful and it's worth being clear about what it isn't. The
image carries no proof of who drew it, no record of when, and no protection
against somebody lifting it off the page and putting it on a different
document. Anyone who receives your signed PDF has a copy of your signature as
an image.

Tools that blur that line are the reason people think a drawn squiggle proves
something it doesn't.

## When you need something stronger

A certificate-based digital signature is a different thing. It uses a
cryptographic key tied to a verified identity, and it seals the document so any
later change breaks the seal visibly. That's what stops somebody adding a page
after you signed.

You need one for:

- Property transfers and mortgages in most countries
- Court filings, where the court usually specifies the format
- Documents requiring a notary
- Wills and some other testamentary documents, which in many places still need
  wet ink and witnesses
- Anything where a regulator has named a standard, which is common in finance
  and healthcare

For those, use a service that issues certificates. This tool won't do it and
shouldn't pretend to.

## Making the signature look right

Drawing with a mouse produces something that looks drawn with a mouse. A finger
on a phone is better. A stylus is better again.

The alternative that usually looks best: sign a sheet of white paper with a
dark pen, photograph it in good light, and upload that. Keep the paper filling
the frame and photograph it straight on rather than at an angle.

If you upload a photograph, a white background will sit as a white box on the
page. That's fine on a white document and obvious on anything else. A PNG with
a transparent background sits properly on any page.

## Where to put it

The tool places it where you choose and sizes it as a share of the page width,
so a signature that looks right on A4 also looks right on Letter.

Around 25 to 30 percent of the page width matches a normal handwritten
signature. Much larger reads as odd, and much smaller looks like you were
reluctant.

Check where the signature line actually is before you commit. Some forms have
one near the bottom and some have several through the document.

## After you sign

Send the PDF rather than a photograph of it. A photograph of a screen showing a
signed PDF is a real thing people send and it's rejected constantly.

Keep the original unsigned file. If a detail changes, editing the signed
version means the signature ends up sitting over whatever moved.

If the document came with form fields to complete as well, [fill those
in](/fill-pdf) before signing and lock the answers in. Filling them afterwards
means the answers can still be changed while your signature sits underneath
implying you agreed to them.

## Nothing leaves your machine

The document and the signature are both handled in your browser. That matters
more here than on most tools, because the documents people sign are contracts,
tenancy agreements, employment offers and medical forms, and the signature
itself is a piece of you that's genuinely worth not scattering across other
people's servers.

---
updated: "2026-08-21"
title: What's the difference between a PDF password and PDF permissions?
description: PDFs have two locks. One stops the file opening, the other only asks politely. Which this removes and which it can't.
keywords: [unlock pdf, remove pdf password, pdf permissions, pdf wont let me print]
---

A PDF can carry two quite different locks and they behave nothing alike.

The **open password** encrypts the file. Without it there's nothing readable
inside, and no software can get in. That's real encryption doing its job.

The **owner password** sets permissions: no printing, no copying, no editing.
The file isn't protected by it in any meaningful sense. It opens for anyone, and
the restrictions are a note in the file asking readers to behave. Most readers
comply. Nothing forces them to.

## Which one you have

If the document asks for a password before showing you anything, that's an open
password.

If it opens straight away but the print button is greyed out, or you can't
select text, that's owner permissions. The document was never secret. It was
just marked "please don't".

## What this tool removes

It removes the password from a PDF you can already open. That includes owner
permissions, which come off cleanly, and it includes an open password in cases
where you supply it or where the file uses a blank one, which is more common
than you'd think.

What it can't do is open a document you don't have the password for. Not as a
policy choice, though it would be that too. The content is encrypted, so
there's nothing to work with. A tool that claims otherwise is either lying or
guessing passwords, and guessing on modern PDF encryption takes longer than
anybody has.

## Why remove permissions at all

The everyday reasons are legitimate and boring. A bank statement you need to
print. A form you need to fill in. A report you need to quote two lines from. A
document from a supplier who ticked a box without thinking, which is how most
restricted PDFs come to exist.

The restrictions rarely reflect a deliberate decision by anyone. They're a
default in some export settings, and they end up inconveniencing the person the
document was sent to.

## When not to

If a document is restricted because somebody genuinely doesn't want it copied,
removing that isn't a technical question. Licensed material, exam papers,
paid-for reports and anything under an agreement you signed are all cases where
the restriction is the point.

The tool has no way to tell the difference, and that judgement sits with
whoever uses it.

## The awkward part about encryption strength

PDF encryption has improved a lot. Old files use 40-bit RC4, which is broken and
has been for decades. Files from the last ten years generally use AES-256, which
isn't going anywhere.

So the practical position is that an old restricted file may well be trivially
openable by many tools, and a recent one won't be. Neither says anything about
whether opening it is reasonable.

## If it fails

The most common failure is a PDF encrypted in a way that pdf-lib can't read at
all, which is rarer than it used to be but still happens with files produced by
some enterprise systems.

The reliable workaround: open it in a reader with the password, then print to
PDF. That produces a new document with no restrictions, because printing
regenerates the file from scratch. You lose form fields and bookmarks, which is
the trade.

## After it's unlocked

The result is an ordinary PDF. It'll open without a password anywhere, which
also means anyone you send it to can open it, so think about where it goes next
if the document was sensitive.

If you need to send it protected, put a password back on rather than relying on
permissions, since [permissions stop nobody](/protect-pdf).

Everything happens in your browser. The document isn't uploaded, which matters
here because the files people unlock are bank statements, payslips and medical
records more often than anything else.

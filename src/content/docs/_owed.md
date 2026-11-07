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

- **uuid-generator**: version 4, and 122 of the 128 bits are random, which is
  enough that you will not see a collision.
- **fantasy-name-generator**: names are built from syllables rather than
  picked from a list, so the supply does not run out and two people are
  unlikely to land on the same one.

Everything else that was listed here is now in its tool's doc (checked
2026-11-07). These two are left because neither tool has a doc, and neither
is a question people search for, so they may never need one.

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

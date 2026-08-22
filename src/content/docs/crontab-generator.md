---
updated: "2026-08-22"
title: Why did my cron job run every minute instead of every hour?
description: Almost always an empty first field or a missing minute value. What the five fields mean, and the mistakes that make a job fire far more often than intended.
keywords: [crontab generator, cron expression, cron every hour, cron syntax]
---

Almost always because the minute field is a `*` when it should be a number. An
expression like `* */2 * * *` doesn't mean every two hours. It means every
minute during every second hour, so it fires thirty times an hour rather than
once.

The fix is `0 */2 * * *`. Pin the smaller units, or they run through their
whole range.

## The five fields

```
┌─ minute        0 to 59
│ ┌─ hour        0 to 23
│ │ ┌─ day       1 to 31
│ │ │ ┌─ month   1 to 12
│ │ │ │ ┌─ weekday  0 to 6, Sunday is 0
│ │ │ │ │
* * * * *
```

Left to right, smallest to largest. Every field you leave as `*` means "all
values", and that's where the surprises come from.

## The characters

`*` every value. `5` exactly that value. `1-5` a range. `1,3,5` a list.
`*/15` every fifteenth, so minutes 0, 15, 30 and 45.

The step is worth understanding properly. `*/7` on minutes gives 0, 7, 14, 21,
28, 35, 42, 49, 56, and then the hour rolls over and the next is 0. So the last
gap is four minutes, not seven. Steps that don't divide their range evenly
always have an uneven join at the top.

Use divisors when regularity matters: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20 and 30
all divide 60 cleanly.

## Day of month and day of week together

The trap that catches everyone. If both are set to something other than `*`,
most cron implementations treat it as **or**, not **and**.

So `0 0 13 * 5` doesn't mean "Friday the 13th". It means "the 13th of any
month, and also every Friday". If you want Friday the 13th specifically, you
need the day check inside the script.

When one is `*` the behaviour is what you'd expect, which is why this only
bites in the specific case where both are set.

## Times worth avoiding

**Midnight.** Everybody schedules at `0 0 * * *`, so backups, reports and
cleanups across the world all start at once. If the job touches a shared
service, pick a minute nobody else picked. `17 3 * * *` is no harder to write
than `0 0 * * *`.

**The hour boundary generally.** Minute 0 is congested for the same reason.

**Between 1am and 3am**, if your server observes daylight saving. That window
either happens twice or not at all, twice a year. A job scheduled at 2:30am
either runs twice or gets skipped, and which one depends on the direction.

For anything where that matters, run the server in UTC. It's the single
easiest way to remove a whole class of scheduling bugs.

## Which minute the job actually starts

Cron fires at the start of the minute, but it doesn't guarantee an instant
start under load, and it makes no attempt to space out jobs that share a time.

If ten jobs are scheduled at `0 * * * *`, all ten start together and compete
for the same CPU and disk. Staggering them by a few minutes usually costs
nothing and removes the contention.

## Overlapping runs

Cron will happily start a new run while the previous one is still going. A job
scheduled every five minutes that sometimes takes seven will eventually have
several copies running at once, and if it writes anywhere shared, that's a
corruption waiting to happen.

Cron has no protection against this. Use a lock file, or a tool like `flock`,
and decide explicitly whether a late run should be skipped or queued.

## The special strings

Most implementations accept `@daily`, `@hourly`, `@weekly`, `@monthly` and
`@reboot` as shorthands. They're readable, and `@daily` means midnight, which
puts you back in the congested slot.

`@reboot` runs once when the machine starts, which is occasionally what people
actually wanted when they wrote a complicated expression.

## Before you trust it

Cron's environment is not your shell's. It typically has a minimal `PATH`, no
profile loaded, and a different working directory. A script that works when you
run it and fails under cron is nearly always one of those three.

Use absolute paths for everything, set any variables the script needs inside
the script, and send the output somewhere you'll see it. A job that fails
silently at 3am fails silently for months.

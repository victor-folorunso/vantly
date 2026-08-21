'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * A typing speed test.
 *
 * Words per minute is defined as characters typed divided by five, then scaled
 * to a minute. The five is not arbitrary: a "word" in typing measurement is
 * five characters including the space, which is why a test that counts actual
 * words gives a different and wrong number.
 *
 * Two figures are shown because only one of them is honest on its own. Raw
 * speed counts everything typed. Net speed counts only correctly typed
 * characters, so hammering the keyboard cannot inflate it. Accuracy sits
 * between them and explains the gap.
 *
 * The words are ordinary English drawn from a list here, rather than a passage
 * from a book, so nothing copyrighted is reproduced and every run is different.
 */

const WORDS = `the be to of and a in that have I it for not on with he as you do at this
but his by from they we say her she or an will my one all would there their what so up out if
about who get which go me when make can like time no just him know take people into year your
good some could them see other than then now look only come its over think also back after use
two how our work first well way even new want because any these give day most us man find here
thing tell very ask because too still own say try leave call keep last long great little world
own school high every begin seem help talk turn start might show hear play run move live believe
hold bring happen write sit stand lose pay meet include continue set learn change lead understand
watch follow stop create speak read spend grow open walk win teach offer remember consider appear
buy serve die send build stay fall cut reach kill remain suggest raise pass sell require report
decide pull return explain hope develop carry break receive agree support hit produce eat cover
catch draw choose cause point mind name music power water number word month night home story fact`
  .split(/\s+/)
  .filter(Boolean);

const DURATIONS = [15, 30, 60, 120];

function shuffled(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return out;
}

export default function TypingTest() {
  const [duration, setDuration] = useState(30);
  const [words, setWords] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(30);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generated on the client only. Doing it during render would produce
  // different words on the server and in the browser, and React would throw a
  // hydration error over it.
  useEffect(() => {
    setWords(shuffled(220));
  }, []);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vantly.typing.best');
      if (saved) setBest(Number(saved));
    } catch {
      /* Private browsing refuses storage. Not worth mentioning to anyone. */
    }
  }, []);

  const target = useMemo(() => words.join(' '), [words]);

  /* Counted per character rather than per word, because a word half typed
     when the clock stops still counts for the characters that were right. */
  const stats = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === target[i]) correct++;
    }
    const elapsed = startedAt ? Math.max((Date.now() - startedAt) / 1000, 1) : 0;
    const minutes = elapsed / 60;
    const raw = minutes > 0 ? Math.round(typed.length / 5 / minutes) : 0;
    const net = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
    const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
    return { raw, net, accuracy, correct };
  }, [typed, target, startedAt]);

  const finish = useCallback(() => {
    setDone(true);
    setStartedAt((at) => {
      if (!at) return at;
      return at;
    });
  }, []);

  useEffect(() => {
    if (!startedAt || done) return;
    const timer = setInterval(() => {
      const left = duration - Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) finish();
    }, 100);
    return () => clearInterval(timer);
  }, [startedAt, duration, done, finish]);

  useEffect(() => {
    if (!done) return;
    if (best === null || stats.net > best) {
      setBest(stats.net);
      try {
        localStorage.setItem('vantly.typing.best', String(stats.net));
      } catch {
        /* Nothing to do. */
      }
    }
  }, [done, stats.net, best]);

  const reset = useCallback(() => {
    setWords(shuffled(220));
    setTyped('');
    setStartedAt(null);
    setDone(false);
    setRemaining(duration);
    inputRef.current?.focus();
  }, [duration]);

  const onType = (next: string) => {
    if (done) return;
    // A jump of more than a few characters at once is not typing. Pasting the
    // passage in scores several hundred words a minute, and the only person
    // it fools is the one who did it, but it would also be saved as their
    // best score and sit there forever.
    if (next.length - typed.length > 4) return;
    if (!startedAt) setStartedAt(Date.now());
    setTyped(next);
  };

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-line p-0.5 text-sm">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => {
                setDuration(d);
                setTyped('');
                setStartedAt(null);
                setDone(false);
              }}
              aria-pressed={duration === d}
              className={`rounded-md px-3 py-1.5 font-medium tabular-nums transition-colors ${
                duration === d ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <p className="text-2xl font-semibold tabular-nums">{remaining}s</p>
          <button
            onClick={reset}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Clicking anywhere in the passage focuses the field, so the whole block
          behaves like the thing you type into. The field itself is offscreen
          rather than hidden, because a hidden input cannot take focus. */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="mt-6 cursor-text rounded-2xl border border-line bg-surface p-6 text-lg leading-relaxed"
      >
        <p className="font-mono">
          {target.split('').map((char, i) => {
            const state =
              i >= typed.length
                ? 'pending'
                : typed[i] === char
                  ? 'right'
                  : 'wrong';
            return (
              <span
                key={i}
                className={
                  state === 'pending'
                    ? 'text-ink-faint'
                    : state === 'right'
                      ? 'text-ink'
                      : 'rounded bg-accent-soft text-accent underline decoration-accent'
                }
              >
                {i === typed.length ? (
                  <span className="border-l-2 border-accent">{char}</span>
                ) : (
                  char
                )}
              </span>
            );
          }).slice(0, 600)}
        </p>
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => onType(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        disabled={done}
        aria-label="Type the passage here"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="sr-only"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ['Net speed', `${done || startedAt ? stats.net : 0} wpm`, 'Only the characters you got right.'],
          ['Raw speed', `${done || startedAt ? stats.raw : 0} wpm`, 'Everything you typed.'],
          ['Accuracy', `${stats.accuracy}%`, 'The gap between the two figures.'],
          ['Your best', best === null ? 'None yet' : `${best} wpm`, 'Kept on this device only.'],
        ].map(([name, figure, note]) => (
          <div key={name} className="rounded-xl border border-line bg-surface p-4">
            <p className={label}>{name}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{figure}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-faint">{note}</p>
          </div>
        ))}
      </div>

      {!startedAt && !done && (
        <p className="mt-4 text-sm text-ink-soft">
          Click the passage and start typing. The clock starts on your first key.
        </p>
      )}

      {done && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <p className="text-lg font-medium">
            {stats.net} words a minute, {stats.accuracy}% accurate.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            A word here is five characters including the space, which is how
            typing speed has always been measured. Counting actual words gives a
            different number that cannot be compared with anything.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
          >
            Go again
          </button>
        </div>
      )}
    </div>
  );
}

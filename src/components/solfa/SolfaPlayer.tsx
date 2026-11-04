'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DownloadButton from '@/components/DownloadButton';
import SolfaKeyboard from './SolfaKeyboard';
import StaffView from './StaffView';
import { describeJob, getJob, getResult, isPending, rememberSong, resultUrl } from '@/lib/solfa/api';
import { asBlob, fileStem, toMidi, toText } from '@/lib/solfa/exports';
import { buildStaff, keyTitle, scaleBeats, toAbc, toMusicXml, type Meter } from '@/lib/solfa/notation';
import {
  NOTE_NAMES,
  activeIndex,
  chordName,
  chordNumeral,
  chordTones,
  displayPitches,
  exactPitch,
  formatTime,
  homeDo,
  isComplete,
  keyName,
  layoutSheet,
  syllable,
  transposeShift,
  type Chord,
  type Note,
  type Phrase,
  type SolfaResult,
} from '@/lib/solfa/solfa';

/**
 * The player: the song, the solfa lighting up with the singer, and the key to
 * press.
 *
 * The song plays from the moment it is uploaded, while the server is still
 * transcribing it. solfa.json is polled and swapped in whenever a newer
 * version lands, without reloading or losing the place, so the sheet grows
 * part by part and the key estimate can change as more of the song arrives.
 *
 * Two audio elements run together: the song, and a piano rendering of the
 * detected notes. Hearing both is how somebody checks the transcription by
 * ear, which matters because it is automatic and will have wrong notes.
 *
 * The clock is read every animation frame, so the sheet is a memoised
 * component that only re-renders when the current note changes, not sixty
 * times a second.
 */

const POLL_MS = 3000;
const NOTATION_KEY = 'vantly.solfa.notation';
type Notation = 'solfa' | 'staff' | 'both';

const SPEED_NAMES: Record<number, string> = {
  0.5: 'half speed',
  0.75: 'three-quarter speed',
  1: 'normal speed',
};

const field =
  'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent';
const fieldLabel = 'block text-sm text-ink-soft';

function rememberedNotation(): Notation {
  try {
    const value = localStorage.getItem(NOTATION_KEY);
    return value === 'staff' || value === 'both' ? value : 'solfa';
  } catch {
    return 'solfa';
  }
}

export default function SolfaPlayer() {
  const id = useSearchParams().get('id') ?? '';

  const [result, setResult] = useState<SolfaResult | null>(null);
  const [title, setTitle] = useState('');
  const [loadError, setLoadError] = useState('');
  const [waiting, setWaiting] = useState(''); // queued, or its first part is still being transcribed

  // Settings.
  const [doPc, setDoPc] = useState<number | null>(null);
  const [userDo, setUserDo] = useState(false);
  const [hear, setHear] = useState<'song' | 'synth' | 'both'>('both');
  const [exact, setExact] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [toC, setToC] = useState(false);
  const [rate, setRate] = useState(1);
  const [notation, setNotation] = useState<Notation>('solfa');
  const [meter, setMeter] = useState<Meter>(4);
  const [firstBeat, setFirstBeat] = useState(0);
  const [beatScale, setBeatScale] = useState<0.5 | 1 | 2>(1);

  // Playback.
  const song = useRef<HTMLAudioElement>(null);
  const synth = useRef<HTMLAudioElement>(null);
  const deck = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [keyNotice, setKeyNotice] = useState('');

  // The poll runs outside React's render, so it reads these through refs.
  const resultRef = useRef<SolfaResult | null>(null);
  const userDoRef = useRef(false);
  const doPcRef = useRef<number | null>(null);
  useEffect(() => {
    userDoRef.current = userDo;
    doPcRef.current = doPc;
  }, [userDo, doPc]);

  // Read after mount: the page is prerendered, and storage does not exist then.
  useEffect(() => setNotation(rememberedNotation()), []);
  useEffect(() => {
    try {
      localStorage.setItem(NOTATION_KEY, notation);
    } catch {
      // private window or storage blocked: the choice just is not remembered
    }
  }, [notation]);

  useEffect(() => {
    document.title = `${title || 'Your song'} | Song to tonic solfa | Vantly`;
  }, [title]);

  // Fetch and poll.
  useEffect(() => {
    if (!id) {
      setLoadError('This link has no song in it.');
      return;
    }
    rememberSong(id); // a shared link lands in Your songs too
    let stopped = false;
    let timer: number;
    let noticeTimer: number;

    getJob(id)
      .then((job) => !stopped && setTitle(job.name))
      .catch(() => !stopped && setTitle('Your song'));

    const apply = (next: SolfaResult) => {
      resultRef.current = next;
      setResult(next);
      if (userDoRef.current) return;
      const previous = doPcRef.current;
      setDoPc(next.do_pitch_class);
      doPcRef.current = next.do_pitch_class;
      if (previous !== null && next.do_pitch_class !== null && next.do_pitch_class !== previous) {
        setKeyNotice(
          `Key updated to do = ${NOTE_NAMES[next.do_pitch_class]} now that more of the song is done. You can change it in the settings.`,
        );
        window.clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(() => setKeyNotice(''), 12000);
      }
    };

    const poll = async () => {
      let failed = false;
      try {
        const next = await getResult(id);
        if (stopped) return;
        const current = resultRef.current;
        if (!current || (next.version ?? 0) > (current.version ?? 0)) apply(next);
        setLoadError('');
        setWaiting('');
      } catch {
        // No solfa.json yet: a song still in the queue or on its first part, or one that does not exist.
        if (stopped || resultRef.current) return void schedule();
        const job = await getJob(id).catch(() => null);
        if (stopped) return;
        if (job && isPending(job)) setWaiting(describeJob(job));
        else {
          failed = true;
          setLoadError(job?.error ?? 'This song could not be found. It may have been deleted.');
        }
      }
      if (!failed) schedule();
    };
    const schedule = () => {
      const current = resultRef.current;
      if (!stopped && !(current && isComplete(current))) timer = window.setTimeout(poll, POLL_MS);
    };
    poll();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(noticeTimer);
    };
  }, [id]);

  // The clock, read every frame, with the piano track held to the song.
  useEffect(() => {
    let frame = requestAnimationFrame(function loop() {
      const s = song.current;
      const p = synth.current;
      if (s) {
        setNow(s.currentTime);
        if (p && !s.paused && Math.abs(p.currentTime - s.currentTime) > 0.08) p.currentTime = s.currentTime;
      }
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const notes = useMemo(() => result?.notes ?? [], [result]);
  const chords = useMemo(() => (showChords ? (result?.chords ?? []) : []), [result, showChords]);
  const shift = transposeShift(doPc, toC);
  const pitches = useMemo(() => (result ? displayPitches(result, doPc, exact) : []), [result, doPc, exact]);
  const home = useMemo(() => homeDo(notes, doPc), [notes, doPc]);
  const phrases = useMemo(() => layoutSheet(notes, chords), [notes, chords]);
  const current = activeIndex(notes, now);
  const currentChord = chords[activeIndex(chords, now)] ?? null;
  const complete = result ? isComplete(result) : false;
  const processed = result?.processed_seconds ?? 0;
  const total = result?.duration || duration || 0;
  const ahead = !complete && now > processed && result !== null;

  // Staff notation (estimated rhythm) and the downloads built from it.
  const minor = doPc !== null && (result?.minor_by_do?.[doPc] ?? false);
  const beat = firstBeat < meter ? firstBeat : 0;
  const staff = useMemo(
    () =>
      result && doPc !== null && notes.length
        ? buildStaff(notes, pitches, chords, scaleBeats(result, beatScale), total, doPc, minor, meter, beat)
        : null,
    [result, doPc, notes, pitches, chords, beatScale, total, minor, meter, beat],
  );
  // No title in the ABC: the page already shows it.
  const abc = useMemo(() => (staff ? toAbc(staff, '', (c) => chordName(c, shift), shift) : ''), [staff, shift]);
  let currentBar = -1;
  if (staff && playing) while (currentBar + 1 < staff.barTimes.length && staff.barTimes[currentBar + 1] <= now) currentBar++;

  const shownDo = doPc === null ? null : (doPc + shift + 12) % 12;
  const keyLine = shownDo === null ? '' : `do = ${NOTE_NAMES[shownDo]} (${keyTitle(shownDo, minor)})`;
  const showSolfa = notation !== 'staff';
  const showStaff = notation !== 'solfa';

  // Swap in the newest piano track without losing the place.
  useEffect(() => {
    const p = synth.current;
    if (!p || !result?.synth_file) return;
    const src = resultUrl(id, result.synth_file);
    if (p.src.endsWith(src)) return;
    const wasPlaying = song.current ? !song.current.paused : false;
    p.src = src;
    p.onloadedmetadata = () => {
      const s = song.current;
      if (!s) return;
      p.currentTime = s.currentTime;
      p.playbackRate = s.playbackRate;
      if (wasPlaying && !s.paused) p.play().catch(() => {});
    };
  }, [id, result?.synth_file]);

  useEffect(() => {
    if (song.current) song.current.muted = hear === 'synth';
    if (synth.current) synth.current.muted = hear === 'song';
  }, [hear, loadError, waiting]);

  useEffect(() => {
    if (song.current) song.current.playbackRate = rate;
    if (synth.current) synth.current.playbackRate = rate;
  }, [rate, loadError, waiting]);

  // Keep the current syllable in view while playing, below the sticky player.
  useEffect(() => {
    if (current < 0 || !playing || !sheet.current) return;
    const el = sheet.current.querySelector<HTMLElement>(`[data-note="${current}"]`);
    if (!el) return;
    const box = el.getBoundingClientRect();
    const top = (deck.current?.getBoundingClientRect().bottom ?? 0) + 16;
    if (box.top < top || box.bottom > innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [current, playing]);

  const toggle = useCallback(() => {
    const s = song.current;
    const p = synth.current;
    if (!s) return;
    if (s.paused) {
      if (p) p.currentTime = s.currentTime;
      s.play().catch(() => {});
      p?.play().catch(() => {});
    } else {
      s.pause();
      p?.pause();
    }
  }, []);

  const seek = useCallback((t: number) => {
    if (song.current) song.current.currentTime = t;
    if (synth.current) synth.current.currentTime = t;
    setNow(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA', 'A', 'SUMMARY'].includes(target.tagName)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const keyEvidence =
    (result as (SolfaResult & { key_evidence?: string }) | null)?.key_evidence === 'melody + chords'
      ? 'the tune and the chords'
      : 'the tune';
  const otherKeys = (result?.key_candidates ?? []).filter((c) => c.do_pitch_class !== doPc).map((c) => c.do);
  const keyRange = useMemo(() => pitches.map((p) => p + shift), [pitches, shift]);
  const settingsSummary = [
    doPc === null ? null : `do = ${NOTE_NAMES[doPc]}`,
    SPEED_NAMES[rate],
    hear === 'song' ? 'song only' : hear === 'synth' ? 'notes only' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const stem = fileStem(title);

  if (loadError) {
    return (
      <div className="py-6">
        <h1 className="text-3xl font-semibold tracking-tight">Song not found</h1>
        <p className="mt-3 text-ink-soft">
          {loadError}{' '}
          <Link href="/song-to-tonic-solfa/songs/" className="text-accent underline underline-offset-4">
            See your songs
          </Link>
          .
        </p>
      </div>
    );
  }

  if (waiting && !result) {
    return (
      <div className="py-6" role="status">
        <h1 className="text-3xl font-semibold tracking-tight [overflow-wrap:anywhere]">{title || 'Your song'}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          {waiting}. The player opens here by itself as soon as the first part of the song is ready.
        </p>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={song}
        src={id ? resultUrl(id, 'song.wav') : undefined}
        preload="auto"
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <audio ref={synth} preload="auto" />

      <div className="print-only mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1">{keyLine}. Made with vantly.xyz/song-to-tonic-solfa; transcription is automatic, so check it by ear.</p>
      </div>

      {/* The player stays on screen while the sheet scrolls under it. The header above
          is taller on a phone, where the search box drops to its own row. */}
      <section
        ref={deck}
        className="no-print sticky top-[7.25rem] z-20 -mx-5 border-b border-line bg-ground/95 px-5 py-4 backdrop-blur sm:top-16"
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Link href="/song-to-tonic-solfa/songs/" className="text-sm text-ink-soft hover:text-accent">
            Your songs
          </Link>
          <h1 className="text-xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
            {title}
          </h1>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="grid size-14 flex-none place-items-center rounded-full bg-accent text-accent-ink shadow-sm transition-transform hover:scale-[1.04] active:scale-100"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            )}
          </button>
          <div className="grid flex-1 gap-1">
            <input
              type="range"
              min={0}
              max={total || 0}
              step={0.01}
              value={now}
              onChange={(e) => seek(+e.currentTarget.value)}
              aria-label="Position in the song"
              className="w-full accent-[var(--accent)]"
            />
            {!complete && total > 0 && (
              <div className="h-1 overflow-hidden rounded bg-line" title="How much of the song has solfa so far">
                <i
                  className="block h-full bg-accent opacity-60 transition-[width] duration-500"
                  style={{ width: `${(100 * processed) / total}%` }}
                />
              </div>
            )}
          </div>
          <span className="whitespace-nowrap text-sm tabular-nums text-ink-soft">
            {formatTime(now)} / {formatTime(total)}
          </span>
        </div>

        <div className="mt-4">
          <SolfaKeyboard
            range={keyRange}
            active={current >= 0 ? pitches[current] + shift : null}
            chordTones={currentChord ? chordTones(currentChord).map((pc) => (pc + shift + 12) % 12) : []}
            label="The key to press now"
          />
        </div>

        {(keyNotice || ahead) && (
          <p role="status" className="mt-4 rounded-lg bg-accent-soft px-4 py-3 text-sm">
            {ahead
              ? `You're ahead of the transcription. The solfa is ready up to ${formatTime(processed)}; the rest is on its way.`
              : keyNotice}
          </p>
        )}
      </section>

      <details className="no-print mt-4 border-b border-line pb-3">
        <summary className="max-w-full cursor-pointer py-2 font-semibold">
          Settings <span className="ml-2 font-normal text-ink-soft">{settingsSummary}</span>
        </summary>
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
          <label className={fieldLabel}>
            Show
            <select value={notation} onChange={(e) => setNotation(e.target.value as Notation)} className={field}>
              <option value="solfa">Tonic solfa</option>
              <option value="staff">Staff notation</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label className={fieldLabel}>
            Hear
            <select value={hear} onChange={(e) => setHear(e.target.value as typeof hear)} className={field}>
              <option value="both">Song and notes</option>
              <option value="song">The song only</option>
              <option value="synth">Notes only</option>
            </select>
          </label>
          <label className={fieldLabel}>
            Key
            <select
              value={doPc ?? ''}
              onChange={(e) => {
                setDoPc(+e.target.value);
                setUserDo(true);
                setKeyNotice('');
              }}
              className={field}
            >
              {doPc === null && <option value="">Not known yet</option>}
              {NOTE_NAMES.map((name, pc) => (
                <option key={name} value={pc}>
                  do = {name}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabel}>
            Key names
            <select value={String(toC)} onChange={(e) => setToC(e.target.value === 'true')} className={field}>
              <option value="false">As recorded</option>
              <option value="true">Moved so do = C</option>
            </select>
          </label>
          <label className={fieldLabel}>
            Notes
            <select value={String(exact)} onChange={(e) => setExact(e.target.value === 'true')} className={field}>
              <option value="false">Slides cleaned up</option>
              <option value="true">Exact, as sung</option>
            </select>
          </label>
          <label className={fieldLabel}>
            Chords
            <select
              value={String(showChords)}
              onChange={(e) => setShowChords(e.target.value === 'true')}
              className={field}
            >
              <option value="true">Show</option>
              <option value="false">Hide</option>
            </select>
          </label>
          <label className={fieldLabel}>
            Speed
            <select value={rate} onChange={(e) => setRate(+e.target.value)} className={field}>
              <option value={0.5}>Half</option>
              <option value={0.75}>Three quarters</option>
              <option value={1}>Normal</option>
            </select>
          </label>
        </div>
      </details>

      {result && notes.length > 0 && (
        <div className="no-print mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Download or print">
          <button
            onClick={() => print()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
          >
            Print or save as PDF
          </button>
          <DownloadButton
            variant="quiet"
            filename={`${stem} - tonic solfa.txt`}
            prepare={async () =>
              asBlob(toText(notes, chords, { title, keyLine, pitches, home, shift }), 'text/plain;charset=utf-8')
            }
          >
            Solfa as text
          </DownloadButton>
          <DownloadButton
            variant="quiet"
            filename={`${stem}.mid`}
            prepare={async () => asBlob(toMidi(notes, pitches, chords, shift), 'audio/midi')}
          >
            MIDI
          </DownloadButton>
          <DownloadButton
            variant="quiet"
            filename={`${stem}.musicxml`}
            disabled={!staff}
            prepare={async () =>
              staff ? asBlob(toMusicXml(staff, title, shift), 'application/vnd.recordare.musicxml+xml') : null
            }
          >
            MusicXML
          </DownloadButton>
          {!complete && <span className="text-sm text-ink-soft">Downloads include what is done so far.</span>}
        </div>
      )}

      {doPc !== null && (
        <p className="no-print mb-2 mt-5 text-ink-soft">
          {userDo ? (
            <>You set do = {NOTE_NAMES[doPc]}.</>
          ) : (
            <>
              do = {NOTE_NAMES[doPc]}, worked out from {keyEvidence}
              {complete ? '' : ' so far'}.{' '}
              {otherKeys.length > 0 && <>If it sounds wrong, try do = {otherKeys.join(' or ')}.</>}
            </>
          )}
        </p>
      )}

      {showStaff && staff && (
        <section aria-labelledby="staff-heading" className="mt-5 border-b border-line pb-4 print:border-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="staff-heading" className="text-lg font-semibold">
              Staff notation
            </h2>
            <div className="no-print flex flex-wrap gap-3">
              <label className={fieldLabel}>
                Time
                <select value={meter} onChange={(e) => setMeter(+e.target.value as Meter)} className={field}>
                  <option value={4}>4/4</option>
                  <option value={3}>3/4</option>
                  <option value={2}>2/4</option>
                </select>
              </label>
              <label className={fieldLabel}>
                Beat
                <select
                  value={beatScale}
                  onChange={(e) => setBeatScale(+e.target.value as 0.5 | 1 | 2)}
                  className={field}
                >
                  <option value={0.5}>Half as fast</option>
                  <option value={1}>As found</option>
                  <option value={2}>Twice as fast</option>
                </select>
              </label>
              <label className={fieldLabel}>
                First note on beat
                <select value={beat} onChange={(e) => setFirstBeat(+e.target.value)} className={field}>
                  {Array.from({ length: meter }, (_, b) => (
                    <option key={b} value={b}>
                      {b + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <p className="no-print mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
            Pitches match the solfa. Note lengths are fitted to a beat of about {staff.tempo} per minute, so the
            rhythm and bar lines are a starting point to correct, not a finished score. If most notes look too
            short or too long, change the beat; if the bars look wrong, change the time or the first beat.
          </p>
          <StaffView abc={abc} currentBar={currentBar} onBar={(b) => seek(staff.barTimes[b] ?? 0)} />
        </section>
      )}

      <div ref={sheet} hidden={!showSolfa}>
        <Sheet
          phrases={phrases}
          notes={notes}
          pitches={pitches}
          home={home}
          shift={shift}
          doPc={doPc}
          hasChords={chords.length > 0}
          current={current}
          currentChord={currentChord}
          seek={seek}
        />

        {result && !complete ? (
          <p className="py-5 italic text-ink-soft">
            {notes.length
              ? `Working out the notes after ${formatTime(processed)}…`
              : processed > 0
                ? `No singing found up to ${formatTime(processed)}, probably an instrumental intro. Working on the next part…`
                : 'Working out the first notes. You can play the song already.'}
          </p>
        ) : result === null ? (
          <p className="py-5 italic text-ink-soft">Loading…</p>
        ) : null}
      </div>
    </>
  );
}

/**
 * The solfa, phrase by phrase. Every syllable and chord is a button that jumps
 * the song there.
 */
const Sheet = memo(function Sheet({
  phrases,
  notes,
  pitches,
  home,
  shift,
  doPc,
  hasChords,
  current,
  currentChord,
  seek,
}: {
  phrases: Phrase[];
  notes: Note[];
  pitches: number[];
  home: number;
  shift: number;
  doPc: number | null;
  hasChords: boolean;
  current: number;
  currentChord: Chord | null;
  seek: (t: number) => void;
}) {
  return (
    <>
      {phrases.map((phrase, p) => (
        <div
          key={p}
          className="grid gap-1 border-b border-line py-4 break-inside-avoid sm:grid-cols-[3.5rem_1fr] sm:gap-3"
        >
          <button
            onClick={() => seek(phrase.start)}
            className="self-start text-left text-sm tabular-nums text-ink-soft hover:text-accent sm:mt-6 print:text-black"
          >
            {formatTime(phrase.start)}
          </button>
          <div className="flex flex-wrap items-end gap-1">
            {phrase.items.map((item, k) => {
              if (item.kind === 'rest') {
                return (
                  <span key={k} aria-label="rest" className="self-center px-1 text-lg text-ink-soft">
                    –
                  </span>
                );
              }
              if (item.kind === 'chord') {
                const on = item.chord === currentChord;
                return (
                  <button
                    key={k}
                    onClick={() => seek(item.chord.start)}
                    className={`self-center rounded-full border px-3 py-1 text-sm ${
                      on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-accent'
                    }`}
                  >
                    <b>{chordName(item.chord, shift)}</b>{' '}
                    <span className={on ? '' : 'text-ink-soft'}>{chordNumeral(item.chord, doPc)}</span>
                  </button>
                );
              }
              const n = notes[item.index];
              const { syl, mark } = syllable(pitches[item.index], home);
              const cleaned = pitches[item.index] !== exactPitch(n);
              const on = item.index === current;
              return (
                <button
                  key={k}
                  data-note={item.index}
                  onClick={() => seek(n.start)}
                  title={
                    cleaned
                      ? `Sung as ${keyName(exactPitch(n), shift)}; written as the note the singer was aiming for`
                      : undefined
                  }
                  className={`grid min-w-11 justify-items-center gap-0.5 rounded-lg px-2 pb-2 pt-1 ${
                    on ? 'bg-accent text-accent-ink' : 'hover:bg-accent-soft print:text-black'
                  }`}
                >
                  {hasChords && (
                    <span className={`min-h-[1.2em] whitespace-nowrap text-sm ${on ? '' : 'text-accent'}`}>
                      {item.chordAbove && (
                        <>
                          <b>{chordName(item.chordAbove, shift)}</b> {chordNumeral(item.chordAbove, doPc)}
                        </>
                      )}
                    </span>
                  )}
                  <span
                    className={`text-xl font-semibold leading-tight sm:text-2xl ${
                      cleaned ? 'underline decoration-dotted decoration-2 underline-offset-[5px]' : ''
                    }`}
                  >
                    {syl}
                    <span className="text-[0.7em]">{mark}</span>
                  </span>
                  <span
                    className="h-[3px] rounded-sm bg-current opacity-35"
                    style={{ width: Math.min(56, 8 + (n.end - n.start) * 40) }}
                  />
                  <span className={`text-xs ${on ? '' : 'text-ink-soft'}`}>{keyName(pitches[item.index], shift)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
});

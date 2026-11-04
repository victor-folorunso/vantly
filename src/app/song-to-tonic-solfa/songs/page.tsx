import type { Metadata } from 'next';
import Link from 'next/link';
import YourSongs from '@/components/solfa/YourSongs';

/** The songs uploaded from this browser. Private, so never indexed. */
export const metadata: Metadata = {
  title: 'Your songs',
  description: 'Songs you have turned into tonic solfa.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your songs</h1>
        <Link
          href="/song-to-tonic-solfa"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-sm"
        >
          Add a song
        </Link>
      </div>
      <YourSongs />
      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink-faint">
        This list lives in this browser. A song is kept on the server until you delete it, and
        anyone you send its link to can open it.
      </p>
    </div>
  );
}

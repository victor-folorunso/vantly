import type { Metadata } from 'next';
import { Suspense } from 'react';
import SolfaPlayer from '@/components/solfa/SolfaPlayer';

/**
 * One song's player. The song is named in the query string, since a static
 * export cannot know song ids at build time and has no server to answer a
 * path it has not seen.
 *
 * Private, so never indexed: it is somebody's song, and without an id the page
 * has nothing on it anyway.
 */
export const metadata: Metadata = {
  title: 'Your song',
  description: 'Tonic solfa for this song.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-2">
      {/* The id is read from the URL on the client, which is not available while
          this is prerendered, so the boundary is required. */}
      <Suspense fallback={<p className="py-6 text-ink-soft">Loading…</p>}>
        <SolfaPlayer />
      </Suspense>
    </div>
  );
}

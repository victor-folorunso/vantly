import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, toolBySlug } from '@/lib/site';
import { guidesForTool } from '@/lib/guides';
import { FAQ } from '@/lib/solfa/faq';
import SongUpload from '@/components/solfa/SongUpload';
import SolfaDemo from '@/components/solfa/SolfaDemo';
import ToolDocs from '@/components/ToolDocs';

const tool = toolBySlug('song-to-tonic-solfa')!;
const url = `${SITE.url}/song-to-tonic-solfa`;

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: ['song to tonic solfa', 'audio to tonic solfa', 'tonic solfa for keyboard', 'mp3 to solfa'],
  alternates: { canonical: url },
  openGraph: { title: tool.title, description: tool.description, url },
};

/**
 * Song to tonic solfa: upload a recording, get the tune in solfa with the
 * keyboard key under every syllable, and play along.
 *
 * Bigger than most tool pages, because the tool is. The upload sits beside a
 * demo of the player, since nobody has seen solfa light up with a song before
 * and the picture explains it faster than a sentence. Below that, the steps,
 * what it does for a keyboard player, the questions people ask (published as
 * FAQPage data from the same list), the guides, and the doc.
 */
export default function Page() {
  const guides = guidesForTool(tool.slug);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any, runs in a web browser',
      url,
      description: tool.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              <span className="block">Hear a song.</span>
              <span className="block">Play it in tonic solfa.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
              Upload a song and get its tune in tonic solfa, with the keyboard key under every
              syllable and the chords above. Press play and the solfa lights up with the singer.
            </p>
            <div className="mt-8 max-w-xl">
              <SongUpload />
            </div>
            <p className="mt-5 text-sm text-ink-soft">
              <Link href="/song-to-tonic-solfa/songs/" className="text-accent underline underline-offset-4">
                Your songs
              </Link>{' '}
              are the ones uploaded from this browser.
            </p>
          </div>
          <SolfaDemo />
        </div>

        <section aria-labelledby="how" className="mt-24">
          <h2 id="how" className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              [
                'Upload a song',
                'Any recording with a lead singer: an MP3 from your phone, a voice note, a song you love.',
              ],
              [
                'The tune is written down',
                'The singer is separated from the band, every note they sing is written down, and the key and the chords are worked out.',
              ],
              [
                'Play along',
                'The song plays while the current syllable and the key to press light up. Slow it down to half speed while you learn.',
              ],
            ].map(([head, body], i) => (
              <li key={head} className="border-t-2 border-accent pt-4">
                <span className="block text-3xl font-bold leading-none text-accent">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{head}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="keys" className="mt-20">
          <h2 id="keys" className="text-2xl font-semibold tracking-tight">
            Made for the keyboard
          </h2>
          <dl className="mt-8 grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
            {[
              [
                'The key under every note',
                'Each syllable shows the exact key to press, so "so" in G is written G4, not left to you.',
              ],
              [
                'Move it to C',
                'One switch shifts the key names so do is C, and most of the tune lands on white keys.',
              ],
              [
                'Chords above the solfa',
                'The chord name and its number in the key, like IV or V, appear where the chord changes, for your left hand.',
              ],
              [
                'Hear what was written',
                'Switch from the original song to the detected notes on a piano sound and check the transcription by ear.',
              ],
              [
                'Staff notation too',
                'Show the tune on a stave instead of, or beside, the solfa. The rhythm is fitted to the beat and can be adjusted.',
              ],
              [
                'Print, PDF, MIDI, MusicXML',
                'Print it or save a PDF, send it as text, or open it in a keyboard app or MuseScore.',
              ],
            ].map(([term, def]) => (
              <div key={term}>
                <dt className="font-semibold">{term}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-soft">{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-20 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-semibold tracking-tight">
              Questions
            </h2>
            <div className="mt-4 max-w-3xl divide-y divide-line border-b border-line">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary className="cursor-pointer py-3 font-semibold marker:text-ink-faint">{item.q}</summary>
                  <p className="pb-4 leading-relaxed text-ink-soft">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {guides.length > 0 && (
            <aside aria-labelledby="guides">
              <h2 id="guides" className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Guides
              </h2>
              <ul className="mt-4 space-y-4">
                {guides.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/learn/${g.slug}`} className="group block">
                      <span className="font-medium transition-colors group-hover:text-accent">{g.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-faint">{g.minutes} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        <ToolDocs tool={tool.slug} />
      </div>
    </>
  );
}

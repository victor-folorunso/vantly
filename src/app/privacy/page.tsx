import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE, toolBySlug } from '@/lib/site';

const title = 'Privacy';
const description =
  'What Vantly does with your files. Almost every tool runs on your own machine. The three that do not say what happens instead.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/privacy` },
  openGraph: { title, description, url: `${SITE.url}/privacy` },
};

/**
 * The one place on the site that talks about how the site works.
 *
 * It exists because the tool pages deliberately do not. A drop zone that
 * narrates its own upload is noise for the person using it, but somebody who
 * genuinely wants to know has to be able to find out, and that person goes
 * looking for a page with this name rather than reading captions.
 *
 * Written as facts with dates and numbers rather than the usual hedged
 * paragraphs, because a privacy policy that cannot be checked is decoration.
 */

const ROWS: { q: string; a: string }[] = [
  {
    q: 'Do you have my files?',
    a: 'Almost never. Nearly every tool here runs entirely on your own machine, and the file never reaches us. The Word, Excel and PowerPoint viewers are the exception: those send the file to a server, which converts it to a PDF, returns it, and deletes both. Nothing is written to disk and nothing is kept.',
  },
  {
    q: 'Do you have an account for me?',
    a: 'No. There is no sign up, no login and no email box anywhere on the site. We could not tell you apart from anyone else if we wanted to.',
  },
  {
    q: 'Do you track me?',
    a: 'No analytics, no advertising, no third party scripts. The site is a set of static files and there is nothing in it watching you.',
  },
  {
    q: 'What about my IP address?',
    a: 'The conversion service counts requests per visitor so one script cannot run up the bill. It stores a hash rather than the address, and the hash changes every hour, so it can tell two callers apart within an hour and nothing more. Our host keeps ordinary server logs, as every host does.',
  },
  {
    q: 'Do you use cookies?',
    a: 'No.',
  },
  {
    q: 'Who else is involved?',
    a: 'Cloudflare serves the site. Modal runs the conversion service. Neither is sent anything beyond what is described above.',
  },
];

/* The three tools that send a file anywhere. Named here rather than left for
   the reader to work out, because "which ones" is the obvious next question
   after "some of them do". Read from the registry so a fourth cannot be added
   without appearing on this page. */
const SENDS_FILE = ['docx-viewer', 'xlsx-viewer', 'pptx-viewer'];

export default function Page() {
  const uploads = SENDS_FILE.map((slug) => toolBySlug(slug)).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Six questions worth asking of any site that takes a file.
      </p>

      {/* The answers take the width they need and the rail takes the rest,
          rather than a narrow column of text with a third of the page empty
          beside it. */}
      <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <dl className="divide-y divide-line border-t border-line">
          {ROWS.map((row) => (
            <div
              key={row.q}
              className="grid gap-2 py-7 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:gap-10"
            >
              <dt className="text-base font-semibold tracking-tight">{row.q}</dt>
              <dd className="leading-relaxed text-ink-soft">{row.a}</dd>
            </div>
          ))}
        </dl>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Tools that send a file
          </h2>
          <ul className="mt-3 space-y-1">
            {uploads.map((tool) => (
              <li key={tool!.slug}>
                <Link
                  href={`/${tool!.slug}`}
                  className="text-sm text-ink-soft underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  {tool!.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-ink-faint">
            Every other tool on the site runs on your machine.
          </p>

          <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Check it yourself
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-faint">
            The site is open source, so none of this has to be taken on trust.
          </p>
          <a
            href={SITE.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-accent underline underline-offset-4"
          >
            Read the code
          </a>
        </aside>
      </div>
    </div>
  );
}

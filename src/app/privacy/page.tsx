import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

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

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
        Six questions worth asking of any site that takes a file.
      </p>

      <dl className="mt-12 max-w-3xl divide-y divide-line border-t border-line">
        {ROWS.map((row) => (
          <div key={row.q} className="grid gap-2 py-7 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-10">
            <dt className="text-base font-semibold tracking-tight">{row.q}</dt>
            <dd className="leading-relaxed text-ink-soft">{row.a}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ink-faint">
        The site is open source, so none of the above has to be taken on trust.{' '}
        <a
          href={SITE.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4"
        >
          Read the code
        </a>
        . Questions go in an issue there.
      </p>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { allArticles } from '@/lib/learn';
import { SITE } from '@/lib/site';

const title = 'Learn';
const description =
  'Plain answers to the file and format questions people actually search for.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/learn` },
  openGraph: { title, description, url: `${SITE.url}/learn` },
};

export default function Page() {
  const articles = allArticles();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learn</h1>

      {articles.length === 0 ? (
        <p className="mt-6 text-ink-soft">Nothing written yet.</p>
      ) : (
        <ul className="mt-8 space-y-7">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link href={`/learn/${a.slug}`} className="group block">
                <span className="text-lg font-medium transition-colors group-hover:text-accent">
                  {a.title}
                </span>
                <span className="mt-1 block leading-relaxed text-ink-soft">
                  {a.description}
                </span>
                <span className="mt-1.5 block text-xs tabular-nums text-ink-faint">
                  {a.minutes} min
                  {a.tool && ` · ${a.tool.name}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

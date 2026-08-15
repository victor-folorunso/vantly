import type { Metadata } from 'next';
import Link from 'next/link';
import SuggestForm from '@/components/SuggestForm';
import { SITE, TOOLS } from '@/lib/site';
import { CONVERSIONS } from '@/lib/conversions';

const title = 'Suggest a tool or conversion';
const description =
  'Tell us what is missing. Requests with a reason behind them decide what gets built next.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/suggest` },
  openGraph: { title, description, url: `${SITE.url}/suggest` },
};

export default function Page() {
  const planned = [
    ...TOOLS.filter((t) => !t.live).map((t) => ({ href: `/${t.slug}`, label: t.name })),
  ].slice(0, 14);
  const soonCount =
    TOOLS.filter((t) => !t.live).length + CONVERSIONS.filter((c) => !c.live).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        What is missing?
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        This started as a handful of image converters and grew because the same
        formats kept coming up. If the thing you need is not here, say so.
      </p>

      <SuggestForm />

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Already on the list</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          {soonCount} things have a page and a plan but are not built yet. Asking
          for one of these is still useful, since it moves it up the order.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {planned.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="inline-block rounded-lg border border-dashed border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/all" className="text-accent underline underline-offset-4">
            See everything, built or not
          </Link>
        </p>
      </section>

      <section className="mt-14 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight">Or build it yourself</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Every tool here is open source and runs in the browser, so there is no
          backend to set up and no key to get. Adding a conversion is one line in
          a list. The README explains where everything lives.
        </p>
        <a
          href={SITE.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-lg border border-accent px-4 py-2.5 text-sm font-semibold text-accent"
        >
          Open the repository
        </a>
      </section>
    </div>
  );
}

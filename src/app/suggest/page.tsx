import type { Metadata } from 'next';
import SuggestForm from '@/components/SuggestForm';
import { SITE } from '@/lib/site';

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

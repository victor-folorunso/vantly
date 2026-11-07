import type { Metadata } from 'next';
import SuggestForm from '@/components/SuggestForm';
import { SITE } from '@/lib/site';
import ToolHeader from '@/components/ToolHeader';

const title = 'Suggest a tool or conversion';
const description =
  'Tell us what is missing. Requests with a reason behind them decide what gets built next.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/suggest` },
  openGraph: { images: '/og.png', title, description, url: `${SITE.url}/suggest` },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <ToolHeader slug="suggest" lede="If the thing you need is not here, say so.">What is missing?</ToolHeader>

      <SuggestForm />


      <section className="mt-14 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight">Or build it yourself</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Every tool here is open source. Adding a conversion is one line in a
          list. The README explains where everything lives.
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

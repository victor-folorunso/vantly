import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE, LIVE_TOOLS, SOON_TOOLS, toolBySlug } from '@/lib/site';

/**
 * Every tool that does not exist yet still has its own address.
 *
 * Static routes win over this one in Next, so a tool graduates by gaining a
 * folder under src/app and flipping `live` in the tool list. Nothing here needs
 * touching and no URL ever changes, which is the point: a page that moves after
 * it has been linked to loses whatever it had earned.
 *
 * Only unbuilt tools are generated. A live tool reaching this file would mean
 * its folder is missing, and a 404 is a better way to discover that than a
 * coming soon notice sitting on a tool that shipped weeks ago.
 */

export function generateStaticParams() {
  return SOON_TOOLS.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return {};

  return {
    title: `${tool.name} — coming soon`,
    description: tool.description,
    alternates: { canonical: `${SITE.url}/${tool.slug}` },
    // Deliberately out of the index until the tool works. A page that ranks for
    // "compress pdf" and then cannot compress a PDF teaches the visitor and the
    // search engine the same thing, and thin pages drag down the real ones.
    // follow stays on so the links out of here still count.
    robots: { index: false, follow: true },
  };
}

export default async function ComingSoon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool || tool.live) notFound();

  const siblings = SOON_TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {tool.category}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight max-w-3xl">
        {tool.name}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{tool.description}</p>

      <div className="mt-8 max-w-2xl rounded-lg border border-line bg-surface p-6">
        <p className="font-medium">Not built yet.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          This one is on the list rather than finished. When it lands it will
          work the way everything else here does: in your browser, with nothing
          uploaded, no account, and no export you have to pay to unlock.
        </p>
        {tool.promise && (
          <p className="mt-4 border-l-2 border-accent pl-4 leading-relaxed text-ink-soft">
            {tool.promise}
          </p>
        )}
      </div>

      {/* Somebody who landed here wanted to get something done, so what works
          goes above what is planned. */}
      <section className="mt-16 max-w-2xl">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Ready now
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LIVE_TOOLS.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="block h-full rounded-lg border border-line bg-surface p-4 transition-colors hover:border-accent"
              >
                <span className="font-medium">{t.name}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{t.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {siblings.length > 0 && (
        <section className="mt-12 max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Also planned in {tool.category}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}`}
                  className="inline-block rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft hover:border-ink-faint"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE, LIVE_TOOLS, SOON_TOOLS, toolBySlug } from '@/lib/site';
import {
  CONVERSIONS,
  CONVERSION_BY_SLUG,
  conversionTitle,
  conversionDescription,
  relatedConversions,
} from '@/lib/conversions';

/**
 * Everything that does not have its own folder yet: unbuilt tools and every
 * conversion pair.
 *
 * Static routes win over this one in Next, so anything graduates by gaining a
 * folder under src/app and being marked live. No URL changes when that happens,
 * which is the whole reason the addresses exist before the code does. A page
 * that moves after it has been linked to loses whatever it had earned.
 *
 * Live entries are deliberately excluded from generateStaticParams. One
 * reaching this file means its folder is missing, and a 404 is a better way to
 * find that out than a coming soon notice sitting on something that shipped.
 */

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [
    ...SOON_TOOLS.map((t) => ({ slug: t.slug })),
    ...CONVERSIONS.filter((c) => !c.live).map((c) => ({ slug: c.slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  const conversion = CONVERSION_BY_SLUG.get(slug);
  if (conversion) {
    return {
      title: `${conversionTitle(conversion)} — coming soon`,
      description: conversionDescription(conversion),
      alternates: { canonical: `${SITE.url}/${slug}` },
      robots: { index: false, follow: true },
    };
  }

  const tool = toolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — coming soon`,
    description: tool.description,
    alternates: { canonical: `${SITE.url}/${slug}` },
    // Out of the index until it works. Ranking for "compress pdf" and then not
    // compressing a PDF teaches the visitor and the search engine the same
    // thing, and thin pages drag the real ones down with them. follow stays on
    // so the links out of here still count.
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;

  const conversion = CONVERSION_BY_SLUG.get(slug);
  if (conversion && !conversion.live) {
    const related = relatedConversions(conversion, 14);
    return (
      <Shell
        eyebrow={`${conversion.from.label} → ${conversion.to.label}`}
        heading={conversionTitle(conversion)}
        blurb={conversionDescription(conversion)}
      >
        {related.length > 0 && (
          <Related
            heading={`Other ${conversion.from.label} conversions`}
            items={related.map((c) => ({
              slug: c.slug,
              label: `${c.from.label} to ${c.to.label}`,
            }))}
          />
        )}
      </Shell>
    );
  }

  const tool = toolBySlug(slug);
  if (!tool || tool.live) notFound();

  const siblings = SOON_TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug);

  return (
    <Shell eyebrow={tool.category} heading={tool.name} blurb={tool.description} promise={tool.promise}>
      {siblings.length > 0 && (
        <Related
          heading={`Also planned in ${tool.category}`}
          items={siblings.map((t) => ({ slug: t.slug, label: t.name }))}
        />
      )}
    </Shell>
  );
}

function Shell({
  eyebrow,
  heading,
  blurb,
  promise,
  children,
}: {
  eyebrow: string;
  heading: string;
  blurb: string;
  promise?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{eyebrow}</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        {heading}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{blurb}</p>

      <div className="mt-8 max-w-2xl rounded-xl border border-line bg-surface p-6 shadow-sm">
        <p className="font-medium">Not built yet.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          This one is on the list rather than finished. When it lands it will
          work the way everything else here does: in your browser, with nothing
          uploaded, no account, and no export you have to pay to unlock.
        </p>
        {promise && (
          <p className="mt-4 border-l-2 border-accent pl-4 leading-relaxed text-ink-soft">
            {promise}
          </p>
        )}
      </div>

      {/* Somebody who landed here wanted something done, so what works goes
          above what is merely planned. */}
      <section className="mt-14 max-w-2xl">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Ready now
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LIVE_TOOLS.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="block h-full rounded-xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-accent hover:shadow-md"
              >
                <span className="font-medium">{t.name}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{t.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {children}
    </div>
  );
}

function Related({ heading, items }: { heading: string; items: { slug: string; label: string }[] }) {
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{heading}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.slug}>
            <Link
              href={`/${i.slug}`}
              className="inline-block rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

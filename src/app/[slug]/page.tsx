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
  canvasHandles,
  type Conversion,
  type EncodableTarget,
} from '@/lib/conversions';
import ImageConvert from '@/components/ImageConvert';

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
    // Canvas pairs are live and still belong here: they are served by this file
    // rather than by a folder of their own, so a new raster pair costs nothing.
    ...CONVERSIONS.filter((c) => !c.live || canvasHandles(c)).map((c) => ({ slug: c.slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  const conversion = CONVERSION_BY_SLUG.get(slug);
  if (conversion) {
    const working = canvasHandles(conversion);
    return {
      title: working ? conversionTitle(conversion) : `${conversionTitle(conversion)} — coming soon`,
      description: conversionDescription(conversion),
      alternates: { canonical: `${SITE.url}/${slug}` },
      // A page that works belongs in the index. One that does not stays out,
      // because ranking for "convert avif to bmp" and then not doing it teaches
      // the visitor and the search engine the same thing.
      robots: { index: working, follow: true },
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

  if (conversion && canvasHandles(conversion)) {
    const related = relatedConversions(conversion, 14);
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: conversionTitle(conversion),
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Any, runs in a web browser',
              url: `${SITE.url}/${slug}`,
              description: conversionDescription(conversion),
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {conversionTitle(conversion)}
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Convert as many {conversion.from.label} files as you like at once. It
          runs in your browser, so nothing is uploaded and there is no limit on
          how many you can do.
        </p>

        <div className="mt-10">
          <ImageConvert
            target={conversion.to.id as EncodableTarget}
            accept={[conversion.from.id, conversion.from.id === 'jpg' ? 'jpeg' : conversion.from.id]}
            sourceLabel={conversion.from.label}
          />
        </div>

        <ConversionNotes conversion={conversion} />

        {related.length > 0 && (
          <Related
            heading={`Other ${conversion.from.label} conversions`}
            items={related.map((c) => ({
              slug: c.slug,
              label: `${c.from.label} to ${c.to.label}`,
            }))}
          />
        )}
      </div>
    );
  }

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

/**
 * The honest paragraph about what this particular pair costs you.
 *
 * Written from the formats rather than kept as prose per page, because fifteen
 * hand written explanations is fifteen chances to say something that stops
 * being true. Both of these are things a person genuinely gets wrong: that PNG
 * makes a photo smaller, and that going back to a lossless format repairs what
 * a lossy one threw away.
 */
function ConversionNotes({ conversion }: { conversion: Conversion }) {
  const from = conversion.from.id;
  const to = conversion.to.id;
  const LOSSY = ['jpg', 'webp', 'avif'];
  const notes: string[] = [];

  if (to === 'png' && LOSSY.includes(from)) {
    notes.push(
      `PNG is lossless, so nothing more is thrown away here. It does not undo what ${conversion.from.label} already discarded, though, and the file will usually come out larger rather than smaller.`,
    );
  }
  if (to === 'jpg' && from === 'png') {
    notes.push(
      'JPG has no transparency. Anything see through in the original is filled with white, because leaving it alone would come out black.',
    );
  }
  if (to === 'webp') {
    notes.push(
      `WebP is typically 25 to 35 percent smaller than ${conversion.from.label} at the same visible quality, and every current browser reads it. Older desktop software sometimes will not.`,
    );
  }
  if (from === 'gif') {
    notes.push(
      'Only the first frame of an animated GIF is converted. Still images come through whole.',
    );
  }
  if (LOSSY.includes(from) && LOSSY.includes(to)) {
    notes.push(
      'Both formats are lossy, so this is a second round of compression on top of the first. At 90 percent quality that is rarely visible, but converting back and forth repeatedly will show.',
    );
  }

  if (!notes.length) return null;

  return (
    <section className="mt-14 max-w-2xl">
      <h2 className="text-xl font-semibold tracking-tight">What to expect</h2>
      <ul className="mt-4 space-y-3">
        {notes.map((n) => (
          <li key={n} className="leading-relaxed text-ink-soft">
            {n}
          </li>
        ))}
      </ul>
    </section>
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

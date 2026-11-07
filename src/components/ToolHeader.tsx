import Link from 'next/link';
import { toolBySlug } from '@/lib/site';
import { CONVERSION_BY_SLUG } from '@/lib/conversions';

/**
 * How every tool page opens: where it sits, what it is called, what it does.
 *
 * A hundred and twenty pages each wrote this by hand, the same h1 and the same
 * paragraph copied with small drifts in spacing, so any change to how a tool
 * page opens meant editing all of them. It is one component now.
 *
 * The label above the title is the tool's category, linked to that section of
 * the toolbox. It tells somebody who landed from a search what kind of site
 * this is, and gives them a way sideways that is not the back button.
 */
export default function ToolHeader({
  slug,
  eyebrow,
  lede,
  children,
}: {
  /** Looks up the category. Leave it out and pass eyebrow for anything else. */
  slug?: string;
  /** Overrides the category label. */
  eyebrow?: string;
  /** The line under the title. */
  lede?: React.ReactNode;
  /** The title itself. */
  children: React.ReactNode;
}) {
  const category =
    eyebrow ??
    (slug ? (toolBySlug(slug)?.category ?? (CONVERSION_BY_SLUG.has(slug) ? 'Conversions' : undefined)) : undefined);

  return (
    <header>
      {category && (
        <Link
          href={`/all#${category.toLowerCase()}`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:text-ink"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          {category}
        </Link>
      )}
      <h1
        className={`${category ? 'mt-3' : ''} max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]`}
      >
        {children}
      </h1>
      {lede && <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-soft">{lede}</p>}
    </header>
  );
}

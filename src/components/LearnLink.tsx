import Link from 'next/link';
import { articlesForTool } from '@/lib/learn';

/**
 * One link to the article for this tool. Nothing else.
 *
 * This was a bulleted "Worth knowing" list, added to fix pages that were too
 * thin after the FAQ blocks came off. It fixed the word count and made every
 * tool page carry four paragraphs of prose nobody came for. The tool is the
 * page; the reading belongs behind a link.
 *
 * Renders nothing when the tool has no article, so a page without one stays
 * clean rather than showing an empty heading.
 */
export default function LearnLink({ tool }: { tool: string }) {
  const article = articlesForTool(tool)[0];
  if (!article) return null;

  return (
    <Link
      href={`/learn/${article.slug}`}
      className="mt-14 flex max-w-2xl items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-accent"
    >
      <span>
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Docs
        </span>
        <span className="mt-1 block font-medium">{article.title}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0 text-ink-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}

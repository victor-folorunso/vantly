import Link from 'next/link';
import { articlesForTool } from '@/lib/learn';
import { TOOL_NOTES } from '@/lib/toolNotes';

/**
 * What sits under a tool: the things worth knowing, then the article.
 *
 * Replaces the FAQ block that used to be here. Those were too thin to rank on
 * their own and in the way of somebody who came to use the tool, and Google
 * stopped showing FAQ rich results for most sites in 2023, so the schema was
 * buying nothing either.
 *
 * Removing them left 22 pages under 200 words, which counts as thin and drags
 * the whole domain. The fix is not to put the FAQs back but to say the true,
 * useful things a person is about to trip over, and to send anyone who wants
 * the long version to an article written for that question alone.
 *
 * Renders nothing at all when there is neither, so an unbuilt tool shows a
 * clean page rather than empty headings.
 */
export default function LearnLink({ tool }: { tool: string }) {
  const articles = articlesForTool(tool);
  const notes = TOOL_NOTES[tool] ?? [];
  if (articles.length === 0 && notes.length === 0) return null;

  return (
    <div className="mt-16 max-w-2xl border-t border-line pt-8">
      {notes.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Worth knowing
          </h2>
          <ul className="mt-4 space-y-3">
            {notes.map((n) => (
              <li key={n} className="flex gap-3 leading-relaxed text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                />
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}

      {articles.length > 0 && (
        <section className={notes.length > 0 ? 'mt-10' : ''}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Read more
          </h2>
          <ul className="mt-4 space-y-4">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.slug}`} className="group block">
                  <span className="font-medium transition-colors group-hover:text-accent">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">
                    {a.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import Link from 'next/link';
import { articlesForTool } from '@/lib/learn';

/**
 * Replaces the FAQ block that used to sit under every tool.
 *
 * Those FAQs were the worst of both intents. Too thin to rank on their own, and
 * in the way of somebody who came to use the tool. The answers that were worth
 * keeping now live in a /learn article, which is one page aimed at one question
 * rather than five paragraphs bolted to the bottom of a converter.
 *
 * Renders nothing when there is no article, so a tool without one shows a clean
 * page rather than an empty heading.
 */
export default function LearnLink({ tool }: { tool: string }) {
  const articles = articlesForTool(tool);
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 max-w-2xl border-t border-line pt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        More about this
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
  );
}

import { docForTool } from '@/lib/docs';

/**
 * The documentation for a tool, on the tool's own page.
 *
 * Placed well below the interface behind a rule and a lot of space. The
 * complaint about the earlier version was never that the page had words on it,
 * it was that they sat directly under the tool, between the reader and what
 * they came for. Somebody who wants the converter never scrolls this far.
 *
 * Two columns, because the doc was leaving half the page empty and the fix for
 * empty space beside prose is a second column rather than a wider paragraph. A
 * line of eighty characters is already at the limit of comfortable reading, and
 * stretching it to fill a 1200px container makes the text harder to read, not
 * better used.
 *
 * So the right rail carries the contents, built from the headings the markdown
 * already produced. It fills the space with something worth having, and a doc
 * of a thousand words genuinely needs it.
 *
 * Renders nothing when a tool has no doc, so the page stays clean.
 */

/** Pull the h2s out of the rendered HTML and give each one an id to jump to. */
function outline(html: string) {
  const items: { id: string; text: string }[] = [];
  const withIds = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    items.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: withIds, items };
}

export default function ToolDocs({ tool }: { tool: string }) {
  const doc = docForTool(tool);
  if (!doc) return null;

  const { html, items } = outline(doc.html);

  return (
    <>
      {/* The article half of the page. The tool half already declares
          SoftwareApplication, and both being true of one URL is the point of
          putting them together. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: doc.title,
            description: doc.description,
            dateModified: doc.updated || undefined,
          }),
        }}
      />

      <section id="docs" className="mt-24 scroll-mt-20 border-t border-line pt-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Docs</p>
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          {doc.title}
        </h2>
        {doc.description && (
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">{doc.description}</p>
        )}

        <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_200px]">
          <div className="prose-vantly" dangerouslySetInnerHTML={{ __html: html }} />

          {items.length > 2 && (
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  On this page
                </p>
                <ul className="mt-3 space-y-2">
                  {items.map((i) => (
                    <li key={i.id}>
                      <a
                        href={`#${i.id}`}
                        className="block text-sm leading-snug text-ink-soft transition-colors hover:text-accent"
                      >
                        {i.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}

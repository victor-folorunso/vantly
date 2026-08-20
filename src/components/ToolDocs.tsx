import { docForTool } from '@/lib/docs';

/**
 * The documentation for a tool, on the tool's own page.
 *
 * Placed well below the interface behind a rule and a lot of space, because the
 * complaint about the last version was never that the page had words on it. It
 * was that they sat directly under the tool, between the reader and the thing
 * they came for. Somebody who wants the converter never scrolls this far, and
 * somebody who wants to understand the format finds it without leaving.
 *
 * Renders nothing when a tool has no doc yet, so the page stays clean rather
 * than showing an empty heading.
 */
export default function ToolDocs({ tool }: { tool: string }) {
  const doc = docForTool(tool);
  if (!doc) return null;

  return (
    <>
      {/* Structured data for the article half of the page. The tool half
          already declares SoftwareApplication, and both being true of one URL
          is the point of putting them together. */}
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
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Docs</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {doc.title}
          </h2>
          {doc.description && (
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{doc.description}</p>
          )}

          <div className="prose-vantly mt-8" dangerouslySetInnerHTML={{ __html: doc.html }} />
        </div>
      </section>
    </>
  );
}

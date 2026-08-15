import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Search from '@/components/Search';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.tagline,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    url: SITE.url,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-ground/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
            <Link
              href="/"
              className="shrink-0 text-lg font-semibold tracking-tight"
            >
              {SITE.name}
            </Link>
            <div className="hidden min-w-0 flex-1 sm:block">
              <Search placeholder="Search conversions and tools…" />
            </div>
            <Link
              href="/#tools"
              className="shrink-0 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              All tools
            </Link>
          </div>
          <div className="mx-auto w-full max-w-6xl px-5 pb-3 sm:hidden">
            <Search placeholder="Search…" />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <Footer />
      </body>
    </html>
  );
}

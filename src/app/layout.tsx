import type { Metadata } from 'next';
import Link from 'next/link';
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
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto w-full max-w-6xl px-5 h-16 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              {SITE.name}
            </Link>
            <nav className="text-sm text-ink-soft">
              <Link href="/#tools" className="hover:text-ink">
                All tools
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line mt-24">
          <div className="mx-auto w-full max-w-6xl px-5 py-10 text-sm text-ink-faint">
            <p>
              Everything here runs in your browser. Files are not uploaded and
              nothing is stored.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} {SITE.name}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

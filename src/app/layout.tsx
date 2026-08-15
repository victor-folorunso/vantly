import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Search from '@/components/Search';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}, ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.tagline,
  applicationName: SITE.name,
  // Individual pages set their own canonical. Without one here the home page
  // had none at all, which leaves the trailing slash and any query string a
  // link happens to carry looking like separate pages.
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    url: SITE.url,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    // summary_large_image rather than summary. The default renders a small
    // square thumbnail beside the text, which wastes the picture entirely.
    card: 'summary_large_image',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f7' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1917' },
  ],
};

/*
  Site level structured data, stated once here rather than on every page.

  SearchAction is the one worth having: it tells Google the site has its own
  search, and the conversions are numerous enough that being searchable from a
  result is genuinely useful rather than decorative.
*/
const siteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  description: SITE.tagline,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
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

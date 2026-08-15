import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Search from '@/components/Search';
import BackLink from '@/components/BackLink';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
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
          <div className="h-[3px] w-full bg-accent" />
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5">
            <Link href="/" className="flex shrink-0 basis-40 items-center gap-2.5">
              {/* The mark rather than an <img>, so it inherits colour and stays
                  sharp at any zoom without a second request. */}
              <svg viewBox="0 0 100 100" className="size-7" aria-hidden="true">
                <mask id="brand">
                  <rect width="100" height="100" fill="#fff" />
                  <rect x="15" y="15" width="40" height="40" rx="6" />
                  <rect x="45" y="45" width="40" height="40" rx="6" />
                  <rect
                    x="45"
                    y="45"
                    width="40"
                    height="40"
                    rx="6"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="11"
                  />
                </mask>
                <rect
                  width="100"
                  height="100"
                  rx="24"
                  className="fill-[var(--accent)]"
                  mask="url(#brand)"
                />
              </svg>
              <span className="text-lg font-semibold tracking-tight">{SITE.name}</span>
            </Link>
            <div className="hidden flex-1 justify-center sm:flex">
              <div className="w-full max-w-sm">
                <Search placeholder="Search tools…" />
              </div>
            </div>
            {/* A toolbox rather than the words. It survives a narrow screen,
                and the title carries the name for anyone who needs it. */}
            <Link
              href="/all"
              title="Toolbox"
              className="flex shrink-0 basis-40 items-center justify-end gap-2"
            >
              <span className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent">
                <svg
                  viewBox="0 0 24 24"
                  className="size-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
                  <rect x="3" y="7" width="18" height="12" rx="2" />
                  <path d="M3 12h18" />
                  <path d="M10 12v2h4v-2" />
                </svg>
                Toolbox
              </span>
            </Link>
          </div>
          <div className="mx-auto w-full max-w-6xl px-5 pb-3 sm:hidden">
            <Search placeholder="Search…" />
          </div>
        </header>

        <BackLink />

        <main className="flex-1">{children}</main>

        <Footer />
      </body>
    </html>
  );
}

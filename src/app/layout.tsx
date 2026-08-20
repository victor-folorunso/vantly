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
          <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center gap-4 px-8">
            <Link href="/" className="flex shrink-0 basis-64 items-center gap-2.5">
              {/* The icon is a raster render now, so it is an img rather than
                  inline SVG. Fixed dimensions to keep it out of the layout
                  shift, and 192 as the source so it stays crisp on a retina
                  screen at 28 logical pixels. */}
              <img
                src="/icon-192.png"
                alt=""
                width={44}
                height={44}
                className="size-11"
              />
              {/* The tagline sits with the wordmark rather than as a page
                  heading. It belongs to the brand, not to the home page, and
                  as an h1 above the picker it pushed the actual tool down. */}
              <span className="flex flex-col leading-none gap-0.5">
                <span className="text-lg font-semibold tracking-tight">{SITE.name}</span>
                <span className="hidden whitespace-nowrap text-xs text-ink-faint sm:block">
                  Everyday tools for <span className="font-medium text-accent">everyone</span>
                </span>
              </span>
            </Link>
            <div className="hidden flex-1 justify-center sm:flex">
              <div className="w-full max-w-sm">
                <Search placeholder="Search tools…" />
              </div>
            </div>
            {/* Both destinations on the right, styled the same, so they read as
                a pair of controls rather than one link and one button. The
                labels drop below 640px and the icons carry it, which is why
                each keeps a title and an aria-label. */}
            <div className="flex shrink-0 basis-64 items-center justify-end gap-2">
              <Link
                href="/learn"
                title="Learn"
                aria-label="Learn"
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
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
                  <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 16Z" />
                  <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16Z" />
                </svg>
                <span className="hidden md:inline">Learn</span>
              </Link>

              <Link
                href="/all"
                title="Toolbox"
                aria-label="Toolbox"
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
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
                <span className="hidden md:inline">Toolbox</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[80rem] px-8 pb-3 sm:hidden">
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

import type { NextConfig } from 'next';

/*
  Static export: the build produces plain HTML, CSS and JS in out/, with no
  Node process behind it.

  Nothing here needs a server. Every tool runs in the browser, there is no
  database, no session, and no request that has to be handled at read time. Once
  that is true, exporting is strictly better: any host will serve it, including
  the free ones, and moving between them is copying a folder rather than a
  migration. It also removes a whole class of hosting-specific behaviour from
  ever mattering.

  This is enforced rather than incidental. Adding a route handler or a call to
  cookies() will now fail the build instead of quietly turning the site into
  something that needs a runtime.
*/
const nextConfig: NextConfig = {
  output: 'export',

  // Directory-style URLs, so /png-to-webp is served as /png-to-webp/index.html.
  // Static hosts differ on whether they will serve an extensionless file, and
  // this is the form all of them agree on.
  trailingSlash: true,

  images: {
    // No server means no image optimiser. Nothing here uses next/image on
    // remote files, and the tools generate their own previews as blob URLs.
    unoptimized: true,
  },
};

export default nextConfig;

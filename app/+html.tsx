import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

import {
  APP_NAME,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  APP_WEB_TITLE,
  SITE_ORIGIN,
  SITE_ORIGIN_WWW,
  THEME_COLOR_WEB,
} from '@/lib/app-meta';

const siteUrl = SITE_ORIGIN;
const siteTitle = APP_WEB_TITLE;
const siteDescription = APP_WEB_DESCRIPTION;
/** Open Graph / Twitter — 1200×630 recommended; regenerate via `node scripts/ship-assets.mjs`. */
const ogImageUrl = `${siteUrl}/assets/images/social-preview.png`;
/** Square app icon for JSON-LD Organization.logo (Google prefers ≥112×112). */
const siteLogoUrl = `${siteUrl}/assets/images/icon.png`;

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: APP_NAME,
  url: siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: siteLogoUrl,
  },
  sameAs: [SITE_ORIGIN_WWW],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  url: siteUrl,
  description: siteDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en-AU">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content={APP_WEB_KEYWORDS} />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
        <link rel="canonical" href={siteUrl} />
        <link rel="alternate" hrefLang="en-au" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
        <link rel="icon" href="/assets/images/favicon.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_AU" />
        <meta property="og:site_name" content={APP_NAME} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={ogImageUrl} />

        <meta name="theme-color" content={THEME_COLOR_WEB} />
        <ScrollViewStyleReset />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
:root { color-scheme: light; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible,
[role="link"]:focus-visible,
[role="menuitem"]:focus-visible,
[tabindex]:not([tabindex="-1"]):focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

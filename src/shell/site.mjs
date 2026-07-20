/**
 * Site-level identity, in one place.
 *
 * The SPA spread these across `index.html`, `seoUtils.js` and `SEOHead.jsx`
 * and they disagreed: the site called itself `RussTools` in og:site_name and
 * schema, `russ.tools` in the shell, and the theme colour in `index.html`
 * (`#1c7ed6`) had not matched `site.webmanifest` (`#1e1e2e`) since the
 * palette work. One name, one colour, one author, imported by whoever needs
 * them.
 */

export const SITE_URL = 'https://russ.tools';
export const SITE_NAME = 'russ.tools';

export const SITE_DESCRIPTION =
  'Fifteen focused tools for network, cloud and platform work — subnetting, ' +
  'DNS, WHOIS, SSL, JWT, Azure naming and KQL, and more. Everything runs in ' +
  'your browser: no accounts, no analytics, nothing uploaded.';

export const AUTHOR = {
  name: 'Russ McKendrick',
  url: 'https://github.com/russmckendrick',
  twitter: '@russmckendrick',
};

/**
 * Matches the Catppuccin Mocha ground — the default palette the pre-paint
 * script applies, so the browser chrome agrees with the first frame rather
 * than with whatever the palette used to be.
 */
export const THEME_COLOR = '#1e1e2e';

/** @param {string} path @returns {string} absolute, no trailing slash */
export const absolute = (path) => new URL(path, SITE_URL).href.replace(/\/$/, '');

/** The author, as a schema.org Person. Used as both author and publisher. */
export const PERSON_SCHEMA = {
  '@type': 'Person',
  name: AUTHOR.name,
  url: AUTHOR.url,
};

/** The site, as a schema.org WebSite. Tool pages reference it via isPartOf. */
export const WEBSITE_SCHEMA = {
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
};

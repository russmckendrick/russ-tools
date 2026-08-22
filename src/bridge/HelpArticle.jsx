import React from 'react';
import ReactMarkdown from 'react-markdown';

import { helpHeadingId } from '@/lib/helpMarkdown';

/**
 * The help page's article body: the manifest's help markdown, rendered once
 * at build time. `help.astro` mounts this with no client directive, so the
 * reader gets prerendered HTML and react-markdown never ships to the browser
 * — the drawer used to load it on demand; the page pays for it at build.
 *
 * Styling lives on `.rt-help-article` in shell.css as element rules; the one
 * component override is `h2`, which needs the anchor id the jump chips point
 * at. `helpHeadingId` is shared with `helpHeadings`, so the two cannot drift.
 *
 * @param {{ markdown: string }} props
 */
export default function HelpArticle({ markdown }) {
  return (
    <article className="rt-help-article">
      <ReactMarkdown components={{ h2: SectionHeading }}>{markdown}</ReactMarkdown>
    </article>
  );
}

/** @param {{ children: React.ReactNode }} props */
function SectionHeading({ children }) {
  const text = React.Children.toArray(children)
    .filter((child) => typeof child === 'string')
    .join('');

  return <h2 id={helpHeadingId(text)}>{children}</h2>;
}

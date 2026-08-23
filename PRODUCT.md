# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the search-arrival stranger.** Someone who typed "subnet calculator", "decode
jwt" or "check ssl certificate" into a search engine, landed directly on one tool page,
and has never seen the rest of the site. They arrive mid-task with a specific question,
carry no context about what russ.tools is, and will leave the moment the question is
answered unless given a reason not to.

Every tool page is therefore an entry point, not an interior page. It cannot assume the
visitor came via the index, knows the conventions, or has read anything.

**The goal is conversion to the set.** Answering the question is the price of entry, not
the finish line — a tool page's second job is to make the wider toolkit visible and worth
bookmarking. Turning a one-off visitor into a returning one is an explicit product goal,
not a nice-to-have.

**Secondary: the returning engineer.** Infrastructure, cloud and network practitioners —
including the author — who have made that conversion and now reach for a bookmarked tool
mid-ticket. They want speed and zero friction; they do not need orientation.

## Product Purpose

A set of 24 small, focused utilities for people who work with networks, cloud platforms
and certificates: subnet planning and set arithmetic, DNS and routing analysis, WHOIS and
SSL inspection, Azure and Microsoft reference work, JWT decoding, password generation,
encoders and format converters.

Success is a stranger getting a correct answer to one specific question in seconds, and
enough of them realising there is a whole toolkit here that they come back for the second
question without a search engine in between.

## Positioning

**One coherent toolkit, not a pile of separate pages.** The competitive field is a long tail
of single-purpose, ad-laden, individually-owned utility pages — a different site for the
subnet calculator, another for the JWT decoder, each with its own layout, its own
conventions and its own interstitials. russ.tools is one set of tools sharing one shell,
one design system, one set of conventions, one deep-link grammar and one privacy posture.

That coherence is the thing a competitor cannot cheaply copy: it is not a feature of any
single tool, it is a property of the whole. It is also what makes the conversion goal
above achievable — a stranger who trusts one tool has a reason to trust the rest.

Supporting, not primary: local work stays in the browser, lookup tools name the network
provider they contact, every result is a shareable URL, and the tools encode real
operational judgement — CAF naming rules, KQL scaffolding, GDAP portal deep links — rather
than generic textbook implementations.

## Operating Context

- **Entry is by search, into a tool page.** `/ssl-checker`, `/subnet-calculator` and the
  rest are landing pages in the literal sense. The index at `/` is a secondary surface,
  reached mostly by people who already know the site.
- **Use is mid-task and interrupted.** The visitor has a ticket, a terminal or an incident
  open in another tab. Time-to-answer dominates every other consideration.
- **Results travel.** Tools that take an input support deep links
  (`/ssl-checker/example.com`, `/jwt/<token>`); tools with more state share a compressed
  `?config` link. Links get pasted into tickets, Slack and documentation, so a shared URL
  must reproduce the same state for the recipient.
- **Sensitive material gets pasted in.** Tokens, certificates and internal addressing go
  into these tools. The client-side guarantee is what makes that acceptable.
- **Local state is real user data.** Saved networks, histories and preferences live in the
  browser's local storage; `/delete` lists exactly what each tool has stored and clears it
  per tool or all at once.

## Capabilities and Constraints

- 24 tools, each one folder under `src/tools/<id>/` with a `manifest.mjs` that
  declares path, category, icon, deep-link params, storage keys and SEO. Everything else —
  the page, the index card, the sitemap entry, the redirects, the Open Graph card, the
  `/delete` listing — is derived from it.
- Six tool categories (Network, Azure, Microsoft, Security, Developer, Content) are a
  functional taxonomy, not decoration.
- Static output on Cloudflare Pages; every page prerendered, one React island per tool.
- Local processing is the default. Lookup tools state when they send the queried name or
  address to Google or Cloudflare DNS-over-HTTPS, RIPEstat, or one of the three Cloudflare
  Workers used for WHOIS, SSL analysis and Microsoft tenant discovery.
- Frozen technical contracts (deep-link routes, the share-link codec, localStorage
  migrations, per-tool SEO, Worker request/response schemas) are documented in
  `CLAUDE.md`. They are compatibility promises to already-published links.
- Open source, MIT-era "provided as-is, without warranty"; built and maintained by one
  person.

## Brand Commitments

- **Name:** russ.tools. Built by Russ McKendrick; open source on GitHub.
- **No accounts, ever.** No sign-up, no login, no server-side user state. Any capability
  that would require an account is permanently out of scope.
- **No ads, analytics, tracking or upsell, ever.** The site makes no measurement of its
  visitors, and the README says so publicly. This is a binding commitment, not a
  current-state description.
- **Voice:** plain, understated, technically literal. The existing copy states what a
  thing does and stops — the index page's own comments record that a hero and a stat strip
  were removed for "selling the site to someone already on it". No marketing register, no
  slogans dressed as metrics.

## Evidence on Hand

- **Real:** a working 24-tool set; per-tool documentation in `docs/tools/`; a public
  GitHub repository; the `/delete` page as a demonstrable privacy claim; deep links that
  can be handed to anyone as proof.
- **Absent — do not fabricate:** there are no user counts, traffic figures, testimonials,
  customer logos, case studies, press mentions, uptime numbers, ratings or awards. No
  future work may invent them or imply them through design (no "trusted by", no
  placeholder logo wall, no counter).

## Product Principles

1. **The tool page is the front door.** Design every tool page for someone who arrived
   there first and knows nothing, not for someone who navigated in from the index.
2. **Answer first, then invite.** Nothing may compete with time-to-answer. The toolkit
   sells itself after the visitor has what they came for, never before.
3. **Coherence is the product.** A change that improves one tool at the cost of the shared
   grammar is a net loss — the set is worth more than the parts.
4. **Nothing leaves the browser without saying so.** Client-side by default; every lookup
   names the resolver, API or Worker it contacts.
5. **A link is the unit of sharing.** Any state worth reaching is worth a URL, and a URL
   that was ever published keeps working.

## Accessibility & Inclusion

No product-specific requirement was established with the user beyond what the codebase
already enforces: WCAG contrast floors are asserted in CI for both themes, ambient motion
is disabled under `prefers-reduced-motion`, and colour is never the sole carrier of meaning
(category and status always carry a text label). Treat those as the standing floor.

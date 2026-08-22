import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'russ-tools';

// DESIGN.md calls Card "the tool tile, and the workhorse" — the home-page
// tile and the panel that wraps input and results on every tool page.

export const ToolTile = () => (
  <Card style={{ maxWidth: 380 }}>
    <CardHeader>
      <CardTitle>DNS Lookup</CardTitle>
      <CardDescription>
        Resolve A, AAAA, MX, TXT and NS records for any domain, with DNSSEC status.
      </CardDescription>
    </CardHeader>
    <CardFooter>
      <Badge>network</Badge>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-on-surface-faint)' }}>
        /dns-lookup
      </span>
    </CardFooter>
  </Card>
);

export const Panel = () => (
  <Card style={{ maxWidth: 520 }}>
    <CardHeader>
      <CardTitle>Certificate</CardTitle>
      <CardDescription>Issued by Let&apos;s Encrypt R3, valid for 61 more days.</CardDescription>
    </CardHeader>
    <CardContent>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0, fontSize: 13 }}>
        <dt style={{ color: 'var(--color-on-surface-muted)' }}>Common name</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>russ.tools</dd>
        <dt style={{ color: 'var(--color-on-surface-muted)' }}>Serial</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>03:f2:a1:9c:44:8e</dd>
        <dt style={{ color: 'var(--color-on-surface-muted)' }}>Expires</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>2026-10-15</dd>
      </dl>
    </CardContent>
    <CardFooter>
      <Badge variant="success">valid</Badge>
      <Badge variant="secondary">TLS 1.3</Badge>
    </CardFooter>
  </Card>
);

// Each tile carries its own category hue, exactly as ToolCard.astro does:
// `style={--cat: var(--color-category-<id>)}`. Without this the tiles would
// all inherit one hue from the page and the category would stop meaning
// anything.
export const Grid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 720 }}>
    <Card style={{ '--cat': 'var(--color-category-network)' }}>
      <CardHeader>
        <CardTitle>Subnet Calculator</CardTitle>
        <CardDescription>Plan IPv4 space and split networks into evenly sized subnets.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Badge>network</Badge>
      </CardFooter>
    </Card>
    <Card style={{ '--cat': 'var(--color-category-developer)' }}>
      <CardHeader>
        <CardTitle>JWT Decoder</CardTitle>
        <CardDescription>Inspect header, payload and expiry without sending the token anywhere.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Badge>developer</Badge>
      </CardFooter>
    </Card>
  </div>
);

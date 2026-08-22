import { Tabs, TabsContent, TabsList, TabsTrigger } from 'russ-tools';

const body = {
  padding: '12px 2px',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  color: 'var(--color-on-surface-muted)',
} as const;

export const Peers = () => (
  <div style={{ maxWidth: 520 }}>
    <Tabs defaultValue="decoded">
      <TabsList>
        <TabsTrigger value="decoded">Decoded</TabsTrigger>
        <TabsTrigger value="raw">Raw</TabsTrigger>
        <TabsTrigger value="signature">Signature</TabsTrigger>
      </TabsList>
      <TabsContent value="decoded">
        <div style={body}>{'{ "sub": "1234567890", "name": "Russ", "iat": 1516239022 }'}</div>
      </TabsContent>
      <TabsContent value="raw">
        <div style={body}>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…</div>
      </TabsContent>
      <TabsContent value="signature">
        <div style={body}>HS256 — verified</div>
      </TabsContent>
    </Tabs>
  </div>
);

export const TwoUp = () => (
  <div style={{ maxWidth: 420 }}>
    <Tabs defaultValue="ipv4">
      <TabsList>
        <TabsTrigger value="ipv4">IPv4</TabsTrigger>
        <TabsTrigger value="ipv6">IPv6</TabsTrigger>
      </TabsList>
      <TabsContent value="ipv4">
        <div style={body}>10.0.0.0/16 — 65534 usable hosts</div>
      </TabsContent>
      <TabsContent value="ipv6">
        <div style={body}>2001:db8::/32</div>
      </TabsContent>
    </Tabs>
  </div>
);

import { Badge, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from 'russ-tools';

// DESIGN.md: "monospace, odd rows tinted with surface-inset, the type column
// in the category hue. This is how all record-style output is rendered."

export const DnsRecords = () => (
  <div style={{ maxWidth: 720 }}>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>TTL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell style={{ color: 'var(--cat)' }}>A</TableCell>
          <TableCell>russ.tools</TableCell>
          <TableCell>104.21.34.12</TableCell>
          <TableCell>300</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ color: 'var(--cat)' }}>AAAA</TableCell>
          <TableCell>russ.tools</TableCell>
          <TableCell>2606:4700:3033::6815:220c</TableCell>
          <TableCell>300</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ color: 'var(--cat)' }}>MX</TableCell>
          <TableCell>russ.tools</TableCell>
          <TableCell>10 mx.improvmx.com</TableCell>
          <TableCell>3600</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ color: 'var(--cat)' }}>TXT</TableCell>
          <TableCell>russ.tools</TableCell>
          <TableCell>v=spf1 include:spf.improvmx.com ~all</TableCell>
          <TableCell>3600</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ color: 'var(--cat)' }}>NS</TableCell>
          <TableCell>russ.tools</TableCell>
          <TableCell>dana.ns.cloudflare.com</TableCell>
          <TableCell>86400</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export const WithStatus = () => (
  <div style={{ maxWidth: 720 }}>
    <Table>
      <TableCaption>Five most recent lookups, newest first.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Domain</TableHead>
          <TableHead>Checked</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>russ.tools</TableCell>
          <TableCell>2026-08-15</TableCell>
          <TableCell>2026-10-15</TableCell>
          <TableCell>
            <Badge variant="success">valid</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>example.com</TableCell>
          <TableCell>2026-08-14</TableCell>
          <TableCell>2026-09-02</TableCell>
          <TableCell>
            <Badge variant="warning">expiring</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>legacy.internal</TableCell>
          <TableCell>2026-08-11</TableCell>
          <TableCell>2026-07-30</TableCell>
          <TableCell>
            <Badge variant="destructive">expired</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

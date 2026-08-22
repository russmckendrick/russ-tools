import { Alert, AlertDescription, AlertTitle } from 'russ-tools';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

const stack = { display: 'grid', gap: 12, maxWidth: 560 } as const;

export const Variants = () => (
  <div style={stack}>
    <Alert>
      <Info />
      <AlertTitle>Query cached</AlertTitle>
      <AlertDescription>Served from the resolver cache 14 seconds ago.</AlertDescription>
    </Alert>
    <Alert variant="success">
      <CircleCheck />
      <AlertTitle>Certificate valid</AlertTitle>
      <AlertDescription>Issued by Let&apos;s Encrypt R3, expires 2026-10-15.</AlertDescription>
    </Alert>
    <Alert variant="warning">
      <TriangleAlert />
      <AlertTitle>Certificate expires in 12 days</AlertTitle>
      <AlertDescription>Renew before 2026-09-02 to avoid downtime.</AlertDescription>
    </Alert>
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>Lookup failed</AlertTitle>
      <AlertDescription>NXDOMAIN — no such host is known for example.invalid.</AlertDescription>
    </Alert>
  </div>
);

export const TitleOnly = () => (
  <div style={stack}>
    <Alert variant="warning">
      <TriangleAlert />
      <AlertTitle>This token has already expired</AlertTitle>
    </Alert>
  </div>
);

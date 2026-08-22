import {
  Badge,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from 'russ-tools';

// A panel that slides in from the right, over the page scrim, so the work
// stays visible behind it. Rendered `open` for the card.
export const Details = () => (
  <Sheet open>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Certificate chain</SheetTitle>
        <SheetDescription>Three certificates presented by russ.tools.</SheetDescription>
      </SheetHeader>
      <div style={{ display: 'grid', gap: 14, padding: '16px 0', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <Badge variant="success">leaf</Badge>
          <span>CN=russ.tools</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <Badge variant="secondary">intermediate</Badge>
          <span>CN=E5, O=Let&apos;s Encrypt</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <Badge variant="secondary">root</Badge>
          <span>CN=ISRG Root X1</span>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

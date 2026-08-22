---
category: Surfaces
---
An inline status block for a message that belongs in the page flow rather than over it.

Use for validation results, parse errors and non-blocking warnings shown beside the thing they describe. For transient confirmations use a toast instead; for something that must interrupt, use Dialog.

**Parts:** `Alert` > `AlertTitle`, `AlertDescription`.

**Variants:** `default` (surface-inset on the outline hairline), `success`, `warning`, `destructive` (a `-subtle` tinted ground with a 40%-opacity border; the icon carries the status colour).

This is the only place in the system where a *surface* may be status-tinted. Everywhere else, status colour is confined to text, icons and borders.

```jsx
<Alert variant="warning">
  <AlertTitle>Certificate expires in 12 days</AlertTitle>
  <AlertDescription>Renew before 2026-09-02 to avoid downtime.</AlertDescription>
</Alert>
```

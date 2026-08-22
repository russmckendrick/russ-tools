---
category: Surfaces
---
A disclosure that hides secondary detail until asked for, built on Radix Collapsible.

Use for raw response bodies, advanced options and long record lists — content that would otherwise push the primary result below the fold. Not a substitute for Tabs, which switch between peers.

**Parts:** `Collapsible` > `CollapsibleTrigger`, `CollapsibleContent`.
**Props:** `open` / `onOpenChange` for controlled use, `defaultOpen` otherwise.

```jsx
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" size="sm">Raw response</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <pre className="font-mono text-data-sm">{raw}</pre>
  </CollapsibleContent>
</Collapsible>
```

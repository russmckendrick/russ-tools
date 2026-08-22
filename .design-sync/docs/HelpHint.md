---
category: Signature components
---
Field-level help: the small `i` beside one label that explains a single control.

The counterpart to HelpDialog, not a competitor — tool-level help is a slide-in panel, field-level help is this. Both exist exactly once so the two affordances mean the same thing in every tool.

**Props:** `content` (ReactNode shown in the tooltip), `className?`, `label?` (accessible name, default `"Help"`).

It brings its own `TooltipProvider`, so it needs no wrapper.

```jsx
<div className="flex items-center gap-1">
  <Label htmlFor="prefix">Prefix length</Label>
  <HelpHint content="Between /8 and /30. Smaller numbers mean larger networks." />
</div>
```

---
category: Markers and feedback
---
An inset chip in surface-inset with a hairline, for a short clarification on hover or focus.

Never a filled accent block — an accent fill here reads as a status the tooltip does not have. A tooltip must never be the only way to reach information: it supplements a visible label, it does not replace one.

**Parts:** `TooltipProvider` (once, above any tooltips) > `Tooltip` > `TooltipTrigger`, `TooltipContent`.

For the standard field-level `i` affordance, use `HelpHint` — it composes this correctly and brings its own provider.

```jsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Copy /></Button></TooltipTrigger>
    <TooltipContent>Copy to clipboard</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---
category: Controls
---
The single control every tool has in common; more than forty files render it.

**Variants:** `default` (solid fill in the house accent), `secondary`, `outline`, `ghost`, `destructive`, `link`.
**Sizes:** `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (square, for a glyph alone).
**Props:** standard `<button>` props, plus `asChild` to render the styling onto a child element (a link, say) via Radix `Slot`.

Two rules are contract, not taste:

1. **The fill is the house accent, never the category hue.** The category hue labels; it does not shout. Driving a large fill from it turns the amber security hue brown once it clears 4.5:1.
2. **The label is `on-primary`** — near-black in the dark theme, not white. White on any of these accents measures near 2:1.

```jsx
<Button onClick={lookup}>Look up</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete all</Button>
```

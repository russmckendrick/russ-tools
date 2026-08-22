---
category: Markers and feedback
---
A tool's filled Material glyph, drawn from the shared icon set and coloured by the ambient category hue.

It renders with `fill="currentColor"`, so it takes the category hue from `--cat` wherever one is in scope without picking a colour of its own. It is deliberately larger than a generic UI glyph and carries no tile, tinted box or border behind it.

**Props:** `name` (a key of the shared icon set — throws on an unknown name), `size?` (px; defaults to `size-6`), `className?`.

For generic UI glyphs — chevrons, copy, close — use `lucide-react` instead; this component is only for the per-tool identity icons.

```jsx
<div style={{ '--cat': 'var(--color-category-security)' }}>
  <ToolIcon name="ssl-checker" />
</div>
```

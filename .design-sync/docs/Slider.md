---
category: Controls
---
A range control whose filled track is the house accent and whose thumb is a surface-raised disc.

Use where a value is approximate or explored by feel — a prefix length, a password length. Where an exact value is typed, use an Input.

**Props:** `value` / `onValueChange` (arrays, Radix convention), `min`, `max`, `step`.

```jsx
<Slider value={[length]} onValueChange={([v]) => setLength(v)} min={8} max={64} step={1} />
```

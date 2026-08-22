---
category: Controls
---
The multi-line counterpart to Input, following the same contract: darker than its panel, outline-strong border, monospace content.

Use for pasted payloads — tokens, certificates, YAML, markdown tables. Size it with `rows` or a height class rather than letting it grow unbounded.

```jsx
<Label htmlFor="jwt">Token</Label>
<Textarea id="jwt" rows={6} placeholder="eyJhbGciOiJIUzI1NiIs…" />
```

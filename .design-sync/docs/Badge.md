---
category: Markers and feedback
---
A small monospace marker for a record type, a grade, a count or a state — data about the content, rendered as data.

A badge always labels something concrete on the page: a DNS record type, a TLS version, a validation outcome. It is not a decorative pill and not a restatement of what the page already is.

**Variants:** `default` (takes the ambient category hue `--cat` as a 13% tint with a 40% border — so a badge belonging to a tool is coloured by that tool's category), `secondary`, `outline`, `destructive`, `success`, `warning`, `info`.

Status variants are the only ones that express state. If you are showing several items of different categories, set `--cat` on each item's container rather than relying on the page-level hue.

```jsx
<Badge>network</Badge>
<Badge variant="success">valid</Badge>
<Badge variant="destructive">expired</Badge>
```

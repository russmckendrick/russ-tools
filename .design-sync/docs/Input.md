---
category: Controls
---
The single-line text control: an outline-strong border on the page ground, monospace content, 6px radius.

Inputs sit **darker** than the panel containing them, never lighter — an input is a well, not a raised surface. A closed Select and an Input must be indistinguishable apart from the chevron, because they are the same kind of thing.

**Props:** everything `<input>` takes, plus `className`.

Pair every input with a `Label` via `htmlFor`/`id`.

```jsx
<Label htmlFor="domain">Domain</Label>
<Input id="domain" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
```

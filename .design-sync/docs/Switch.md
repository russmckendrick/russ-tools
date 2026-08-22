---
category: Controls
---
A binary toggle that applies immediately — no save step.

Checked, the track is the house accent; unchecked it is `outline-strong`. If the change needs confirming before it takes effect, use a checkbox-and-submit pattern instead.

**Props:** `checked` / `onCheckedChange`, `disabled`, `id`.

```jsx
<div className="flex items-center gap-2">
  <Switch id="dnssec" checked={dnssec} onCheckedChange={setDnssec} />
  <Label htmlFor="dnssec">Validate DNSSEC</Label>
</div>
```

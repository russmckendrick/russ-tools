---
category: Controls
---
A dropdown that follows the Input contract exactly: same ground, same outline-strong boundary, same monospace.

A closed Select and a text Input must look the same apart from the chevron. The open menu is a panel; group labels are `label-caps`.

**Parts:** `Select` > `SelectTrigger` > `SelectValue`, `SelectContent` > (`SelectGroup` > `SelectLabel`, `SelectItem`, `SelectSeparator`).
**Props:** `value` / `onValueChange` (controlled), `defaultValue`.

```jsx
<Select value={type} onValueChange={setType}>
  <SelectTrigger><SelectValue placeholder="Record type" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="A">A</SelectItem>
    <SelectItem value="MX">MX</SelectItem>
  </SelectContent>
</Select>
```

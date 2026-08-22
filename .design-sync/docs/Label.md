---
category: Controls
---
The caption for a form control, bound to it so clicking the label focuses the control.

Built on Radix Label. Always pass `htmlFor` matching the control's `id` — an unlabelled control is an accessibility defect, and placeholder text is not a label.

```jsx
<Label htmlFor="token">JWT</Label>
<Textarea id="token" />
```

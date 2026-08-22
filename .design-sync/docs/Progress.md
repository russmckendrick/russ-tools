---
category: Controls
---
A determinate progress bar whose filled portion is always the house accent.

Use when the work has a known extent — files parsed, hosts scanned. For unknown-duration work prefer a loading state on the button that started it.

**Props:** `value` (0–100), plus standard div props.

The fill is `primary`, never the category hue: this is a control, and controls act.

```jsx
<Progress value={62} />
```

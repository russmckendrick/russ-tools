---
category: Signature components
---
Portals a control into the shell's tool action row — the right-aligned row directly above the tool body.

The row is owned by the shell, not by any tool, so the same affordances land in the same place in every tool. The Help button lives there permanently; a tool adds at most a couple of its own (share this configuration, favourite this query). A tool that renders its own share button inline has left the rack.

**Props:** `children` — rendered into the row via a portal. Returns `null` when no `ToolActionsProvider` is above it, so it is safe to render anywhere.

`ToolActionsProvider` (`target`, `children`) supplies the DOM node; the shell renders it.

```jsx
<ToolAction>
  <Button variant="outline" size="sm">Share</Button>
</ToolAction>
```

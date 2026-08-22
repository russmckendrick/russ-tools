---
category: Signature components
---
The one way a tool offers help: a panel that slides in from the right, so the work stays visible behind it.

A tool supplies content and nothing else — not the width, the heading level, the glyph, or where the trigger sits. Field-level help is the separate, smaller `HelpHint`.

**Props:** `title`, `description?`, `children`, `label?` (default `"Help"`), `open?`, `onOpenChange?`, `className?`.

Two usages: **uncontrolled** (omit `open` and the standard outline trigger button renders) and **controlled** (pass `open`/`onOpenChange` and the tool owns the trigger — this is how tools open help from the shell's action row).

`HelpSection` groups content inside it.

```jsx
<HelpDialog title="Subnet Calculator" description="How addresses are split.">
  <HelpSection title="Prefix length">
    <p>A /24 yields 254 usable hosts.</p>
  </HelpSection>
</HelpDialog>
```

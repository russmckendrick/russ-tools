---
category: Controls
---
A segmented control on surface-inset inside the outline hairline; the active segment lifts to surface-raised.

Never render tabs as a full-width row of underlined links. Use tabs for peer views of the same subject — Decoded / Raw, IPv4 / IPv6 — not for steps in a sequence.

**Parts:** `Tabs` > `TabsList` > `TabsTrigger`, then `TabsContent`.
**Props:** `value` / `onValueChange` or `defaultValue`; each trigger and content pair shares a `value`.

```jsx
<Tabs defaultValue="decoded">
  <TabsList>
    <TabsTrigger value="decoded">Decoded</TabsTrigger>
    <TabsTrigger value="raw">Raw</TabsTrigger>
  </TabsList>
  <TabsContent value="decoded">…</TabsContent>
  <TabsContent value="raw">…</TabsContent>
</Tabs>
```

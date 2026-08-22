---
category: Surfaces
---
A panel that floats: surface-raised on the outline hairline, 10px radius, over a surface/80 scrim.

Use for a decision that must be resolved before continuing — a destructive confirmation, say. For help and for reference content read *alongside* the tool, use Sheet instead, so what the user was working on stays visible.

**Parts:** `Dialog` > `DialogTrigger`, `DialogContent` > (`DialogHeader` > `DialogTitle`, `DialogDescription`), `DialogFooter`, `DialogClose`.

```jsx
<Dialog>
  <DialogTrigger asChild><Button variant="destructive">Delete all</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete saved networks?</DialogTitle>
      <DialogDescription>This removes 12 saved networks from this browser. It cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

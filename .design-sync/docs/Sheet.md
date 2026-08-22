---
category: Surfaces
---
A panel that slides in from the right edge, full height, over the page scrim.

For content read *alongside* the tool rather than instead of it. Same primitive as Dialog, so focus trapping and Escape behave identically. This is what `HelpDialog` is built from — prefer `HelpDialog` for help rather than composing a Sheet by hand.

**Parts:** `Sheet` > `SheetTrigger`, `SheetContent` > (`SheetHeader` > `SheetTitle`, `SheetDescription`), `SheetClose`.

```jsx
<Sheet>
  <SheetTrigger asChild><Button variant="outline">Details</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Certificate chain</SheetTitle>
    </SheetHeader>
  </SheetContent>
</Sheet>
```

---
category: Markers and feedback
---
How all record-style output is rendered: monospace, odd rows tinted with surface-inset, the type column in the category hue.

**Parts:** `Table` > `TableCaption`, `TableHeader` > `TableRow` > `TableHead`, `TableBody` > `TableRow` > `TableCell`, `TableFooter`.

Put the record type in the first column and colour it with `var(--cat)`. Keep values monospace — these are records, not prose.

```jsx
<Table>
  <TableHeader>
    <TableRow><TableHead>Type</TableHead><TableHead>Value</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell style={{ color: 'var(--cat)' }}>A</TableCell>
      <TableCell>104.21.34.12</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---
category: Surfaces
---
The workhorse surface: both the home-page tool tile and the panel that wraps input and results on every tool page.

**Parts:** `Card` > `CardHeader` > (`CardTitle`, `CardDescription`), `CardContent`, `CardFooter`.

As a tool tile it carries the tool name at `title-sm`, a description clamped to two lines, and a hairline-separated footer of monospace metadata. Never let the description run past two lines — clamp rather than reflow, so a grid of tiles stays even.

Give each tile its own `--cat` when several categories appear together, exactly as the shell does:

```jsx
<Card style={{ '--cat': 'var(--color-category-network)' }}>
  <CardHeader>
    <CardTitle>DNS Lookup</CardTitle>
    <CardDescription>Resolve A, AAAA, MX, TXT and NS records for any domain.</CardDescription>
  </CardHeader>
  <CardFooter>
    <Badge>network</Badge>
  </CardFooter>
</Card>
```

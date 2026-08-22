## How to build with this design system

Dark-first, panelled, monospace for data. Every screen is a set of bordered panels on a
near-black ground, with one house accent for anything that acts and a per-category hue for
anything that labels.

### The root wrapper — required

Nothing in `src/components/ui/` sets the theme. Components read CSS custom properties that
must already be in scope, so an unwrapped design renders in whichever theme the viewer's OS
prefers, with no category hue at all. Wrap every design:

```jsx
<div className="dark" style={{ '--cat': 'var(--color-category-network)' }}>
  <div className="bg-surface text-on-surface min-h-screen">…</div>
</div>
```

- **`dark` or `light` on the wrapper.** With neither class the stylesheet falls through to
  `@media (prefers-color-scheme)`. Prefer `dark` — it is the house look.
- **`--cat`** is the category hue, one per page, chosen from `network`, `azure`,
  `microsoft`, `security`, `developer`, `content`. `Badge`, `ToolIcon` and `HelpDialog` read
  it. When several categories appear together (a grid of tiles) set `--cat` on each tile
  instead, not on the page.
- `DesignSystemRoot` is exported and does all of the above if you prefer a component.
- Render `<Toaster />` once at the root; raise notifications with the exported `toast`
  (`toast.success('Copied')`). Do not import `sonner` directly — a second copy has its own
  observer and its toasts never appear.

### Styling idiom: semantic Tailwind utilities

Use the semantic classes below, never raw palette classes (`bg-slate-800`, `text-green-500`)
— they are not part of this system and are lint errors in the source repo.

| Family | Real names |
|---|---|
| Ground | `bg-surface`, `bg-surface-raised` (panels, cards), `bg-surface-inset` (wells, inputs, table stripes) |
| Text | `text-on-surface`, `text-on-surface-muted`, `text-on-surface-faint`, `text-on-primary` |
| Lines | `border-outline` (hairline), `border-outline-strong` (control borders) |
| Accent | `bg-primary`, `text-primary`, `border-primary` |
| Status | `text-success` `text-warning` `text-danger` `text-info`, and `bg-*-subtle` grounds |
| Type | `text-title-sm`, `text-body-lg/md/sm`, `text-data-lg/md/sm`, `text-label-caps` |
| Radius | `rounded-sm` 6px (controls), `rounded-md` 8px, `rounded-lg` 10px (panels) |

**One class applies one type step.** `text-body-sm` already carries its weight, line-height
and tracking — never add `font-*`, `leading-*` or `tracking-*` beside it. Stock Tailwind
sizes (`text-sm`, `text-lg`) are off-scale; do not use them.

**Important limitation — read this before writing any layout.** `styles.css` is Tailwind
output precompiled from this repo's own source, so it contains **only the ~440 utilities the
app already uses**. A class that is perfectly valid Tailwind but unused here emits nothing
and fails silently — `min-h-screen`, `max-w-xl` and `gap-1.5` are all absent, for example.

The semantic colour and type families above are fully covered and safe. **Layout utilities
are not**, so either keep to the values that exist —

- `gap-1` `gap-2` `gap-3` `gap-4` `gap-6`
- `p-0` `p-1` `p-2` `p-3` `p-4` `p-6` `p-8`
- `max-w-xs` `max-w-md` `max-w-lg` `max-w-2xl` `max-w-3xl` `max-w-4xl`

— or, for anything outside them, use inline styles with the tokens, which always resolve
because every token is defined at `:root`:

```jsx
<div style={{ background: 'var(--color-surface-raised)', color: 'var(--color-on-surface-muted)' }} />
```

Type is `var(--font-sans)` (Inter Variable) for prose and `var(--font-mono)` (JetBrains Mono
Variable) for **all** data — addresses, hashes, record values, IDs, timestamps.

### The accent acts; the category labels

`primary` fills buttons, switches, sliders, progress and focus rings, in both themes.
`--cat` is for icons, badges, borders, small text and hover glow — **never a large fill**. A
category hue must clear 4.5:1 as text, and the amber security hue at that contrast is brown,
so a button filled with it is a brown slab.

### Where the truth lives

`styles.css` and its imports (`fonts/fonts.css`, `_ds_bundle.css`) are the real stylesheet —
read them before inventing a class. `guidelines/DESIGN.md` is the full design authority, with
the rationale behind every rule above. Each component's `.prompt.md` carries its parts, props
and a worked example; read that before composing it.

### A worked example

```jsx
<div className="dark" style={{ '--cat': 'var(--color-category-security)' }}>
  <main className="bg-surface text-on-surface p-6" style={{ minHeight: '100vh' }}>
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>SSL Checker</CardTitle>
        <CardDescription>Inspect the certificate chain for any host.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Label htmlFor="host">Host</Label>
          <Input id="host" defaultValue="russ.tools" />
        </div>
      </CardContent>
      <CardFooter>
        <Button>Check</Button>
        <Badge variant="success">valid</Badge>
      </CardFooter>
    </Card>
  </main>
</div>
```

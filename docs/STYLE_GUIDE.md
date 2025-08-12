# RussTools Design Style Guide

## Overview
This style guide ensures consistent design and user experience across all tools in the RussTools application. All tools should follow these patterns for a cohesive look and feel.

> Scope: This guide focuses on practical implementation patterns (components, layouts, utilities) using shadcn/ui + Tailwind. For foundational tokens, principles, and motion, see `DESIGN_SYSTEM.md`.

## Quick Reference

### Essential Patterns
- **Main Container**: Shadcn `Card` with `CardHeader`, `CardContent`
- **Icon Size**: 24 in headers; 16–18 in tabs and actions
- **Text**: Use semantic Tailwind classes; prefer `text-muted-foreground` for secondary text
- **Dark Mode**: Always test both themes; rely on `bg-background` and `text-foreground`
- **SEO**: Include `<SEOHead {...seoData} />` in every tool
- **Tabs**: Shadcn `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

### Shadcn Component Map
- Buttons: `src/components/ui/button.jsx`
- Cards: `src/components/ui/card.jsx`
- Tabs: `src/components/ui/tabs.jsx`
- Dialogs/Modals: `src/components/ui/dialog.jsx`
- Alerts: `src/components/ui/alert.jsx`
- Inputs: `src/components/ui/input.jsx`
- Select: `src/components/ui/select.jsx`
- Labels: `src/components/ui/label.jsx`
- Switch/Slider/Progress: `src/components/ui/switch.jsx`, `src/components/ui/slider.jsx`, `src/components/ui/progress.jsx`
- Table/Separator/Tooltip/Badge: `src/components/ui/table.jsx`, `src/components/ui/separator.jsx`, `src/components/ui/tooltip.jsx`, `src/components/ui/badge.jsx`
- Theme Toggle: `src/components/ui/theme-toggle.jsx`

## Common UI Patterns

### Card with header, description and actions
```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SectionCard({ title, description, onPrimary, onSecondary, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex gap-2">
          {onSecondary && <Button variant="outline" size="sm" onClick={onSecondary.onClick}>{onSecondary.label}</Button>}
          {onPrimary && <Button size="sm" onClick={onPrimary.onClick}>{onPrimary.label}</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
```

### Tabs layout
```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function SectionTabs() {
  return (
    <Tabs defaultValue="one" className="w-full">
      <TabsList>
        <TabsTrigger value="one">Tab One</TabsTrigger>
        <TabsTrigger value="two">Tab Two</TabsTrigger>
        <TabsTrigger value="three">Tab Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one" className="pt-4">Content A</TabsContent>
      <TabsContent value="two" className="pt-4">Content B</TabsContent>
      <TabsContent value="three" className="pt-4">Content C</TabsContent>
    </Tabs>
  )
}
```

### Confirm dialog pattern
```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ConfirmDelete({ onConfirm }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Form section with labels, helper text and validation
```jsx
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function SettingsForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [env, setEnv] = useState('dev')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    onSubmit({ name, env })
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My resource" />
        <p className="text-xs text-muted-foreground">A descriptive name for this configuration.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="grid gap-2">
        <Label>Environment</Label>
        <Select value={env} onValueChange={setEnv}>
          <SelectTrigger>
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dev">Development</SelectItem>
            <SelectItem value="test">Test</SelectItem>
            <SelectItem value="prod">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => { setName(''); setEnv('dev'); setError('') }}>Reset</Button>
        <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
      </div>
    </div>
  )
}
```

### Toolbar with search and actions
```jsx
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function Toolbar({ query, setQuery, filter, setFilter, onAdd }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full gap-2 sm:max-w-md">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => { setQuery(''); setFilter('all') }}>Reset</Button>
        <Button onClick={onAdd}>Add New</Button>
      </div>
    </div>
  )
}
```

## Layout Structure

### Main Container
- Use `Card` with subtle border. Place titles in `CardHeader`, content in `CardContent` and keep spacing with `space-y-*`.

### Header Section
- Use a left-aligned icon inside a rounded container with a soft background, followed by title and description. See `ToolHeader` component for the canonical pattern used across tools.

## Content Sections

### Cards
- Use Shadcn `Card`. Prefer compact padding and rely on `space-y-*` inside content.

### Input Areas
- Group related inputs in cards
- Use descriptive labels and helper text
- Use Tailwind spacing utilities: `space-y-3`, `gap-4`

### Action Buttons
- Primary actions: `Button` default
- Secondary actions: `Button variant="outline"` or `variant="ghost"`
- Group related actions with flex and gap utilities

### Share Configuration Buttons
All tools with shareable configurations should follow this consistent pattern:

#### Header Placement
- Place alongside other header actions (e.g., Help) in a `flex` container with `gap-2`
- Button text: "Copy Configuration Share URL"
- Icon: `<IconShare className="mr-2 h-4 w-4" />`
- Variant: `variant="outline"` (or `ghost` when secondary)

#### Disable Conditions
Each tool should disable the share button until meaningful content exists:
- **Azure Naming**: `disabled={!formState.resourceType.length || !formState.workload}`
- **Network Designer**: `disabled={networks.length === 0}`
- **Azure KQL**: `disabled={!generatedQuery}`

#### Implementation Pattern
```jsx
<Button
  variant="outline"
  onClick={handleShareConfiguration}
  disabled={/* tool-specific condition */}
>
  <IconShare className="mr-2 h-4 w-4" />
  Copy Configuration Share URL
</Button>
```

#### Share Handler Function
```jsx
const handleShareConfiguration = async () => {
  // Validate that content exists
  if (!/* content condition */) {
    // Use toast for feedback
    toast.warning('Content Required', {
      description: 'Please create/generate content before sharing'
    });
    return;
  }

  const config = {
    // tool-specific configuration data
  };

  const success = await copyShareableURL(config);
  if (success) {
    toast.success('Configuration Shared', {
      description: 'Shareable link has been copied to your clipboard'
    });
  }
};
```

#### Required Imports
```jsx
import { IconShare } from '@tabler/icons-react'
import { toast } from 'sonner'
import { copyShareableURL } from '@/utils/sharelink'
```

## Color Scheme

### Tool-Specific Colors
- Azure Naming: `cyan` (with IconBrandAzure)
- Base64: `teal` (with Base64Icon)
- Cron: `orange` (with IconClock)
- Data Converter: `yellow` (with JSONIcon)
- DNS Lookup: `indigo` (with DNSIcon)
- JWT: `red` (with JWTIcon)
- Microsoft Portals: `indigo` (with MicrosoftPortalsIcon)
- Microsoft Tenant Lookup: `blue` (with TenantLookupIcon)
- Network Designer: `blue` (with IconNetwork)
- Password Generator: `violet` (with IconKey)
- SSL Checker: `green` (with IconShield)
- WHOIS: `violet` (with WHOISIcon)

### Status Colors
- Success/Valid: `green`
- Error/Invalid: `red`
- Warning: `yellow` or `orange`
- Info: `blue`

## Typography

### Headings
- Main title: `text-2xl font-semibold`
- Section titles: `font-medium`
- Subsections: `text-sm text-muted-foreground`

### Body Text
- Regular text: default Tailwind text color
- Dimmed text: `text-muted-foreground`

## Dark Mode Support

### Color Scheme Awareness
All tools must support both light and dark modes using the app theme:

- Use semantic Tailwind classes backed by CSS tokens: `bg-background`, `text-foreground`, `border`, `bg-card`, `text-muted-foreground`, etc.
- Avoid hardcoded color values. Prefer component variants and tokens.
- Theme is controlled by `ThemeProvider` which toggles `light`/`dark` classes on `html` and `body`.

#### Minimal Theme Toggle
```jsx
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </Button>
  )
}
```

#### Testing Requirements
- Verify contrast and focus states in both themes
- Check borders, subtle backgrounds, and disabled states on dark
- Respect `prefers-reduced-motion` in animations

## Spacing

### Recommended Gaps
- Main sections: `space-y-6` to `space-y-8`
- Card content: `space-y-4`
- Forms and stacks: `gap-4`
- Small inline spacing: `gap-2`

### Grid Layout
- Two-column: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Three-column: `grid grid-cols-1 md:grid-cols-3 gap-6`

## Interactive Elements

### Buttons
- Primary actions: `<Button>` default variant
- Secondary actions: `variant="outline"` or `variant="ghost"`
- Icon-only: `size="icon"`
- Group with `flex` and `gap-2`

### Alerts
- Use `Alert` with optional `variant="destructive"`
- Include a leading icon (e.g., lucide `AlertCircle`)

### Badges
- Status indicators: Use appropriate colors
- Small informational badges: `size="sm"` or `size="xs"`
- Consistent variant usage

### Tabs
- Use shadcn Tabs (see example earlier in this guide)
- Keep content spacing with `pt-4`

## Code Display

### Code Blocks
- Use `<pre><code>` with `font-mono text-sm` or `Textarea` for editable content
- Use `bg-muted/30` backgrounds for read-only blocks
- PrismJS is available; highlight where helpful

### JSON Display
- Editable: `Textarea` with `font-mono`
- Read-only: `<pre>` + Prism or `Textarea` readOnly
- Keep indentation and provide copy/download actions when relevant

## Responsive Design

### Grid Breakpoints
- Mobile-first approach
- Use `span={{ base: 12, md: 6 }}` pattern
- Ensure all tools work on mobile devices

### Component Sizing
- Consistent icon sizes across tools
- Responsive text sizing
- Appropriate spacing for different screen sizes

## Animations and Transitions

### Tool Cards (Home Page)
- Use `.tool-card` class for hover animations
- Smooth transform: `translateY(-2px)` on hover
- Enhanced box shadows with theme awareness
- CSS cubic-bezier timing: `cubic-bezier(0.4, 0, 0.2, 1)`

### Interactive Elements
- Standard transition timing: `0.15s ease` for buttons and links
- Use `transform` for micro-interactions (e.g., `translateX(2px)`)
- Respect `prefers-reduced-motion` setting

### Navigation
- Header uses subtle backdrop blur and token-based backgrounds

## Brand Consistency

### Logo and Branding
- Use a token-driven gradient for brand text:
  ```css
  .brand-text {
    background-image: linear-gradient(to right, var(--color-primary), color-mix(in oklch, var(--color-accent) 60%, var(--color-primary)));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  ```
- Apply to home page title and navigation header

### Home Page Typography
- Main title: `size="3rem"` with gradient effect
- Description: `size="xl"` with increased line height `lh={1.5}`
- Tool descriptions: Use `shortDescription` when available for brevity

## Accessibility

### Icons
- Always include meaningful `title` attributes
- Use semantic icons that match functionality
- Consistent icon sizing

### Color Contrast
- Ensure sufficient contrast for all text and interactive elements
- Use app tokens and test in both light and dark themes

## Error Handling

### Error Display
- Use `Alert` component with `color="red"`
- Include appropriate error icons
- Clear, actionable error messages

### Loading States
- For global areas: use skeletons or spinners within content
- Buttons: disable and show an `animate-spin` icon
- Keep messaging concise via `sonner` toasts where appropriate

## Best Practices

1. **Consistency**: All tools should look like they belong to the same application
2. **Clarity**: Clear visual hierarchy and information organization
3. **Accessibility**: Proper contrast, keyboard navigation, and screen reader support
4. **Responsiveness**: Works well on all device sizes
5. **Performance**: Efficient rendering and minimal re-renders
6. **User Experience**: Intuitive interactions and helpful feedback
7. **Dark Mode**: Full support for both light and dark themes with proper color adaptation

## Tool-Specific Implementation Examples

### Microsoft Portals Tool
The Microsoft Portals tool demonstrates several advanced patterns:

#### Data-Driven Architecture
- Portal data stored in JSON files (`/data/*.json`)
- Separation of data from presentation logic
- Easy maintenance and updates without code changes

#### CSP Partner Features
- Tenant ID and domain-based URL generation
- Partner Centre integration URLs
- Delegated administration support

#### Advanced UI Patterns
- Tabbed interface for portal categories
- Search and filter functionality
- Clipboard integration for generated links
- Responsive grid layout for portal cards

#### URL Generation Logic
```javascript
// Example of conditional URL generation
if (portal.urlWithTenant && tenantId) {
  url = portal.urlWithTenant.replace('{tenantId}', tenantId);
} else if (portal.urlWithDomain && domain) {
  url = portal.urlWithDomain.replace('{domain}', domain);
} else {
  url = portal.url;
}
```

#### Component Structure
```
microsoft-portals/
├── MicrosoftPortalsTool.jsx (main component)
├── TenantLookup.jsx (domain resolution)
├── PortalLinkGenerator.jsx (URL builders)
├── PortalGrid.jsx (link display)
├── PortalCategories.jsx (tabbed organization)
├── MicrosoftPortalsIcon.jsx (custom icon)
└── data/
    ├── azure-portals.json
    ├── m365-portals.json
    ├── power-platform-portals.json
    ├── advanced-portals.json
    └── README.md
```

## Implementation Notes

- Use the CSS tokens defined in `src/styles/globals.css` via semantic classes
- Prefer shadcn/ui components and Tailwind utilities for layout and spacing
- Test in both light and dark themes; check focus and keyboard navigation
- Use semantic HTML and ARIA where needed
- Consider data-driven approaches for complex tools with many options
- Provide clear error handling and use `sonner` for feedback
- Keep frequently changing configuration in JSON files
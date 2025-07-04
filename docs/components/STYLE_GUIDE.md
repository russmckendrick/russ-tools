# RussTools Design Style Guide

## Overview
This style guide ensures consistent design and user experience across all tools in the RussTools application. All tools should follow these patterns for a cohesive look and feel.

## Quick Reference

### Essential Patterns
- **Main Container**: `<Paper withBorder p="xl" radius="lg">`
- **Icon Size**: `size={48}` for tool headers, `size={18}` for tab icons
- **Color Prop**: Use `c="dimmed"` (not `color="dimmed"`)
- **Dark Mode**: Always test both themes, use conditional styling
- **SEO**: Include `<SEOHead {...seoData} />` in every tool
- **Tabs**: Use default styling with `<Tabs.List mb="lg">` (avoid `variant="pills"`)

## Layout Structure

### Main Container
- Use `Paper` component with these props:
  - `p="xl"` (extra large padding)
  - `radius="lg"` (large border radius)
  - `withBorder` (subtle border)

### Header Section
- Use `Stack` with `gap="xl"`
- Header should contain:
  - `Group` with `gap="md"` for icon and text
  - `ThemeIcon` with:
    - `size={48}` (consistent icon size)
    - `radius="md"`
    - `variant="light"`
    - Appropriate color for the tool
  - Title section with:
    - `Title` with `order={2}` and `fw={600}`
    - Descriptive `Text` with `size="sm"` and `c="dimmed"`
    - Optional `Badge` for additional info with `variant="light"`, `size="sm"`, and `mt="xs"`

## Content Sections

### Cards
- Use `Card` component with:
  - `withBorder`
  - `p="lg"` for content padding
  - `radius="md"` for consistent rounding

### Input Areas
- Group related inputs in cards
- Use descriptive labels and helper text
- Consistent spacing with `Stack` and `gap="md"`

### Action Buttons
- Primary actions: Use `Button` with appropriate color
- Secondary actions: Use `ActionIcon` with `variant="light"`
- Group related actions with `Group` component

### Share Configuration Buttons
All tools with shareable configurations should follow this consistent pattern:

#### Header Placement
- Located in header section alongside other action buttons (Help, etc.)
- Use `Group gap="sm"` to group header buttons
- Button text: "Copy Configuration Share URL"
- Icon: `<IconShare size={16} />`
- Variant: `variant="light"`

#### Disable Conditions
Each tool should disable the share button until meaningful content exists:
- **Azure Naming**: `disabled={!formState.resourceType.length || !formState.workload}`
- **Network Designer**: `disabled={networks.length === 0}`
- **Azure KQL**: `disabled={!generatedQuery}`

#### Implementation Pattern
```jsx
<Button
  variant="light"
  leftSection={<IconShare size={16} />}
  onClick={handleShareConfiguration}
  disabled={/* tool-specific condition */}
>
  Copy Configuration Share URL
</Button>
```

#### Share Handler Function
```jsx
const handleShareConfiguration = async () => {
  // Validate that content exists
  if (!/* content condition */) {
    notifications.show({
      title: 'Content Required',
      message: 'Please create/generate content before sharing',
      color: 'orange'
    });
    return;
  }

  const config = {
    // tool-specific configuration data
  };

  const success = await copyShareableURL(config);
  if (success) {
    notifications.show({
      title: 'Configuration Shared',
      message: 'Shareable link has been copied to your clipboard',
      color: 'green',
      icon: <IconShare size={16} />
    });
  }
};
```

#### Required Imports
```jsx
import { IconShare } from '@tabler/icons-react';
import { copyShareableURL } from '../../../utils/sharelink';
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
- Main title: `Title order={2} fw={600}`
- Section titles: `Text fw={500}` or `Text fw={600}`
- Subsections: `Text fw={500} size="sm"`

### Body Text
- Regular text: Default Mantine text
- Dimmed text: `c="dimmed"` (never use `color="dimmed"`)
- Small text: `size="sm"`
- Extra small: `size="xs"`

## Dark Mode Support

### Color Scheme Awareness
All tools must support both light and dark modes. Follow these guidelines:

#### Import Requirements
```jsx
import { useMantineColorScheme } from '@mantine/core';

// In component:
const { colorScheme } = useMantineColorScheme();
```

#### Background Colors
- **Never use hardcoded colors** like `var(--mantine-color-gray-0)`
- Use conditional backgrounds:
  ```jsx
  backgroundColor: colorScheme === 'dark' 
    ? 'var(--mantine-color-dark-6)' 
    : 'var(--mantine-color-gray-0)'
  ```

#### Text Colors
- Use `c="dimmed"` instead of `color="dimmed"` for proper dark mode support
- Avoid hardcoded text colors - let Mantine handle theme-aware colors

#### Common Dark Mode Patterns
- Light backgrounds: `gray-0` → `dark-6`
- Card backgrounds: `gray-1` → `dark-7` 
- Subtle backgrounds: `gray-2` → `dark-8`
- Border colors: Let Mantine handle automatically with `withBorder`

#### Testing Requirements
- Always test tools in both light and dark modes
- Check for proper contrast and readability
- Ensure all interactive elements are visible in both themes
- Verify that custom background colors adapt to theme changes

#### Theme Configuration
- App theme uses Inter font family with proper fallbacks
- Default border radius is `md` for consistency
- Avoid hardcoded theme colors in App.jsx global styles
- Use CSS custom properties and `light-dark()` function for theme-aware styling

## Spacing

### Stack Gaps
- Main sections: `gap="xl"`
- Card content: `gap="lg"`
- Form elements: `gap="md"`
- Small elements: `gap="sm"` or `gap="xs"`

### Grid Layout
- Use responsive spans: `span={{ base: 12, md: 6 }}` for two-column layouts
- Consistent gutters: `gutter="lg"`

## Interactive Elements

### Buttons
- Primary actions: Full-width or appropriately sized
- Icon buttons: Use `ActionIcon` with consistent sizing
- Button groups: Use `Group` with appropriate spacing

### Alerts
- Use appropriate colors for context
- Include relevant icons
- Consistent styling with `variant="light"` or `variant="filled"`

### Badges
- Status indicators: Use appropriate colors
- Small informational badges: `size="sm"` or `size="xs"`
- Consistent variant usage

### Tabs
- Use default Mantine tabs styling (no variant prop)
- Standard pattern:
  ```jsx
  <Tabs defaultValue="tab1">
    <Tabs.List mb="lg">
      <Tabs.Tab value="tab1" leftSection={<IconName size={18} />}>
        Tab Name
      </Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="tab1" pt="lg">
      {/* Tab content */}
    </Tabs.Panel>
  </Tabs>
  ```
- Icon size: `size={18}` for tab icons
- List spacing: `mb="lg"` for margin bottom
- Panel spacing: `pt="lg"` for padding top
- **Avoid**: `variant="pills"` and `grow` props for consistency

## Code Display

### Code Blocks
- Use `Code` component with `block` prop
- Consistent font family and sizing
- Appropriate background colors for theme

### JSON Display
- Use `JsonInput` for editable JSON
- Use `Code` for read-only JSON display
- Consistent formatting and indentation

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
- Header includes subtle backdrop blur: `backdrop-filter: blur(8px)`
- Semi-transparent background for modern glassmorphism effect

## Brand Consistency

### Logo and Branding
- RussTools title uses gradient styling:
  ```css
  background: linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  ```
- Apply to both home page title and navigation header
- Font weight: `fw={700}` for brand emphasis

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
- Ensure sufficient contrast for all text
- Use Mantine's built-in color system
- Test with both light and dark themes

## Error Handling

### Error Display
- Use `Alert` component with `color="red"`
- Include appropriate error icons
- Clear, actionable error messages

### Loading States
- Use `LoadingOverlay` for full component loading
- Use `loading` prop on buttons for action loading
- Consistent loading indicators

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

- Always use Mantine's design tokens for spacing, colors, and typography
- Maintain consistent prop patterns across similar components
- Test all tools in both light and dark themes
- Ensure proper keyboard navigation
- Use semantic HTML structure where possible
- Consider data-driven approaches for complex tools with many options
- Implement proper error handling for external API calls
- Use JSON files for configuration data that changes frequently 
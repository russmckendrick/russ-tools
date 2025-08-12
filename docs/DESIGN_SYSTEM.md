# 🎨 Russ Tools Design System

## Vision

Transform Russ Tools into a premium, modern developer toolkit with a sophisticated design language that emphasizes clarity, consistency, and delight. The new design will feature subtle animations, thoughtful micro-interactions, and a refined color palette that works beautifully in both light and dark modes.

> Scope: This document defines principles, tokens, motion, accessibility, and system-wide patterns. For implementation details and component usage, see `STYLE_GUIDE.md`.

## Core Design Principles

### 1. **Clarity First**
- Clean, uncluttered interfaces
- Clear visual hierarchy
- Purposeful use of whitespace
- Readable typography at all sizes

### 2. **Consistent Experience**
- Unified component library
- Predictable interactions
- Cohesive visual language
- Standardized patterns across tools

### 3. **Delightful Details**
- Smooth, subtle animations
- Thoughtful hover states
- Satisfying micro-interactions
- Polished edge cases

### 4. **Professional Aesthetic**
- Sophisticated color palette
- Refined typography
- Balanced layouts
- Premium feel

## Visual Language

### Color System

#### Semantic Tokens
We use a semantic token set defined in `src/styles/globals.css` and exposed via Tailwind class names. These tokens have light and dark values and are toggled by the app's `ThemeProvider`.

```css
--color-background;
--color-foreground;
--color-card;
--color-card-foreground;
--color-popover;
--color-popover-foreground;
--color-primary;
--color-primary-foreground;
--color-secondary;
--color-secondary-foreground;
--color-muted;
--color-muted-foreground;
--color-accent;
--color-accent-foreground;
--color-destructive;
--color-destructive-foreground;
--color-border;
--color-input;
--color-ring;
--radius;
```

These map directly to Tailwind class names (examples):

- `bg-background` → `--color-background`
- `text-foreground` → `--color-foreground`
- `bg-card` / `text-card-foreground` → card surfaces
- `bg-primary` / `text-primary-foreground` → primary actions
- `border` / `ring-ring` → borders and focus rings

#### Tool-Specific Accent Colors
Each tool category has its own accent color for visual distinction:

- **Network Tools**: Blue (#3b82f6)
- **Azure Tools**: Azure Blue (#0078d4)
- **Microsoft Tools**: Microsoft Red (#f25022)
- **Security Tools**: Green (#10b981)
- **Developer Tools**: Purple (#8b5cf6)
- **Data Tools**: Indigo (#6366f1)

### Typography

#### Font Stack
```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Monaco, monospace;
```

#### Type Scale
```css
/* Display - For hero sections */
--text-display: 4.5rem;     /* 72px */
--text-display-mobile: 3rem; /* 48px */

/* Headings */
--text-h1: 2.25rem;  /* 36px */
--text-h2: 1.875rem; /* 30px */
--text-h3: 1.5rem;   /* 24px */
--text-h4: 1.25rem;  /* 20px */
--text-h5: 1.125rem; /* 18px */
--text-h6: 1rem;     /* 16px */

/* Body */
--text-body: 1rem;     /* 16px */
--text-small: 0.875rem; /* 14px */
--text-xs: 0.75rem;    /* 12px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing & Layout

#### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

#### Container Widths
```css
--container-xs: 20rem;   /* 320px */
--container-sm: 24rem;   /* 384px */
--container-md: 28rem;   /* 448px */
--container-lg: 32rem;   /* 512px */
--container-xl: 36rem;   /* 576px */
--container-2xl: 42rem;  /* 672px */
--container-3xl: 48rem;  /* 768px */
--container-4xl: 56rem;  /* 896px */
--container-5xl: 64rem;  /* 1024px */
--container-6xl: 72rem;  /* 1152px */
--container-7xl: 80rem;  /* 1280px */
--container-full: 100%;
```

### Border & Radius

#### Border Radius
```css
--radius-none: 0;
--radius-sm: 0.125rem;  /* 2px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-3xl: 1.5rem;   /* 24px */
--radius-full: 9999px;
```

#### Border Widths
```css
--border-0: 0;
--border-1: 1px;
--border-2: 2px;
--border-4: 4px;
```

### Shadows & Elevation

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

/* Colored shadows for hover states */
--shadow-primary: 0 10px 25px -5px rgb(59 130 246 / 0.15);
--shadow-success: 0 10px 25px -5px rgb(16 185 129 / 0.15);
--shadow-error: 0 10px 25px -5px rgb(239 68 68 / 0.15);
```

### Animation & Motion

#### Timing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

#### Durations
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

#### Common Animations
Use the predefined utilities from `src/styles/globals.css` (e.g., `.interactive`, `.icon-token`, `.surface-bg`, `.grid-overlay`) along with Tailwind transitions.

```css
/* See globals.css for full definitions */
.interactive { transition: all 150ms ease-out; }
.interactive:hover { transform: translateY(-1px); }
.interactive:active { transform: scale(.98); }
```

## Component Patterns

### Buttons

#### Variants
1. **Primary** - Main actions (blue background)
2. **Secondary** - Secondary actions (gray background)
3. **Outline** - Tertiary actions (border only)
4. **Ghost** - Minimal actions (no background)
5. **Destructive** - Dangerous actions (red)

#### Sizes
- **xs** - 24px height, 12px text
- **sm** - 32px height, 14px text
- **md** - 40px height, 16px text (default)
- **lg** - 48px height, 18px text
- **xl** - 56px height, 20px text

#### States
- **Default** - Base state
- **Hover** - Subtle lift with shadow
- **Active** - Pressed appearance
- **Focus** - Ring outline for accessibility
- **Disabled** - Reduced opacity, no pointer events
- **Loading** - Spinner icon, disabled state

### Cards

#### Structure
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

#### Variants
- **Default** - Standard card with border
- **Elevated** - Card with shadow
- **Interactive** - Hover effects for clickable cards
- **Gradient** - Subtle gradient backgrounds for special cards

### Forms

#### Input Fields
- Consistent 40px height (default)
- Subtle border with focus ring
- Clear error states with red border
- Helper text below inputs
- Icons for enhanced UX

#### Field States
1. **Default** - Gray border
2. **Focus** - Blue border with ring
3. **Error** - Red border with message
4. **Success** - Green check icon
5. **Disabled** - Reduced opacity

### Navigation

#### Top Navigation Bar
- 56–64px height
- Backdrop blur on scroll
- Title on the left; actions (GitHub, theme) on the right
- Mobile: dialog-driven sidebar

#### Sidebar
- 64px collapsed, 256px expanded
- Collapsible with animation
- Tool list with icons and active state

### Data Display

#### Tables
- Alternating row colors in dark mode
- Hover state for rows
- Sortable column headers
- Pagination controls
- Responsive horizontal scroll

#### Lists
- Clear separation between items
- Hover states for interactive lists
- Icons for visual interest
- Badges for metadata

## Responsive Design

### Breakpoints
```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Mobile Patterns
- Stack layouts on mobile
- Full-width buttons
- Bottom sheets instead of modals
- Simplified navigation
- Touch-friendly tap targets (min 44px)

## Dark Mode

### Implementation
- CSS variables for all colors
- Smooth transition between modes
- System preference detection
- User preference persistence
- Proper contrast ratios (WCAG AA)

### Color Adjustments
- Inverted backgrounds
- Reduced contrast for comfort
- Adjusted shadows
- Muted colors for less eye strain
- Syntax highlighting optimization

## Accessibility

### Focus Management
- Visible focus rings
- Keyboard navigation support
- Skip links for navigation
- ARIA labels and descriptions
- Proper heading hierarchy

### Color Contrast
- WCAG AA compliance minimum
- 4.5:1 for normal text
- 3:1 for large text
- High contrast mode support

### Interactive Elements
- Minimum 44px touch targets
- Clear hover/active states
- Loading indicators
- Error messages
- Success feedback

## Tool-Specific Designs

### Network Designer
- Visual subnet blocks with drag-and-drop
- Color-coded IP ranges
- Interactive network diagram
- Export options prominently displayed

### Azure KQL Query Builder
- Syntax-highlighted code editor
- Collapsible query sections
- Real-time validation indicators
- Template gallery cards

### SSL Certificate Checker
- Traffic light status indicators
- Certificate chain visualization
- Timeline for expiration
- Security grade badge

### Password Generator
- Large, readable generated password
- Strength meter with colors
- Copy button with success animation
- Settings in expandable panel

## Implementation Guidelines

### Component Structure
```jsx
// Example Button component with Tailwind + shadcn/ui
export function Button({ 
  variant = "default",
  size = "default",
  className,
  ...props 
}) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size, className })
      )}
      {...props}
    />
  )
}
```

### Naming Conventions
- Components: PascalCase (Button, Card)
- Utilities: camelCase (formatDate, calculateSubnet)
- CSS classes: kebab-case (btn-primary, card-header)
- Constants: SCREAMING_SNAKE_CASE (MAX_RETRIES)

### File Organization
```
components/
├── ui/           # Base UI components (shadcn/ui)
├── common/       # Shared components
├── tools/        # Tool-specific components
└── layout/       # Layout components
```

## Future Enhancements

### Phase 2 Features
- Advanced animations with Framer Motion
- 3D visualizations for network tools
- AI-powered theme customization
- Collaborative features
- Real-time sync across devices

### Design System Evolution
- Storybook documentation
- Figma design library
- Component playground
- Theme builder tool
- Accessibility testing suite

---

This design system will ensure Russ Tools has a cohesive, modern, and delightful user experience that stands out as a premium developer toolkit.
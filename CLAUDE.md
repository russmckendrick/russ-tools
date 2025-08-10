# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status (2025-08-10)

**🎉 PHASE 1 MIGRATION COMPLETE:** Successfully migrated from Mantine to shadcn/ui infrastructure
- ✅ Modern sidebar navigation with full-height design
- ✅ Complete dark/light theme implementation
- ✅ Tailwind CSS v4 with shadcn/ui components
- ✅ Professional dashboard-style home page

**🚀 READY FOR PHASE 2:** Individual tool migration from Mantine to shadcn/ui components

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (includes automatic sitemap generation via scripts/generate-sitemap.js)
- `npm run lint` - Run ESLint code linting  
- `npm run preview` - Preview production build locally
- `npm run generate:sitemap` - Manually generate sitemap.xml file

## Architecture Overview

This is a React 19 single-page application (SPA) built with Vite that provides a suite of network and cloud professional tools. The application is currently in **dual-stack mode** during migration:

- **New Layout System**: shadcn/ui with Tailwind CSS v4 (sidebar navigation, theme provider)
- **Existing Tools**: Still using Mantine components (being migrated individually)
- **Target**: Full shadcn/ui implementation with modern design system

### Key Technologies
- **React 19** - Modern React with native metadata support
- **Vite** - Build tool with optimized chunking strategy
- **shadcn/ui** - Modern component library with Radix UI primitives
- **Tailwind CSS v4** - CSS-first configuration with custom design system
- **Mantine** - Legacy UI framework (being phased out)
- **React Router DOM** - Client-side routing

### Tool Architecture Pattern

Each tool in `src/components/tools/[tool-name]/` follows this structure:
- **[ToolName]Tool.jsx** - Main component entry point
- **components/** - Sub-components for complex tools
- **hooks/useToolName.js** - Custom React hooks for state management
- **utils/** - Tool-specific utility functions
- **context/** - React context for complex state sharing (when needed)

### State Management
- **localStorage** - Persistent storage for user preferences and tool state
- **React Context** - Complex state sharing within tools
- **Custom Hooks** - Encapsulated tool-specific state logic

### Build Configuration
The Vite configuration (vite.config.js) includes:
- **Manual Chunking** - Vendor chunks split by: react ecosystem, mantine, icons, data processing, UI utilities, syntax highlighting
- **ExcelJS** - Excluded from optimization due to size, loaded dynamically
- **Asset Organization** - Images in img/, CSS in css/, JS in js/ folders
- **React Deduplication** - Ensures single React instance across chunks

### Backend Services
External services are accessed through Cloudflare Workers (configured in src/utils/api/apiConfig.json):
- SSL certificate analysis (SSL Labs API)
- DNS lookups (multiple providers)
- WHOIS/tenant information (RDAP protocol)
- Microsoft API integrations

## Development Guidelines

### Adding New Tools
1. Create tool directory in `src/components/tools/[tool-name]/`
2. Add tool configuration to `src/utils/toolsConfig.json` with required fields:
   - id, title, description, shortDescription, icon, iconColor
   - badges, path, seoTitle, seoKeywords, category, features
3. Implement main component following existing patterns
4. Add routing in App.jsx
5. Icons are imported centrally in `src/utils/_iconImports.js`

### Code Conventions
- Use functional components with hooks only
- Component files use `.jsx` extension
- Utility files use `.js` extension  
- PascalCase for components, camelCase for utilities
- NO COMMENTS unless explicitly requested
- Always prefer editing existing files over creating new ones
- Never create documentation files unless explicitly requested

### External Dependencies
Check existing usage before adding new dependencies:
- **netmask** - IPv4 subnet calculations (Network Designer)
- **js-yaml, @ltd/j-toml** - Data format parsing (Data Converter)
- **jose, jwt-decode** - JWT processing (JWT Tool)
- **prismjs** - Syntax highlighting with custom KQL language support
- **@dnd-kit** - Drag and drop functionality
- **ajv** - JSON schema validation
- **html2canvas** - Export visualizations
- **@svgdotjs/svg.js** - SVG generation for network diagrams

### SEO System
- **Dynamic Meta Tags** - Tool-specific SEO metadata via `toolsConfig.json`
- **SEOHead Component** - Manages meta tags, Open Graph, and Schema.org data
- **React 19 Compatible** - Future-ready metadata approach using native support
- **Sitemap Generation** - Automatic sitemap.xml generation during build

## Current Layout System (NEW)

### Sidebar Navigation (`src/components/layout/NewLayout.jsx`)
- **Full-height sidebar** with collapsible tool categories
- **GitHub link and theme toggle** integrated at bottom
- **Clean, header-free design** maximizing content space
- **Professional appearance** matching modern applications (VS Code, GitHub)

### Theme System (`src/components/theme-provider.jsx`)
- **Custom theme provider** with localStorage persistence
- **System preference detection** with manual override
- **Smooth transitions** between light/dark themes
- **Complete CSS variable cascading** for all components

### Available shadcn/ui Components (`src/components/ui/`)
- **Button, Card, Input, Textarea, Select** - Form and interaction components
- **Alert, Badge** - Feedback and status components
- **Theme Toggle** - Dark/light mode switcher
- **Ready for tool migration** - All base components implemented

## Migration Strategy

### Phase 2: Tool Migration (Current Phase)
Migrate tools individually from Mantine to shadcn/ui:

1. **Recommended order**: Base64 → Password Generator → CRON Builder → Buzzword Ipsum
2. **Process**: Create new shadcn/ui version alongside existing Mantine version
3. **Testing**: Ensure functional parity before replacing routes
4. **Cleanup**: Remove Mantine version once migration confirmed

### Performance Considerations
- Large dependencies are dynamically imported when possible
- Tool state is persisted to localStorage for better UX
- Tailwind CSS v4 optimizes CSS generation and bundle size
- Source maps enabled for production debugging
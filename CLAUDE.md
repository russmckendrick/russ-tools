# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status (2025-08-12)

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

This is a React 19 single-page application (SPA) built with Vite that provides a suite of network and cloud professional tools. The application has completed infrastructure migration to shadcn/ui and is now ready for individual tool migrations.

### Key Technologies
- **React 19** - Modern React with native metadata support
- **Vite** - Build tool with optimized chunking strategy
- **shadcn/ui** - Modern component library with Radix UI primitives
- **Tailwind CSS v4** - CSS-first configuration with custom design system
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
- **Manual Chunking** - Vendor chunks split by: react ecosystem, icons, data processing, UI utilities, syntax highlighting
- **ExcelJS** - Excluded from optimization due to size, loaded dynamically
- **Asset Organization** - Images in img/, CSS in css/, JS in js/ folders
- **React Deduplication** - Ensures single React instance across chunks
- **Path Alias** - `@` alias for src directory imports

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
- **ajv, ajv-formats, better-ajv-errors** - JSON schema validation
- **html2canvas** - Export visualizations
- **@svgdotjs/svg.js** - SVG generation for network diagrams
- **exceljs** - Excel file generation (dynamically imported, excluded from build optimization)
- **uuid** - Unique identifier generation
- **pako** - Compression/decompression
- **zustand** - Lightweight state management
- **framer-motion** - Animation library

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
Migrate tools individually to shadcn/ui components:

1. **Recommended order**: Base64 → Password Generator → CRON Builder → Buzzword Ipsum
2. **Process**: Update components to use shadcn/ui while maintaining functionality
3. **Testing**: Ensure functional parity and consistent styling
4. **Cleanup**: Remove any remaining legacy component imports

### Performance Considerations
- Large dependencies are dynamically imported when possible
- Tool state is persisted to localStorage for better UX
- Tailwind CSS v4 optimizes CSS generation and bundle size
- Source maps enabled for production debugging
- Lazy loading implemented for all tool components with error boundaries
- Manual chunking strategy optimizes vendor dependencies by category

## Important Notes for Development

### Tool Status Summary
The codebase contains 14 main tools, most already using shadcn/ui components (indicated by "Shadcn" suffix in filenames):
- ✅ **Already migrated**: Network Designer, Azure Naming, Cron Builder, SSL Checker, DNS Lookup, WHOIS Lookup, Data Converter, Base64, JWT, Password Generator, Microsoft Portals, Tenant Lookup, Buzzword Ipsum
- 🔄 **In progress**: Azure KQL (uses original component, not shadcn version)

### Key Architecture Patterns
1. **Tool Configuration System**: All tools defined in `src/utils/toolsConfig.json` with complete metadata for routing, SEO, and UI
2. **Lazy Loading**: All tools use React.lazy() with error boundaries and fallback components
3. **URL Routing**: Tools support parameterized URLs (e.g., `/ssl-checker/:domain`, `/jwt/:token`)
4. **API Integration**: External services via Cloudflare Workers configured in `src/utils/api/apiConfig.json`
5. **State Persistence**: Tools use localStorage for user preferences and state
6. **Icon Management**: Icons centrally imported via `src/utils/_iconImports.js`

## Documentation References

The `docs/` directory contains comprehensive documentation for different aspects of the project:

### Core Documentation
- **`docs/ARCHITECTURE.md`** - Complete architectural overview including component patterns, state management strategies, API integration, and tool-specific implementations
- **`docs/DEVELOPMENT.md`** - Detailed development guide with setup instructions, tool creation workflow, testing guidelines, and troubleshooting
- **`docs/DESIGN_SYSTEM.md`** - Design system specification including typography, color tokens, spacing, animation patterns, and component designs
- **`docs/STYLE_GUIDE.md`** - Implementation guide for UI components and styling patterns
- **`docs/DEPLOYMENT.md`** - Deployment and build configuration details
- **`docs/README.md`** - Overview of documentation structure

### API Documentation
- **`docs/api/API_CONFIG.md`** - API configuration and external service integration details
- **`docs/cloudflare-workers/README.md`** - Cloudflare Workers implementation for backend services

### Tool-Specific Documentation
Each tool has dedicated documentation in `docs/tools/[tool-name]/`:
- **Azure KQL**: `docs/tools/azure-kql/` - Architecture, template development, query patterns, and user guide
- **Azure Naming**: `docs/tools/azure-naming/` - CAF compliance and naming conventions
- **Network Designer**: `docs/tools/network-designer/` - Network visualization and Terraform export
- **Security Tools**: SSL Checker, JWT, Password Generator documentation
- **Data Tools**: Base64, Data Converter, and processing utilities
- **Microsoft Tools**: Portals and tenant lookup integration

### Utility Documentation
- **`docs/utils/sharelink.md`** - URL sharing and deep linking utilities
- **`docs/utils/tld-utilities.md`** - Top-level domain processing utilities

### Implementation Plans
- **`docs/plans/azure-kql-tool-implementation-plan.md`** - Detailed implementation roadmap for Azure KQL tool
- **`docs/research/azure-kql-tool.md`** - Research and requirements analysis
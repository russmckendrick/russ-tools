# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status (2025-08-13)

**🎉 MIGRATION COMPLETE:** Successfully migrated from Mantine to shadcn/ui
- ✅ Modern sidebar navigation with full-height design
- ✅ Complete dark/light theme implementation
- ✅ Tailwind CSS v4 with shadcn/ui components
- ✅ All tools migrated to shadcn/ui components
- ✅ Professional dashboard-style home page

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (includes automatic sitemap generation via scripts/generate-sitemap.js)
- `npm run lint` - Run ESLint code linting  
- `npm run preview` - Preview production build locally
- `npm run generate:sitemap` - Manually generate sitemap.xml file

## Architecture Overview

This is a React 19 single-page application (SPA) built with Vite that provides a suite of network and cloud professional tools. The application has completed infrastructure migration to shadcn/ui and is now ready for individual tool migrations.

### Key Technologies
- **React 19** - Modern React with native metadata support (functional components with hooks only)
- **Vite 6.3.1** - Build tool with optimized chunking strategy and ES modules
- **shadcn/ui + Radix UI** - Accessible component library with Tailwind styling
- **Tailwind CSS v4** - CSS-first configuration with PostCSS
- **React Router DOM v7** - Client-side routing with parameterized URLs
- **JavaScript/JSX** - No TypeScript, strict functional component patterns

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

### Build Configuration & Performance
The Vite configuration (vite.config.js) includes:
- **Manual Chunking Strategy** - Vendor chunks split by category:
  - `vendor-react`: React ecosystem (react, react-dom, react-router-dom)
  - `vendor-icons`: Icon libraries (@tabler/icons-react, lucide-react)
  - `vendor-data`: Data processing (js-yaml, ajv, pako, uuid)
  - `vendor-ui`: UI utilities (@dnd-kit, @svgdotjs/svg.js, html2canvas)
  - `vendor-syntax`: Syntax highlighting (prismjs)
- **ExcelJS** - Excluded from optimization, dynamically imported for performance
- **Asset Organization** - Images in `img/`, CSS in `css/`, JS in `js/` folders
- **React Deduplication** - Ensures single React instance across all chunks
- **Path Alias** - `@` alias for `src/` directory imports
- **Source Maps** - Enabled for production debugging
- **Lazy Loading** - All tools use React.lazy() with error boundaries

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

### Critical Code Conventions
- **NEVER create files unless absolutely necessary** - Always edit existing file, unless the file is more than 200 lines of code then add your additions as a compoent
- **Functional components with hooks only** - No class components
- **Component files**: `.jsx` extension, **Utility files**: `.js` extension  
- **PascalCase** for components, **camelCase** for utilities
- **NO COMMENTS** unless explicitly requested by the user
- **JavaScript/JSX only** - This is NOT a TypeScript project
- **Always create documentation files** Place all documention in the docs folder, see `docs/README.md` for an overview of documentation structure
- **Follow existing patterns exactly** - Study neighboring files and `docs` for conventions

### External Dependencies
**Check existing usage before adding new dependencies:**
- **Core UI**: @radix-ui/* (primitives), tailwind-merge, class-variance-authority
- **Icons**: @tabler/icons-react, lucide-react
- **Data Processing**: js-yaml, @ltd/j-toml, ajv/ajv-formats, better-ajv-errors, pako
- **Network/Security**: netmask, jose, jwt-decode
- **Visualization**: @svgdotjs/svg.js, html2canvas, d3-force
- **Interaction**: @dnd-kit/*, react-dropzone, framer-motion
- **State**: zustand (lightweight store), next-themes (theme management)
- **Utilities**: uuid, date-fns, dayjs, exceljs (dynamic import)
- **Build**: prismjs (syntax highlighting with custom KQL), sonner (toasts)

### SEO System
- **Dynamic Meta Tags** - Tool-specific SEO metadata via `toolsConfig.json`
- **SEOHead Component** - Manages meta tags, Open Graph, and Schema.org data
- **React 19 Compatible** - Future-ready metadata approach using native support
- **Sitemap Generation** - Automatic sitemap.xml generation during build

## Current Layout System (NEW)

### Sidebar Navigation (`src/components/layout/NewLayout.jsx`)
- **Full-height sidebar** with collapsible tool categories
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

## Performance & Security Considerations

### Client-Side Architecture
- **Privacy-focused**: All data processing happens client-side, never leaves the browser
- **No registration required**: Tools work instantly without accounts or tracking
- **localStorage persistence**: Tool state and preferences saved locally for better UX

### Performance Optimizations
- **Lazy loading**: All tools use React.lazy() with error boundaries and fallback components
- **Dynamic imports**: Large dependencies (ExcelJS) loaded only when needed
- **Manual chunking**: Vendor dependencies split by category for optimal loading
- **Source maps**: Enabled for production debugging and error tracking
- **Tailwind CSS v4**: Optimized CSS generation and smaller bundle sizes

## Important Notes for Development

### Available Tools (All Migrated to shadcn/ui)
The application contains 14 professional tools, all using shadcn/ui components:
- **Network Tools**: Network Designer & Subnet Calculator, DNS Lookup, WHOIS Lookup, SSL Checker
- **Azure Tools**: Resource Naming Tool (CAF compliant), KQL Query Builder
- **Microsoft Tools**: Portals (GDAP), Tenant Lookup
- **Security Tools**: JWT Decoder/Validator, Password Generator
- **Developer Tools**: Base64 Encoder/Decoder, Data Converter (JSON/YAML/TOML), CRON Builder
- **Utility Tools**: Buzzword Ipsum Generator

### Key Architecture Patterns
1. **Tool Configuration System**: All tools centrally defined in `src/utils/toolsConfig.json`
   - Complete metadata: SEO, routing, features, categories, icons
   - Automatic route generation and navigation menu population
2. **Lazy Loading with Error Boundaries**: All tools use React.lazy() with custom fallback components
3. **Parameterized URLs**: Deep linking support (e.g., `/ssl-checker/:domain`, `/jwt/:token`)
4. **External API Integration**: Cloudflare Workers proxy configured in `src/utils/api/apiConfig.json`
5. **State Management**: localStorage persistence + React Context + custom hooks pattern
6. **Icon Management**: Centralized imports via `src/utils/_iconImports.js`
7. **SEO Optimization**: Dynamic meta tags, Open Graph, Schema.org markup per tool

### React Development Patterns
Follow these specific patterns from the codebase:

```jsx
// Custom hook pattern for tool state management
const useToolName = () => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('toolName-state');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('toolName-state', JSON.stringify(state));
  }, [state]);

  return { state, setState };
};
```

**Error Handling & Security Requirements:**
- Always implement loading and error states for async operations
- Use try-catch blocks with meaningful user error messages
- All sensitive processing happens client-side only
- Never send tokens/credentials to external services
- Use secure random generation where appropriate

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
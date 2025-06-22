# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (includes sitemap generation)
- `npm run generate:sitemap` - Generate sitemap.xml file
- `npm run lint` - Run ESLint code linting
- `npm run preview` - Preview production build locally

### Testing
The project does not currently have a formal test framework configured. When adding tests, check the project structure to determine the appropriate testing approach.

## Architecture Overview

This is a React 19 single-page application (SPA) built with Vite that provides a suite of network and cloud professional tools. The application follows a modular architecture with tool-specific components.

### Key Technologies
- **React 19** - Modern React with native metadata support
- **Vite** - Build tool with optimized chunking strategy
- **Mantine** - UI framework for consistent design
- **React Router DOM** - Client-side routing

### Project Structure

```
src/
├── components/
│   ├── common/           # Shared components (SEO, storage management)
│   ├── layout/           # Layout components (navigation, home view)
│   └── tools/            # Individual tool implementations
│       ├── azure-kql/    # Azure KQL Query Builder
│       ├── azure-naming/ # Azure Resource Naming Tool
│       ├── base64/       # Base64 Encoder/Decoder
│       ├── cron/         # CRON Expression Builder
│       ├── data-converter/ # Data format converter
│       ├── dns-lookup/   # DNS Lookup Tool
│       ├── jwt/          # JWT Decoder/Validator
│       ├── microsoft-portals/ # Microsoft Portals (GDAP)
│       ├── network-designer/  # Network Designer & Subnet Calculator
│       ├── password-generator/ # Password Generator
│       ├── ssl-checker/  # SSL Certificate Checker
│       ├── tenant-lookup/ # Microsoft Tenant Lookup
│       └── whois/        # WHOIS Lookup Tool
├── utils/                # Shared utilities and configurations
│   ├── api/             # API utilities and configuration
│   ├── azure/           # Azure-specific utilities
│   ├── network/         # Network calculation utilities
│   └── regions/         # Cloud provider region data
└── data/                # Static data files
```

### Tool Architecture Pattern

Each tool follows a consistent pattern:
- **Main Component** - Primary tool interface (e.g., `AzureKQLTool.jsx`)
- **Sub-components** - Specialized UI components for complex tools
- **Hooks** - Custom React hooks for state management (`useToolName.js`)
- **Utils** - Tool-specific utility functions
- **Context** - React context for complex state sharing (when needed)

### State Management
- **localStorage** - Persistent storage for user preferences and tool state
- **React Context** - Complex state sharing within tools
- **Custom Hooks** - Encapsulated tool-specific state logic

### Build Configuration
The Vite configuration includes:
- **Manual Chunking** - Optimized vendor chunks for performance
- **Asset Organization** - Structured output for images, CSS, and JS
- **Source Maps** - Enabled for production debugging
- **Dependency Optimization** - React deduplication and proper bundling

### SEO System
- **Dynamic Meta Tags** - Tool-specific SEO metadata via `toolsConfig.json`
- **Schema.org** - Structured data for search engines  
- **Open Graph** - Social media sharing optimization
- **React 19 Compatible** - Future-ready metadata approach

### Backend Services
External services are accessed through Cloudflare Workers for:
- SSL certificate analysis (SSL Labs API)
- DNS lookups (multiple providers)
- WHOIS/tenant information (RDAP protocol)
- Microsoft API integrations

## Development Guidelines

### Adding New Tools
1. Create tool directory in `src/components/tools/`
2. Add tool configuration to `src/utils/toolsConfig.json`
3. Implement main component following existing patterns
4. Add routing configuration
5. Update navigation if needed

### Code Conventions
- Use functional components with hooks
- Follow existing naming patterns (PascalCase for components, camelCase for utilities)
- Implement proper error handling and loading states
- Use Mantine components for UI consistency
- Add tool-specific SEO metadata

### External Dependencies
The project uses specific libraries for different tools:
- **netmask** - IPv4 subnet calculations (Network Designer)
- **js-yaml, @ltd/j-toml** - Data format parsing (Data Converter)
- **jose, jwt-decode** - JWT processing (JWT Tool)
- **prismjs** - Syntax highlighting
- **@dnd-kit** - Drag and drop functionality
- **ajv** - JSON schema validation

Always check existing usage before adding new dependencies.

### File Structure Conventions
- Component files use `.jsx` extension
- Utility files use `.js` extension
- Test files use `.test.js` extension (when implemented)
- Configuration files use `.json` extension

### Performance Considerations
- The build is optimized with chunking strategies defined in `vite.config.js`
- ExcelJS is excluded from optimization due to size
- Large dependencies are dynamically imported when possible
- Tool state is persisted to localStorage for better UX
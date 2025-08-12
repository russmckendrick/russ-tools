# RussTools Documentation

Welcome to the comprehensive documentation for RussTools - a modern suite of web-based developer and IT professional tools.

## 📚 Documentation Structure

### Core Documentation
- **[Architecture Guide](ARCHITECTURE.md)** - Comprehensive technical architecture overview
- **[Development Guide](DEVELOPMENT.md)** - Complete development setup and guidelines
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment and infrastructure setup

### Component Documentation
- **[API Configuration System](api/API_CONFIG.md)** - Centralized API endpoint management
- **[Design Style Guide](STYLE_GUIDE.md)** - UI/UX patterns and design system
 - **Shadcn Component Map**
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

### Tool Documentation
Individual documentation for each major tool:

#### Network & Infrastructure Tools
- **[Network Designer & Subnet Calculator](tools/network-designer/README.md)** - IP subnet planning and visualization
- **[DNS Lookup Tool](tools/dns-lookup/README.md)** - Multi-provider DNS query and analysis
- **[WHOIS Lookup Tool](tools/whois-lookup/README.md)** - Domain and IP address investigation
- **[SSL Certificate Checker](tools/ssl-checker/README.md)** - Comprehensive SSL/TLS analysis

#### Microsoft Ecosystem Tools
- **[Azure KQL Query Builder](tools/azure-kql/README.md)** - Interactive KQL query builder with sharing support
- **[Azure Resource Naming Tool](tools/azure-naming/README.md)** - Azure naming convention generator with shareable configurations
- **[Microsoft Portals (GDAP)](tools/microsoft-portals/README.md)** - Portal discovery for CSP partners
- **[Microsoft Tenant Lookup](tools/tenant-lookup/README.md)** - Tenant information discovery

#### Security & Authentication Tools
- **[JWT Decoder/Validator](tools/jwt/README_JWT.md)** - JWT token analysis and validation
- **[Password Generator](tools/password-generator/README.md)** - Cryptographically secure password generation

#### Data Processing Tools
- **[Base64 Encoder/Decoder](tools/base64/README.md)** - Base64 encoding with file support
- **[Data Converter](tools/data-converter/README.md)** - JSON/YAML/TOML conversion and validation

#### Automation Tools
- **[CRON Expression Builder](tools/cron-builder/README.md)** - Interactive cron expression builder

### Backend Services Documentation
- **[Cloudflare Workers](cloudflare-workers/README.md)** - Complete backend services documentation

### Utility Documentation
- **[ShareLink Utility](utils/sharelink.md)** - Configuration sharing and URL compression system
- **[TLD Utilities](utils/tld-utilities.md)** - Top-level domain utility functions

## 🚀 Quick Start

### For Users
1. Visit [https://www.russ.tools/](https://www.russ.tools/)
2. Select the tool you need from the homepage
3. Each tool includes built-in help and examples

### For Developers
1. Read the [Architecture Guide](ARCHITECTURE.md) for technical overview
2. Follow the [Development Guide](DEVELOPMENT.md) for setup instructions
3. Review the [Design Style Guide](components/STYLE_GUIDE.md) for UI patterns

### For DevOps/Deployment
1. Review the [Deployment Guide](DEPLOYMENT.md) for infrastructure setup
2. Configure API endpoints using the [API Configuration System](api/API_CONFIG.md)
3. Set up monitoring and security as outlined in deployment documentation

## 🏗️ Architecture Overview

RussTools is built as a modern React SPA with:

- **Frontend**: React 19 + Vite + Shadcn UI (Radix + Tailwind)
- **Backend**: Cloudflare Workers for API proxying (SSL, Tenant, WHOIS services)
- **State Management**: React Context + Local Storage
- **Deployment**: Static hosting with edge functions

Key architectural principles:
- **Privacy-first**: Sensitive operations performed client-side only
- **Performance-optimized**: Global CDN distribution and caching
- **Security-focused**: CSP headers, HTTPS everywhere, input validation
- **Developer-friendly**: Component-based architecture with consistent patterns
- **Collaboration-enabled**: Shareable configuration links with gzip compression

## 🛠️ Tool Categories

### Network & Infrastructure (4 Tools)
Professional networking tools for subnet planning, DNS analysis, SSL certificate validation, and domain investigation. Network Designer includes shareable configuration links.

### Microsoft Ecosystem (4 Tools)
Specialized tools for Azure resource management, KQL query building, tenant discovery, and partner portal access. Azure KQL and Azure Naming tools include shareable configuration links.

### Security & Authentication (2 Tools)
Privacy-focused tools for JWT analysis and secure password generation.

### Data Processing (2 Tools)
File conversion and encoding tools supporting multiple formats.

### Automation (1 Tool)
Cron expression builder for scheduling automation tasks.

## 📊 Documentation Statistics

- **Total Documentation Files**: 25+
- **Lines of Documentation**: 75,000+
- **Tool Coverage**: 11 major tools fully documented
- **Backend Services**: 3 Cloudflare Workers fully documented
- **API Endpoints**: 15+ documented with examples
- **Component Patterns**: 50+ documented design patterns

## 🔍 Finding Information

### By Topic
- **Development Setup** → [Development Guide](DEVELOPMENT.md)
- **API Integration** → [API Configuration](api/API_CONFIG.md)
- **Backend Services** → [Cloudflare Workers](cloudflare-workers/README.md)
- **UI Components** → [Style Guide](components/STYLE_GUIDE.md)
- **Deployment** → [Deployment Guide](DEPLOYMENT.md)
- **Specific Tool** → `tools/[tool-name]/README.md`

### By Role
- **End Users** → Individual tool documentation in `tools/`
- **Developers** → [Development Guide](DEVELOPMENT.md) + [Architecture](ARCHITECTURE.md)
- **Designers** → [Style Guide](components/STYLE_GUIDE.md)
- **DevOps** → [Deployment Guide](DEPLOYMENT.md)
- **API Users** → [API Configuration](api/API_CONFIG.md)

## 🧩 Integration Examples

### Adding a New Tool
```javascript
// 1. Add to toolsConfig.json
{
  "id": "my-tool",
  "title": "My Tool",
  "path": "/my-tool"
}

// 2. Create component following patterns
export function MyToolTool() {
  const seoData = generateToolSEO(toolConfig);
  return (
    <>
      <SEOHead {...seoData} />
      {/* Tool implementation */}
    </>
  );
}
```

### Using API Configuration
```javascript
import { getApiEndpoint, apiFetch } from '../utils/apiUtils';

const endpoint = getApiEndpoint('ssl');
const response = await apiFetch(endpoint.url);
```

### Following Design Patterns
```jsx
<Paper withBorder p="xl" radius="lg">
  <Stack gap="lg">
    <Group gap="md">
      <ThemeIcon size={48} color="blue">
        <IconTool />
      </ThemeIcon>
      <Title order={2}>Tool Name</Title>
    </Group>
  </Stack>
</Paper>
```

## 🔒 Security Considerations

### Client-Side Security
- JWT decoding and password generation performed entirely in browser
- No sensitive data transmitted to external services
- Local storage used for non-sensitive preferences only

### API Security
- All external API calls proxied through Cloudflare Workers
- API keys and secrets managed through environment variables
- Rate limiting and CORS policies enforced

### Privacy Features
- No user tracking or analytics on sensitive tools
- Local-only processing for cryptographic operations
- Clear data retention policies documented per tool

## 🚀 Performance Features

### Frontend Optimization
- Code splitting by route and functionality
- Lazy loading for heavy components
- Optimized bundle sizes with tree shaking

### Backend Optimization
- Edge computing with Cloudflare Workers
- Intelligent caching strategies
- CDN distribution for global performance

### User Experience
- Offline functionality for core tools
- Progressive web app features
- Responsive design for all screen sizes

## 📱 Browser Support

### Supported Browsers
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced features enabled with modern browser APIs
- Graceful degradation for older browsers

## 🤝 Contributing

### Documentation Contributions
1. Follow existing documentation patterns
2. Update relevant sections when adding features
3. Include code examples and use cases
4. Test documentation accuracy

### Code Contributions
1. Follow the [Development Guide](DEVELOPMENT.md)
2. Adhere to the [Style Guide](components/STYLE_GUIDE.md)
3. Update documentation for new features
4. Include comprehensive testing

## 📞 Support

### Self-Service Resources
- Tool-specific documentation in `tools/` directory
- Troubleshooting guides in development documentation
- Code examples throughout documentation

### Development Support
- Comprehensive development setup guide
- Component pattern examples
- API integration documentation

## 📈 Roadmap

### Planned Documentation Enhancements
- Interactive API documentation
- Video tutorials for complex tools
- Migration guides for major updates
- Performance optimization guides

### Tool Documentation Expansion
- Advanced use case examples
- Integration with external services
- Automation workflow documentation
- Enterprise deployment scenarios

## 📋 Documentation Maintenance

### Update Schedule
- Monthly review of accuracy
- Quarterly comprehensive updates
- Immediate updates for security changes
- Version-controlled documentation changes

### Quality Assurance
- Code examples tested with each release
- Documentation reviewed for clarity
- Links and references validated regularly
- User feedback incorporated into updates

---

**Note**: This documentation is continuously updated. For the most current information, always refer to the latest version in the repository.
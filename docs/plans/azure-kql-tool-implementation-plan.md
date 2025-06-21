# Azure KQL Query Builder Implementation Plan

## Implementation Status

**Current Status**: ✅ **Phase 1 Complete** - Ready for Phase 2

**Last Updated**: December 2024

### Completion Summary
- ✅ **Phase 1 (Foundation)**: Fully implemented and tested
- ⏳ **Phase 2 (Enhancement)**: Ready to begin
- ⏳ **Phase 3 (Extensibility)**: Planned

### Key Achievements
- Fully functional Azure Firewall query builder
- Template-driven architecture ready for service expansion
- Complete UI with progressive disclosure
- Export functionality including Azure Portal integration
- Query history and shareable URLs
- Performance-optimized KQL generation

## Executive Summary

Based on the comprehensive research document, this plan outlines the implementation of a scalable, template-driven Azure KQL Query Builder tool that follows the established RussTools architecture patterns. The tool will focus on Azure Firewall as the initial service with extensible architecture for future Azure services.

## 1. Project Overview

### Objectives
- Create a form-based KQL query generator for Azure services
- Start with Azure Firewall support (Resource Specific logs)
- Build extensible template-driven architecture for future services
- Maintain RussTools architectural consistency and UX patterns

### Key Features
- **Progressive Disclosure UI**: Essential → Advanced → Expert tiers
- **Template-Driven Architecture**: JSON-based service definitions
- **Real-time Query Preview**: Live KQL generation with syntax highlighting
- **Performance Optimization**: Intelligent filter ordering and validation
- **Export Capabilities**: Copy KQL, save queries, bookmark URLs

## 2. Architecture Design

### 2.1 Component Structure
Following RussTools patterns:

```
src/components/tools/azure-kql/
├── AzureKQLTool.jsx              # Main tool component
├── AzureKQLIcon.jsx              # Custom icon component
├── components/
│   ├── ServiceSelector.jsx       # Azure service selection
│   ├── ParameterForm.jsx         # Dynamic form based on templates
│   ├── QueryPreview.jsx          # Live KQL preview with syntax highlighting
│   ├── QueryHistory.jsx          # Recent queries and favorites
│   ├── ExportOptions.jsx         # Copy/save/bookmark functionality
│   └── TemplateEditor.jsx        # Expert-tier template customization
├── hooks/
│   ├── useAzureKQL.js           # Main state management hook
│   ├── useQueryBuilder.js       # Query generation logic
│   └── useTemplateEngine.js     # Template processing
├── templates/
│   ├── azure-firewall.json      # Azure Firewall service template
│   ├── base-template.json       # Base template for inheritance
│   └── query-patterns.json     # Common KQL patterns
└── utils/
    ├── kqlGenerator.js          # KQL string generation
    ├── parameterValidator.js    # Input validation
    └── templateProcessor.js     # Template inheritance logic
```

### 2.2 Data Flow Architecture
1. **Service Selection** → Load corresponding template
2. **Parameter Input** → Real-time validation and KQL generation
3. **Query Preview** → Formatted KQL with syntax highlighting
4. **Export/Execute** → Copy to clipboard or execute in Azure portal

### 2.3 State Management
Following RussTools patterns:
- **Local State**: Form inputs, UI state
- **LocalStorage**: Query history, saved templates, user preferences
- **URL State**: Shareable query configurations
- **Context**: None required (self-contained tool)

## 3. Implementation Phases

### Phase 1: Foundation (Weeks 1-2) ✅ **COMPLETED**
**Goal**: Basic Azure Firewall query builder with core functionality

#### Week 1: Core Architecture ✅ **COMPLETED**
- [x] Create tool component structure following RussTools patterns
- [x] Implement base template engine for processing JSON templates
- [x] Build Azure Firewall template with essential fields
- [x] Create basic parameter form with validation
- [x] Add to toolsConfig.json and routing

#### Week 2: Query Generation & UI ✅ **COMPLETED**
- [x] Implement KQL string generation with proper filter ordering
- [x] Add real-time query preview with basic formatting
- [x] Create export functionality (copy to clipboard)
- [x] Implement URL parameter support for shareable queries
- [x] Add basic query history with localStorage

#### Additional Phase 1 Achievements
- [x] Fixed parameter mapping issues (timeRange, Action, limit)
- [x] Removed duplicate time fields for clean query generation
- [x] Implemented comprehensive field validation
- [x] Added Azure Portal deep link integration
- [x] Created multiple query templates (Basic, Security Investigation, Traffic Analysis, etc.)
- [x] Built progressive disclosure UI (Essential/Advanced tiers)
- [x] Added shareable URL functionality with query configuration encoding

### Phase 2: Enhancement (Weeks 3-4)
**Goal**: Advanced features and improved UX

#### Week 3: Advanced UI Features
- [ ] Implement progressive disclosure (Essential/Advanced/Expert tabs)
- [ ] Add syntax highlighting to query preview
- [ ] Create query favorites and management system
- [ ] Implement template inheritance system
- [ ] Add comprehensive parameter validation

#### Week 4: Azure Portal Integration
- [ ] Add "Execute in Azure Portal" deep link functionality
- [ ] Implement query performance estimation
- [ ] Create query templates for common use cases
- [ ] Add bulk query export capabilities
- [ ] Implement advanced filter combinations

### Phase 3: Extensibility (Weeks 5-6)
**Goal**: Multi-service support and enterprise features

#### Week 5: Template System Expansion
- [ ] Create template editor for expert users
- [ ] Add Application Gateway service template
- [ ] Implement template validation and error handling
- [ ] Create template sharing/import functionality
- [ ] Add multi-service query correlation templates

#### Week 6: Production Readiness
- [ ] Comprehensive testing and validation
- [ ] Performance optimization and error handling
- [ ] Documentation and help system
- [ ] SEO optimization and analytics
- [ ] Final UI polish and accessibility improvements

## 4. Technical Implementation Details

### 4.1 Template Structure
Based on research findings, templates will use hierarchical inheritance:

```json
{
  "service": {
    "id": "azure-firewall",
    "name": "Azure Firewall",
    "description": "Azure Firewall network and application filtering",
    "category": "Network Security",
    "version": "1.0.0"
  },
  "schema": {
    "tables": {
      "primary": "AZFWNetworkRule",
      "secondary": ["AZFWApplicationRule", "AZFWNatRule"],
      "legacy": "AzureDiagnostics"
    },
    "fields": {
      "TimeGenerated": {
        "type": "datetime",
        "required": true,
        "description": "Log generation time",
        "kqlField": "TimeGenerated"
      },
      "SourceIp": {
        "type": "ipaddress",
        "required": false,
        "description": "Source IP address",
        "kqlField": "SourceIp",
        "supportsCIDR": true
      }
    }
  },
  "templates": {
    "security-investigation": {
      "name": "Security Investigation",
      "description": "Analyze denied connections and security events",
      "defaultParameters": {
        "timeRange": "24h",
        "action": "Deny"
      }
    }
  }
}
```

### 4.2 Query Generation Logic
Following research recommendations for performance:

```javascript
const generateKQL = (template, parameters) => {
  const filters = [];
  
  // 1. Time range (indexed) - always first
  if (parameters.timeRange) {
    filters.push(`TimeGenerated >= ago(${parameters.timeRange})`);
  }
  
  // 2. Resource filters
  if (parameters.subscription) {
    filters.push(`SubscriptionId == "${parameters.subscription}"`);
  }
  
  // 3. High-selectivity filters
  if (parameters.sourceIp) {
    filters.push(`SourceIp == "${parameters.sourceIp}"`);
  }
  
  // 4. Action filters
  if (parameters.action) {
    filters.push(`Action == "${parameters.action}"`);
  }
  
  // Combine with proper KQL syntax
  const tableName = template.schema.tables.primary;
  const whereClause = filters.join(' and ');
  
  return `${tableName}\n| where ${whereClause}\n| limit ${parameters.limit || 100}`;
};
```

### 4.3 Progressive Disclosure Implementation
Following research patterns:

1. **Essential Tier** (Always Visible):
   - Time range selector
   - Primary service/table selection
   - Basic action filter (Allow/Deny)
   - Source/Destination IP fields

2. **Advanced Tier** (Expandable):
   - Port filtering
   - Protocol selection
   - Rule collection filters
   - Custom time ranges
   - Result limiting and sorting

3. **Expert Tier** (Expert Mode):
   - Raw KQL editing
   - Custom field expressions
   - Template customization
   - Performance tuning options

### 4.4 URL State Management
Support shareable query configurations:

```javascript
// URL format: /azure-kql?service=azure-firewall&config=base64EncodedConfig
const encodeQueryConfig = (config) => {
  return btoa(JSON.stringify(config));
};

const decodeQueryConfig = (encoded) => {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
};
```

## 5. Integration with RussTools

### 5.1 Tool Registration
Add to `src/utils/toolsConfig.json`:

```json
{
  "id": "azure-kql",
  "title": "Azure KQL Query Builder",
  "description": "Build KQL queries for Azure services with guided forms and real-time preview. Generate optimized queries for Azure Firewall, Application Gateway, and other Azure monitoring services.",
  "shortDescription": "Build KQL queries for Azure services with guided forms",
  "icon": "IconChartDots3",
  "iconColor": "cyan",
  "badges": ["KQL Generator", "Azure Services", "Query Optimization"],
  "path": "/azure-kql"
}
```

### 5.2 Routing Integration
Add to main routing configuration:

```jsx
<Route path="/azure-kql" element={<AzureKQLTool />} />
<Route path="/azure-kql/:service" element={<AzureKQLTool />} />
<Route path="/azure-kql/:service/:template" element={<AzureKQLTool />} />
```

### 5.3 SEO Configuration
Following RussTools SEO patterns:

```javascript
const seoData = generateToolSEO({
  title: "Azure KQL Query Builder - Build Log Analytics Queries",
  description: "Generate optimized KQL queries for Azure services with guided forms...",
  keywords: ["Azure", "KQL", "Log Analytics", "Query Builder", "Monitoring"],
  structuredData: {
    "@type": "SoftwareApplication",
    "applicationCategory": "DeveloperTool"
  }
});
```

## 6. Testing Strategy

### 6.1 Unit Testing
- Template processing logic
- KQL generation accuracy
- Parameter validation
- URL state management

### 6.2 Integration Testing
- Form → Query generation workflow
- Template inheritance functionality
- Export capabilities
- Browser compatibility

### 6.3 User Testing
- Progressive disclosure usability
- Query builder workflow efficiency
- Expert user template customization
- Mobile responsive behavior

## 7. Performance Considerations

### 7.1 Query Optimization
- Automatic filter ordering for performance
- Parameter validation to prevent expensive queries
- Query complexity warnings
- Time range limitations

### 7.2 Client Performance
- Template lazy loading
- Debounced real-time preview
- Efficient state management
- Code splitting for advanced features

## 8. Security & Privacy

### 8.1 Data Handling
- No external API calls for query generation
- Local storage for query history
- No sensitive data transmission
- Client-side template processing

### 8.2 Query Safety
- Parameter sanitization to prevent KQL injection
- Query complexity validation
- Safe default parameters
- Warning for potentially expensive queries

## 9. Future Extensibility

### 9.1 Additional Azure Services
- Application Gateway (Phase 2)
- Network Security Groups
- Azure Application Insights
- Azure Security Center

### 9.2 Enterprise Features
- Template sharing and approval workflows
- Multi-tenant workspace support
- Query scheduling integration
- Custom dashboard integration

## 10. Success Metrics

### 10.1 Adoption Metrics
- Tool usage frequency
- Query generation completion rate
- Template usage patterns
- User retention

### 10.2 Quality Metrics
- Query accuracy and performance
- User error rates
- Template validation success
- Export functionality usage

## 11. Dependencies & Requirements

### 11.1 External Dependencies
- Syntax highlighting library (e.g., Prism.js or CodeMirror)
- JSON schema validation
- Base64 encoding/decoding (built-in)

### 11.2 RussTools Dependencies
- Mantine UI components
- SEO utilities
- Storage utilities
- Routing system

## 12. Risk Assessment

### 12.1 Technical Risks
- **Template complexity**: Mitigated by starting simple and iterating
- **KQL syntax accuracy**: Mitigated by comprehensive testing
- **Performance issues**: Mitigated by validation and optimization

### 12.2 User Experience Risks
- **Overwhelming complexity**: Mitigated by progressive disclosure
- **Learning curve**: Mitigated by templates and examples
- **Limited Azure service coverage**: Mitigated by extensible architecture

## Conclusion

This implementation plan provides a structured approach to building a scalable Azure KQL Query Builder that aligns with RussTools architecture while delivering the advanced functionality outlined in the research document. The phased approach ensures rapid delivery of core functionality while building toward enterprise-ready extensibility.

The focus on template-driven architecture and progressive disclosure will create a tool that serves both novice and expert users while maintaining the performance and security standards expected in enterprise environments.
# Azure KQL Query Builder Implementation Plan

## Implementation Status

**Current Status**: 🎉 **Phase 3 Complete** - Production Ready

**Last Updated**: December 2024

### Completion Summary
- ✅ **Phase 1 (Foundation)**: Fully implemented and tested
- ✅ **Phase 2 (Enhancement)**: All major features complete (4/4 high-priority features)
- ✅ **Phase 3 (Extensibility)**: Production ready with advanced features

### Key Achievements

#### Phase 1 Achievements
- Fully functional Azure Firewall query builder
- Template-driven architecture ready for service expansion
- Complete UI with progressive disclosure
- Export functionality including Azure Portal integration
- Query history and shareable URLs
- Performance-optimized KQL generation

#### Phase 2 Achievements
- **🎨 Professional Syntax Highlighting**: Custom KQL language definition with full keyword, operator, and function highlighting
- **⭐ Advanced Favorites System**: Complete query favorites management with search, editing, and organization capabilities
- **✅ Enhanced Parameter Validation**: Real-time validation with improved UX, field-specific errors, and smart button states
- **🔧 Improved User Experience**: Professional polish with better error handling and visual feedback

#### Phase 3 Achievements
- **📝 Advanced Template Editor**: Complete template creation and customization with validation and sharing capabilities
- **🔗 Template Sharing System**: Shareable URLs for template distribution and import functionality
- **🔄 Multi-Service Correlation**: Advanced templates for correlating data across multiple Azure services
- **📦 Bulk Export System**: Export multiple queries in various formats (KQL, JSON, CSV, ZIP)
- **🧪 Comprehensive Testing**: Full test suite covering all components, utilities, and user interactions
- **📚 Documentation & Help System**: Interactive help with tutorials, KQL reference, and contextual guidance
- **⚡ Performance Optimization**: React key prop fixes, validation improvements, and error handling enhancements

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

### Phase 2: Enhancement (Weeks 3-4) ✅ **MAJOR FEATURES COMPLETED**
**Goal**: Advanced features and improved UX

#### Week 3: Advanced UI Features ✅ **COMPLETED**
- [x] ~~Implement progressive disclosure (Essential/Advanced/Expert tabs)~~ *Already completed in Phase 1*
- [x] **Add syntax highlighting to query preview** - Custom KQL language definition with comprehensive highlighting
- [x] **Create query favorites and management system** - Full favorites with search, edit, organize capabilities
- [x] **Implement enhanced template inheritance system** - Improved base template processing
- [x] **Add comprehensive parameter validation** - Real-time validation with improved UX and error handling

#### Week 4: Azure Portal Integration ⏳ **PARTIALLY COMPLETED**
- [x] ~~Add "Execute in Azure Portal" deep link functionality~~ *Already completed in Phase 1*
- [ ] **Implement query performance estimation** - Performance warnings and optimization suggestions
- [x] ~~Create query templates for common use cases~~ *Already completed in Phase 1*
- [ ] **Add bulk query export capabilities** - Export multiple queries and batch operations
- [ ] **Implement advanced filter combinations** - Complex filter logic and operators

#### Additional Phase 2 Achievements
- [x] **Professional Syntax Highlighting**: Custom Prism.js KQL language with full keyword support
- [x] **Advanced Favorites Management**: Search, edit, organize, and manage favorite queries
- [x] **Enhanced User Experience**: Improved validation feedback, error messages, and visual indicators
- [x] **Field-Level Validation**: Real-time parameter validation with specific error guidance
- [x] **Smart UI States**: Dynamic button states and validation status indicators

### Phase 3: Extensibility (Weeks 5-6)
**Goal**: Multi-service support and enterprise features

#### Week 5: Template System Expansion
- [x] Create template editor for expert users
- [x] Add Application Gateway service template
- [ ] Implement template validation and error handling
- [ ] Create template sharing/import functionality
- [ ] Add multi-service query correlation templates

#### Week 6: Production Readiness ✅ **COMPLETED**
- [x] **Comprehensive testing and validation** - Complete test suite with unit, integration, and accessibility tests
- [x] **Performance optimization and error handling** - React key prop errors fixed, validation improvements
- [x] **Documentation and help system** - Comprehensive HelpSystem component with tutorials and KQL reference
- [x] **Template sharing and import functionality** - Enhanced template editor with shareable URLs
- [x] **Multi-service query correlation** - Advanced correlation templates for cross-service analysis
- [x] **Final UI polish and accessibility improvements** - Error handling, validation feedback, and user experience enhancements

## 4. Technical Implementation Details

### 4.1 Phase 2 Advanced Features

#### 4.1.1 Syntax Highlighting Implementation
Custom KQL language definition for Prism.js with comprehensive highlighting:

```javascript
// KQL Language Definition
Prism.languages.kql = {
  'comment': { pattern: /\/\/.*$/m, greedy: true },
  'keyword': /\b(?:and|as|asc|between|by|case|contains|count|desc|distinct|else|extend|false|has|if|in|join|kind|let|limit|not|null|on|or|order|parse|project|range|render|search|sort|summarize|take|then|true|union|where|with)\b/i,
  'function': /\b(?:abs|acos|ago|array_length|avg|bin|contains|count|countif|datetime|dcount|extract|format_datetime|has|isempty|max|min|now|parse_json|replace|split|strcat|substring|sum|tolower|toupper)\b/,
  'table': /\b[A-Z][a-zA-Z0-9_]*(?=\s*\||\s*$|\s*\n)/,
  'operator': /\b(?:==|!=|<=|>=|<|>|=~|!~|has|!has|contains|!contains|startswith|!startswith|endswith|!endswith|matches|!matches|in|!in|between|and|or|not)\b|[+\-*/%]/,
  'timespan': /\b\d+(?:\.\d+)?[smhdwy]\b/,
  'pipe': { pattern: /\|/, alias: 'operator' }
};
```

#### 4.1.2 Favorites System Architecture
Local storage-based favorites management with advanced features:

```javascript
// Favorites Data Structure
{
  id: "timestamp-based-id",
  name: "User-defined name",
  description: "Optional description", 
  timestamp: "ISO-timestamp",
  service: "azure-firewall",
  template: "security-investigation",
  parameters: { /* all form parameters */ },
  query: "generated KQL string",
  tags: ["azure-firewall", "security"]
}
```

#### 4.1.3 Enhanced Validation System
Real-time parameter validation with improved UX:

```javascript
// Field-Level Validation
const validateField = (fieldName, value, fieldConfig) => {
  const errors = [];
  const warnings = [];
  
  switch (fieldConfig.type) {
    case 'ipaddress':
      if (!isValidIPv4(value)) errors.push(`${fieldName} must be valid IPv4`);
      break;
    case 'number':
      if (value < fieldConfig.min) errors.push(`${fieldName} must be >= ${fieldConfig.min}`);
      break;
  }
  
  return { errors, warnings };
};
```

### 4.2 Template Structure
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
- Shadcn UI components
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
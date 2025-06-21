# Azure KQL Query Builder - Technical Architecture

## Overview

The Azure KQL Query Builder follows a template-driven, component-based architecture designed for scalability, maintainability, and performance. The system transforms user-friendly form inputs into optimized KQL queries through a sophisticated template processing engine.

## Architecture Principles

### 1. Template-Driven Design
- **Configuration over Code**: Service definitions in JSON templates
- **Extensible Schema**: Easy addition of new Azure services
- **Inheritance**: Base templates with service-specific extensions
- **Validation**: Schema-driven parameter validation

### 2. Performance-First
- **Optimized Filter Ordering**: Automatic query performance optimization
- **Lazy Loading**: Templates loaded on demand
- **Client-Side Processing**: No server dependencies for query generation
- **Efficient Rendering**: Minimal re-renders and state updates

### 3. User Experience
- **Progressive Disclosure**: Essential → Advanced → Expert tiers
- **Real-Time Feedback**: Live preview and validation
- **Consistent Patterns**: RussTools UI/UX standards
- **Accessibility**: ARIA compliance through Mantine components

## Component Architecture

```
src/components/tools/azure-kql/
├── AzureKQLTool.jsx              # Main tool component
├── AzureKQLIcon.jsx              # Tool icon
├── components/                   # UI components
│   ├── ServiceSelector.jsx       # Azure service selection
│   ├── ParameterForm.jsx         # Dynamic form generation
│   ├── QueryPreview.jsx          # Live KQL preview
│   ├── QueryHistory.jsx          # History management
│   └── ExportOptions.jsx         # Export functionality
├── hooks/                        # Custom React hooks
│   └── useAzureKQL.js            # Main state management
├── templates/                    # Service templates
│   ├── base-template.json        # Base template
│   └── azure-firewall.json       # Azure Firewall template
└── utils/                        # Business logic
    ├── kqlGenerator.js           # Query generation
    ├── parameterValidator.js     # Input validation
    └── templateProcessor.js      # Template processing
```

## Data Flow

### 1. Template Loading
```
User selects service → Template processor loads JSON → Schema validation → UI generation
```

### 2. Parameter Input
```
User input → Real-time validation → State update → Query regeneration → Preview update
```

### 3. Query Generation
```
Parameters + Template → Filter building → Performance optimization → KQL output
```

### 4. Export/Share
```
Generated query → Export option → Copy/Download/Share/Azure Portal
```

## Template System

### Base Template Structure
```json
{
  "version": "1.0.0",
  "schema": {
    "fields": {
      "fieldName": {
        "type": "string|number|ipaddress|datetime|select",
        "required": false,
        "description": "Field description",
        "kqlField": "ActualKQLFieldName",
        "category": "grouping category",
        "validation": "additional validation rules"
      }
    },
    "filterOrder": ["field1", "field2", "field3"]
  },
  "queryPatterns": {
    "timeRange": {
      "relative": "TimeGenerated >= ago({range})"
    }
  },
  "defaults": {
    "timeRange": "24h",
    "limit": 100
  }
}
```

### Service Template Extension
```json
{
  "service": {
    "id": "azure-firewall",
    "name": "Azure Firewall",
    "description": "Service description",
    "category": "Network Security"
  },
  "schema": {
    "tables": {
      "primary": "AZFWNetworkRule",
      "secondary": ["AZFWApplicationRule"],
      "legacy": "AzureDiagnostics"
    },
    "fields": {
      // Service-specific fields extend base fields
    }
  },
  "templates": {
    "basic": {
      "name": "Basic Query",
      "description": "Simple query template",
      "defaultParameters": {},
      "requiredFields": []
    }
  }
}
```

## State Management

### React Hooks Pattern
```javascript
const {
  selectedService,      // Current Azure service
  selectedTemplate,     // Query template
  parameters,          // Form parameters
  generatedQuery,      // Generated KQL
  queryHistory,        // Saved queries
  currentTemplate,     // Loaded template
  // Actions
  setSelectedService,
  updateParameter,
  generateQuery,
  saveQuery,
  loadQuery,
  generateShareableURL
} = useAzureKQL();
```

### Local Storage Integration
- **Query History**: Persistent storage of recent queries
- **User Preferences**: UI state and defaults
- **Cache Management**: Template caching for performance
- **Data Privacy**: No external storage, local-only persistence

### URL State Synchronization
- **Shareable URLs**: Base64-encoded configuration in URL params
- **Browser Navigation**: Proper history management
- **Deep Linking**: Direct access to specific configurations

## Query Generation Engine

### Filter Building Process
1. **Parameter Collection**: Gather all form inputs
2. **Validation**: Type checking and business rule validation
3. **Filter Ordering**: Performance-optimized field ordering
4. **Pattern Application**: Apply template query patterns
5. **KQL Assembly**: Combine filters into final query

### Performance Optimization
```javascript
// Optimal filter order for Azure logs
const filterOrder = [
  "timeRange",        // Indexed field - highest priority
  "SubscriptionId",   // Resource filtering
  "ResourceGroup",    // Resource filtering
  "Action",          // High-selectivity string filter
  "SourceIp",        // Specific IP filtering
  "DestinationIp",   // Specific IP filtering
  "Protocol",        // Enum filtering
  "DestinationPort", // Numeric filtering
  "SourcePort",      // Numeric filtering
  // ... lower priority fields
];
```

### Query Patterns
- **Time Filtering**: `TimeGenerated >= ago({range})`
- **IP Filtering**: `ipv4_is_in_range({field}, "{cidr}")` for CIDR
- **String Filtering**: `{field} == "{value}"` for exact matches
- **Numeric Filtering**: `{field} == {value}` for numbers
- **Multi-Select**: `{field} in ({values})` for multiple options

## Validation System

### Field-Level Validation
```javascript
const validateField = (fieldName, value, fieldConfig) => {
  switch (fieldConfig.type) {
    case 'ipaddress':
      return validateIpAddress(value, fieldConfig.supportsCIDR);
    case 'number':
      return validateNumericRange(value, fieldConfig.min, fieldConfig.max);
    case 'datetime':
      return validateTimeRange(value);
    case 'select':
      return validateSelectOptions(value, fieldConfig.options);
    default:
      return validateString(value, fieldConfig);
  }
};
```

### Query-Level Validation
- **Performance Warnings**: Large time ranges, missing limits
- **Required Fields**: Essential parameter enforcement
- **Business Rules**: Service-specific validation logic
- **Syntax Checking**: KQL structure validation

## Security Considerations

### Input Sanitization
- **Parameter Validation**: Type checking and format validation
- **KQL Injection Prevention**: Template-based parameter substitution
- **No External Calls**: Client-side processing only
- **Safe Defaults**: Reasonable limits and safe default values

### Data Privacy
- **Local Processing**: No data sent to external servers
- **Optional Sharing**: URL sharing is explicit user action
- **No Tracking**: No analytics or user behavior tracking
- **Browser Storage**: Local storage only, no server persistence

## Performance Optimizations

### Client-Side Performance
- **Debounced Updates**: Prevent excessive re-rendering
- **Memoization**: Cache expensive computations
- **Lazy Loading**: Load templates on demand
- **Code Splitting**: Async component loading

### Query Performance
- **Automatic Optimization**: Filter ordering for Azure performance
- **Resource Limits**: Prevent expensive queries
- **Time Range Validation**: Reasonable time range enforcement
- **Result Limiting**: Default and maximum result limits

## Testing Strategy

### Unit Testing
- **Template Processing**: JSON schema validation and inheritance
- **Query Generation**: KQL output validation
- **Parameter Validation**: Input validation logic
- **URL Handling**: Shareable URL encoding/decoding

### Integration Testing
- **Component Integration**: Form → Query → Preview workflow
- **Storage Integration**: History save/load functionality
- **URL Integration**: Shareable URL functionality
- **Export Integration**: Copy/download/Azure Portal links

### User Testing
- **Usability Testing**: Form workflow and progressive disclosure
- **Performance Testing**: Large parameter sets and complex queries
- **Browser Testing**: Cross-browser compatibility
- **Accessibility Testing**: Screen reader and keyboard navigation

## Extensibility

### Adding New Azure Services
1. **Create Service Template**: Define schema and query patterns
2. **Add Service Icon**: Implement service-specific icon
3. **Register Service**: Add to template processor
4. **Update Documentation**: Add service-specific docs

### Adding New Field Types
1. **Extend Validation**: Add new field type validation
2. **Update Generator**: Add KQL generation logic
3. **Enhance UI**: Add appropriate input components
4. **Test Integration**: Validate end-to-end functionality

### Template Inheritance
- **Base Templates**: Common patterns across services
- **Service Templates**: Service-specific extensions
- **Query Templates**: Use-case specific configurations
- **User Templates**: Future custom template support

## Error Handling

### Graceful Degradation
- **Template Loading Errors**: Fallback to basic functionality
- **Validation Errors**: Clear error messages and recovery
- **Query Generation Errors**: Safe error handling and user feedback
- **Storage Errors**: Graceful handling of storage failures

### Error Boundaries
- **Component Isolation**: Prevent cascading failures
- **Error Reporting**: User-friendly error messages
- **Recovery Actions**: Clear paths to resolve issues
- **Debug Information**: Detailed error context for development

## Monitoring and Analytics

### Performance Monitoring
- **Query Generation Time**: Track generation performance
- **Template Loading Time**: Monitor template load performance
- **UI Responsiveness**: Measure user interaction responsiveness
- **Error Rates**: Track validation and generation errors

### Usage Analytics (Optional)
- **Template Usage**: Popular templates and services
- **Parameter Patterns**: Common parameter combinations
- **Export Preferences**: Popular export methods
- **User Workflows**: Common usage patterns

## Future Enhancements

### Phase 2 Features
- **Syntax Highlighting**: Enhanced query preview
- **Query Favorites**: Bookmark frequently used queries
- **Advanced Validation**: More sophisticated validation rules
- **Template Editor**: Expert mode for custom templates

### Phase 3 Features
- **Multi-Service Queries**: Cross-service correlation
- **Query Scheduling**: Integration with Azure automation
- **Custom Dashboards**: Query result visualization
- **Team Collaboration**: Template sharing and approval

---

*This architecture document provides the technical foundation for the Azure KQL Query Builder, ensuring scalable, maintainable, and performant implementation while following RussTools standards and best practices.*
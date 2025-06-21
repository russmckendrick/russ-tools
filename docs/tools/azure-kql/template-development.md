# Template Development Guide

This guide covers how to create and extend templates for the Azure KQL Query Builder. Templates define service schemas, field mappings, and query patterns that drive the form-based query generation.

## Template Architecture

### Template Hierarchy
```
Base Template (base-template.json)
├── Common fields (timeRange, limit, resource fields)
├── Query patterns (time filtering, basic filters)
└── Default values

Service Template (azure-firewall.json)
├── Inherits from base template
├── Service-specific fields (SourceIp, Action, Protocol)
├── Service metadata (tables, documentation)
├── Query templates (Basic, Security Investigation)
└── Filter ordering optimization
```

### Template Processing
1. **Load Base Template**: Common fields and patterns
2. **Load Service Template**: Service-specific extensions
3. **Merge Schemas**: Combine base and service fields
4. **Validate Structure**: Ensure template integrity
5. **Generate UI**: Create dynamic form components

## Base Template Structure

### Template Metadata
```json
{
  "version": "1.0.0",
  "schema": {
    "fields": {},
    "filterOrder": []
  },
  "queryPatterns": {},
  "defaults": {}
}
```

### Field Definition Schema
```json
{
  "fieldName": {
    "type": "string|number|ipaddress|datetime|select|multiselect",
    "required": false,
    "description": "Human-readable field description",
    "kqlField": "ActualKQLFieldName",
    "category": "grouping|time|network|action|resource|query",
    "default": "defaultValue",
    "min": 1,                    // For numbers
    "max": 65535,               // For numbers
    "options": ["opt1", "opt2"], // For select fields
    "supportsCIDR": true,        // For IP addresses
    "examples": ["example1"],    // For documentation
    "pattern": "regex",          // For string validation
    "minLength": 1,             // For strings
    "maxLength": 100            // For strings
  }
}
```

## Field Types

### String Fields
```json
{
  "RuleCollection": {
    "type": "string",
    "required": false,
    "description": "Name of the rule collection",
    "kqlField": "RuleCollection",
    "category": "rule",
    "minLength": 1,
    "maxLength": 100,
    "pattern": "^[a-zA-Z0-9_-]+$"
  }
}
```

### Number Fields
```json
{
  "DestinationPort": {
    "type": "number",
    "required": false,
    "description": "Destination port number",
    "kqlField": "DestinationPort",
    "category": "network",
    "min": 1,
    "max": 65535,
    "commonPorts": [22, 23, 25, 53, 80, 443]
  }
}
```

### IP Address Fields
```json
{
  "SourceIp": {
    "type": "ipaddress",
    "required": false,
    "description": "Source IP address of the connection",
    "kqlField": "SourceIp",
    "category": "network",
    "supportsCIDR": true,
    "examples": ["192.168.1.1", "10.0.0.0/8"]
  }
}
```

### DateTime Fields
```json
{
  "timeRange": {
    "type": "datetime",
    "required": false,
    "description": "Time range for the query",
    "category": "time",
    "default": "24h"
  }
}
```

### Select Fields
```json
{
  "Action": {
    "type": "select",
    "required": false,
    "description": "Firewall action taken",
    "kqlField": "Action",
    "category": "action",
    "options": ["Allow", "Deny", "DNAT"],
    "default": "Deny"
  }
}
```

### Multi-Select Fields
```json
{
  "Protocols": {
    "type": "multiselect",
    "required": false,
    "description": "Network protocols",
    "kqlField": "Protocol",
    "category": "network",
    "options": ["TCP", "UDP", "ICMP", "HTTP", "HTTPS"]
  }
}
```

## Query Patterns

### Pattern Definitions
```json
{
  "queryPatterns": {
    "timeRange": {
      "relative": "TimeGenerated >= ago({range})",
      "absolute": "TimeGenerated between(datetime({start}) .. datetime({end}))"
    },
    "basicFilter": "{field} == \"{value}\"",
    "inFilter": "{field} in ({values})",
    "containsFilter": "{field} contains \"{value}\"",
    "regexFilter": "{field} matches regex \"{pattern}\"",
    "numericFilter": "{field} {operator} {value}",
    "ipFilter": "ipv4_is_in_range({field}, \"{cidr}\")"
  }
}
```

### Pattern Usage
- **{field}**: Replaced with actual KQL field name
- **{value}**: Replaced with parameter value
- **{range}**: Replaced with time range value
- **{operator}**: Replaced with comparison operator
- **{values}**: Replaced with comma-separated values

## Service Templates

### Service Metadata
```json
{
  "service": {
    "id": "azure-firewall",
    "name": "Azure Firewall",
    "description": "Azure Firewall network and application filtering logs",
    "category": "Network Security",
    "version": "1.0.0",
    "documentation": "https://docs.microsoft.com/en-us/azure/firewall/logs-and-metrics"
  }
}
```

### Table Configuration
```json
{
  "schema": {
    "tables": {
      "primary": "AZFWNetworkRule",
      "secondary": ["AZFWApplicationRule", "AZFWNatRule"],
      "legacy": "AzureDiagnostics"
    }
  }
}
```

### Filter Ordering
```json
{
  "filterOrder": [
    "timeRange",        // Indexed fields first
    "SubscriptionId",   // Resource filtering
    "ResourceGroup",    
    "Action",          // High-selectivity filters
    "SourceIp",        // Specific matches
    "DestinationIp",   
    "Protocol",        // Enum filtering
    "DestinationPort", // Numeric filtering
    "SourcePort",      
    "RuleCollection",  // String filtering
    "RuleName"         // Lower priority fields
  ]
}
```

## Query Templates

### Template Definition
```json
{
  "templates": {
    "basic": {
      "name": "Basic Firewall Query",
      "description": "Simple query for Azure Firewall logs with time range and action filtering",
      "table": "AZFWNetworkRule",
      "defaultParameters": {
        "timeRange": "24h",
        "Action": "Deny",
        "limit": 100
      },
      "requiredFields": ["timeRange"],
      "commonFilters": ["Action", "SourceIp", "DestinationIp"],
      "aggregations": ["count by Action", "count by SourceIp"]
    }
  }
}
```

### Template Properties
- **name**: Display name for template selection
- **description**: Detailed description of template purpose
- **table**: Primary KQL table to query
- **defaultParameters**: Pre-filled parameter values
- **requiredFields**: Fields that must have values
- **commonFilters**: Suggested fields for this template
- **aggregations**: Available aggregation options

## Creating a New Service Template

### Step 1: Define Service Metadata
```json
{
  "service": {
    "id": "application-gateway",
    "name": "Azure Application Gateway",
    "description": "Application Gateway access and performance logs",
    "category": "Web Services",
    "version": "1.0.0",
    "documentation": "https://docs.microsoft.com/en-us/azure/application-gateway/logs"
  }
}
```

### Step 2: Define Tables
```json
{
  "schema": {
    "tables": {
      "primary": "AzureDiagnostics",
      "secondary": ["ApplicationGatewayAccessLog", "ApplicationGatewayPerformanceLog"],
      "legacy": "AzureDiagnostics"
    }
  }
}
```

### Step 3: Define Service-Specific Fields
```json
{
  "schema": {
    "fields": {
      "ClientIP": {
        "type": "ipaddress",
        "required": false,
        "description": "Client IP address",
        "kqlField": "clientIP_s",
        "category": "network",
        "supportsCIDR": true
      },
      "HttpStatus": {
        "type": "select",
        "required": false,
        "description": "HTTP response status code",
        "kqlField": "httpStatus_d",
        "category": "application",
        "options": ["200", "301", "302", "400", "401", "403", "404", "500", "502", "503"]
      }
    }
  }
}
```

### Step 4: Set Filter Order
```json
{
  "filterOrder": [
    "timeRange",
    "SubscriptionId",
    "ResourceGroup",
    "ClientIP",
    "HttpStatus",
    "BackendServer"
  ]
}
```

### Step 5: Create Query Templates
```json
{
  "templates": {
    "performance": {
      "name": "Performance Analysis",
      "description": "Analyze Application Gateway performance metrics",
      "table": "ApplicationGatewayPerformanceLog",
      "defaultParameters": {
        "timeRange": "1h",
        "limit": 500
      },
      "requiredFields": ["timeRange"]
    },
    "errors": {
      "name": "Error Analysis",
      "description": "Investigate HTTP errors and failed requests",
      "table": "ApplicationGatewayAccessLog",
      "defaultParameters": {
        "timeRange": "24h",
        "HttpStatus": "500",
        "limit": 1000
      },
      "requiredFields": ["timeRange", "HttpStatus"]
    }
  }
}
```

### Step 6: Register Template
Add the new template to the template processor:

```javascript
// In templateProcessor.js
const templates = {
  'azure-firewall': azureFirewallTemplate,
  'application-gateway': applicationGatewayTemplate, // Add new template
  'base': baseTemplate
};
```

## Validation Rules

### Field Validation
```json
{
  "HttpMethod": {
    "type": "select",
    "required": false,
    "description": "HTTP method",
    "kqlField": "httpMethod_s",
    "category": "application",
    "options": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"],
    "validation": {
      "allowEmpty": true,
      "customMessage": "Please select a valid HTTP method"
    }
  }
}
```

### Cross-Field Validation
```json
{
  "validation": {
    "rules": [
      {
        "type": "conditional",
        "condition": "HttpStatus >= 400",
        "requires": ["ClientIP"],
        "message": "Client IP is required for error analysis"
      }
    ]
  }
}
```

## Best Practices

### Performance Optimization
1. **Index-First Filtering**: Always put TimeGenerated first in filterOrder
2. **High-Selectivity Early**: Place specific filters before broad filters
3. **Resource Filtering**: Include subscription/resource group early
4. **Limit Results**: Always include reasonable default limits

### User Experience
1. **Clear Descriptions**: Provide helpful field descriptions
2. **Good Defaults**: Set sensible default values
3. **Progressive Disclosure**: Use categories to group related fields
4. **Validation Messages**: Provide clear, actionable error messages

### Maintainability
1. **Consistent Naming**: Follow consistent field naming conventions
2. **Documentation**: Include links to official Azure documentation
3. **Versioning**: Use semantic versioning for template changes
4. **Testing**: Validate templates with real Azure data

## Testing Templates

### Template Validation
```javascript
// Test template structure
const template = loadTemplate('application-gateway');
const validation = validateTemplate(template);
console.log(validation.isValid); // Should be true
```

### Query Generation Testing
```javascript
// Test query generation
const parameters = {
  timeRange: '24h',
  ClientIP: '192.168.1.1',
  HttpStatus: '500'
};

const query = generateKQLQuery(template, parameters, 'errors');
console.log(query);
// Should generate valid KQL
```

### Field Validation Testing
```javascript
// Test field validation
const validation = validateField('ClientIP', '192.168.1.1', template.schema.fields.ClientIP);
console.log(validation.isValid); // Should be true

const invalidValidation = validateField('ClientIP', 'invalid-ip', template.schema.fields.ClientIP);
console.log(invalidValidation.errors); // Should contain error message
```

## Common Patterns

### Time-Based Analysis Template
```json
{
  "time-analysis": {
    "name": "Time-Based Analysis",
    "description": "Analyze patterns over time with aggregation",
    "defaultParameters": {
      "timeRange": "7d",
      "limit": 1000
    },
    "aggregations": [
      "summarize count() by bin(TimeGenerated, 1h)",
      "summarize count() by bin(TimeGenerated, 1d)"
    ]
  }
}
```

### Security Investigation Template
```json
{
  "security": {
    "name": "Security Investigation",
    "description": "Focus on security events and anomalies",
    "defaultParameters": {
      "timeRange": "24h",
      "limit": 500
    },
    "commonFilters": ["SourceIp", "Action", "Protocol"],
    "aggregations": [
      "summarize count() by SourceIp",
      "summarize count() by Action"
    ]
  }
}
```

### Performance Monitoring Template
```json
{
  "performance": {
    "name": "Performance Monitoring",
    "description": "Monitor service performance and availability",
    "defaultParameters": {
      "timeRange": "1h",
      "limit": 1000
    },
    "commonFilters": ["ResponseTime", "StatusCode"],
    "aggregations": [
      "summarize avg(ResponseTime) by bin(TimeGenerated, 5m)",
      "summarize count() by StatusCode"
    ]
  }
}
```

---

*This guide provides comprehensive information for developing and extending templates in the Azure KQL Query Builder. Follow these patterns to ensure consistent, performant, and maintainable template implementations.*
# Azure KQL Query Builder

The Azure KQL Query Builder is a powerful, form-based tool for generating optimized KQL (Kusto Query Language) queries for Azure services. It transforms complex KQL syntax into an intuitive, guided experience that follows performance best practices and Azure monitoring standards.

## Overview

This tool addresses the challenge of writing effective KQL queries for Azure monitoring and log analytics. Instead of requiring deep KQL knowledge, users can build queries through guided forms that automatically optimize filter ordering, validate parameters, and generate production-ready queries.

### Key Features

- **🎯 Form-Based Query Building**: Convert complex KQL syntax into intuitive forms
- **⚡ Performance Optimization**: Automatic filter ordering and query optimization
- **🔧 Multiple Azure Services**: Starting with Azure Firewall, expandable to other services
- **🎨 Professional Syntax Highlighting**: Custom KQL language definition with comprehensive keyword, function, and operator highlighting
- **⭐ Advanced Favorites System**: Complete query favorites management with search, edit, organize, and tag capabilities
- **✅ Enhanced Parameter Validation**: Real-time validation with field-specific error messages and smart UI states
- **📊 Real-Time Preview**: Live KQL generation with professional syntax highlighting
- **🔗 Shareable URLs**: Save and share query configurations
- **📈 Query Templates**: Pre-built templates for common use cases
- **🏷️ Export Options**: Copy, download, or open directly in Azure Portal
- **📚 Query History**: Local storage of recent queries with management
- **🔧 Improved User Experience**: Professional polish with better error handling and visual feedback

## Supported Azure Services

### Azure Firewall ✅
Complete support for Azure Firewall log analysis with Resource Specific logs:

- **Network Rules** (AZFWNetworkRule)
- **Application Rules** (AZFWApplicationRule) 
- **NAT Rules** (AZFWNatRule)
- **Legacy Support** (AzureDiagnostics)

#### Available Templates
- **Basic Query**: Simple filtering with time range and actions
- **Security Investigation**: Analyze denied connections and threats
- **Traffic Analysis**: Study allowed traffic patterns and bandwidth
- **Rule Effectiveness**: Evaluate firewall rule usage and performance
- **Application Rules**: Query application-level filtering logs

### Azure Virtual Desktop ✅
Complete support for Azure Virtual Desktop (AVD) connection and error analysis:

- **Connection Events** (WVDConnections)
- **Error Analysis** (WVDErrors)
- **Session Management** (WVDCheckpoints, WVDManagement)

#### Available Templates
- **IP Addresses Analysis**: Find all IP addresses with geolocation data (30 days)
- **Users and IP Analysis**: Analyze users and their connection locations
- **User Connection Locations**: Track specific user connection patterns
- **Errors from Specific IP**: Investigate errors from particular IP addresses
- **Session Duration Analysis**: Calculate total session times and usage patterns
- **Sessions per Host Pool**: Count distinct users across host pools
- **Recent Completed Sessions**: View recent session details
- **Errors per Host Pool**: Analyze error patterns by host pool

### Coming Soon
- Application Gateway
- Network Security Groups
- Azure Application Insights
- Azure Security Center

## Quick Start

### 1. Access the Tool
Navigate to `/azure-kql` in RussTools or visit the Azure KQL Query Builder from the main tools menu.

### 2. Select Service
Choose your Azure service (Azure Firewall, Azure Virtual Desktop, or Application Gateway) from the service selector.

### 3. Choose Template
Select a pre-configured template that matches your use case:
- **Basic**: General querying with essential filters
- **Security Investigation**: Focus on security events and threats
- **Traffic Analysis**: Analyze traffic patterns and usage

### 4. Configure Parameters

#### Essential Parameters (Always Visible)
- **Time Range**: Select from common ranges (1h, 6h, 24h, 7d, 30d)
- **Action**: Filter by Allow, Deny, or DNAT actions
- **Source IP**: Enter IP addresses or CIDR ranges
- **Destination IP**: Enter IP addresses or CIDR ranges

#### Advanced Parameters (Expandable)
- **Ports**: Source and destination port filtering
- **Protocol**: TCP, UDP, ICMP filtering
- **Rule Information**: Rule collection and rule name filtering
- **Resource Context**: Subscription, resource group filtering

### 5. Generate and Export
- **Preview**: See real-time KQL generation with professional syntax highlighting
- **Copy**: Copy query to clipboard
- **Azure Portal**: Open query directly in Azure Log Analytics
- **Download**: Save as .kql file
- **Share**: Generate shareable URL with configuration
- **Favorites**: Save to favorites with custom names, descriptions, and tags
- **History**: Save to query history for later use

## Architecture

### Template-Driven Design
The tool uses JSON-based templates that define:
- **Service Metadata**: Names, descriptions, documentation links
- **Field Schemas**: Types, validation rules, KQL mappings
- **Query Patterns**: Template structures for different query types
- **Filter Ordering**: Performance-optimized field ordering

### Performance Optimization
Queries are automatically optimized following Azure best practices:

1. **Time Range First**: TimeGenerated filters for indexed performance
2. **Resource Filters**: Subscription and resource group filtering
3. **High-Selectivity**: Specific IP addresses and exact matches
4. **Numeric Filters**: Port and ID filtering
5. **Pattern Matching**: Last for complex string operations

### Progressive Disclosure
The UI follows a three-tier approach:
- **Essential**: Core parameters visible by default
- **Advanced**: Detailed options available via expansion
- **Expert**: Future raw KQL editing capabilities

## Use Cases

### Security Investigation
**Scenario**: Investigate potential security threats and denied connections

**Template**: Security Investigation
**Key Parameters**: 
- Time Range: Last 24 hours
- Action: Deny
- Source IP: Specific suspicious IPs

**Generated Query**:
```kql
AZFWNetworkRule
| where TimeGenerated >= ago(24h) and Action == "Deny"
| where SourceIp == "192.168.1.100"
| order by TimeGenerated desc
| limit 500
```

### Traffic Analysis
**Scenario**: Analyze allowed traffic patterns for capacity planning

**Template**: Traffic Analysis
**Key Parameters**:
- Time Range: Last 7 days
- Action: Allow
- Protocol: TCP

**Generated Query**:
```kql
AZFWNetworkRule
| where TimeGenerated >= ago(7d) and Action == "Allow"
| where Protocol == "TCP"
| order by TimeGenerated desc
| limit 1000
```

### Rule Effectiveness
**Scenario**: Evaluate firewall rule usage and optimization opportunities

**Template**: Rule Effectiveness
**Key Parameters**:
- Time Range: Last 7 days
- Rule Collection: Specific collection name

**Generated Query**:
```kql
AZFWNetworkRule
| where TimeGenerated >= ago(7d)
| where RuleCollection == "ProductionRules"
| summarize HitCount = count() by Rule
| order by HitCount desc
```

### Azure Virtual Desktop Use Cases

#### User Connection Analysis
**Scenario**: Track user connection patterns and geographic distribution

**Template**: Users and IP Analysis
**Key Parameters**:
- Time Range: Last 30 days
- User Name: Specific user or all users

**Generated Query**:
```kql
let daysAgo = 30d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| summarize NumberOfConnections = count() by UserName, ClientIPAddress
| order by NumberOfConnections desc
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress))
| extend
    Country = tostring(ip_location.country),
    State = tostring(ip_location.state),
    City = tostring(ip_location.city)
| project UserName, ClientIPAddress, NumberOfConnections, Country, State, City
```

#### Session Duration Analysis
**Scenario**: Analyze user session patterns for capacity planning and usage optimization

**Template**: Session Duration Analysis
**Key Parameters**:
- Time Range: Last 31 days
- Connection Type: Desktop or RemoteApp

**Generated Query**:
```kql
let daysAgo = 31d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| where State == "Connected"
| project CorrelationId, UserName, ConnectionType, StartTime=TimeGenerated
| join (WVDConnections
    | where State == "Completed"
    | project EndTime=TimeGenerated, CorrelationId)
    on CorrelationId
| extend SessionDuration = EndTime - StartTime
| summarize TotalDuration = sum(SessionDuration) by UserName, ConnectionType
| extend 
    DurationHours = round(TotalDuration / 1h, 2),
    DurationDays = round(TotalDuration / 1d, 2)
| project UserName, ConnectionType, DurationHours, DurationDays
| sort by DurationHours desc
```

#### Security Investigation - IP Analysis
**Scenario**: Investigate potential security issues from specific IP addresses

**Template**: Errors from Specific IP
**Key Parameters**:
- Time Range: Last 30 days
- Client Side IP Address: Suspicious IP address

**Generated Query**:
```kql
let ipAddress = "192.168.1.100";
let daysAgo = 30d;
let users =
    WVDConnections
    | where TimeGenerated > ago(daysAgo)
    | where ClientSideIPAddress contains ipAddress
    | summarize by UserName;
WVDErrors
| where TimeGenerated > ago(daysAgo)
| where UserName in (users)
| summarize ErrorCount = count() by UserName, CodeSymbolic
| order by ErrorCount desc
```

## Advanced Features

### Favorites System
- **Save Queries**: Save favorite queries with custom names and descriptions
- **Organization**: Tag and categorize queries for easy organization
- **Search**: Full-text search across favorite names, descriptions, and tags
- **Edit**: Modify favorite query names, descriptions, tags, and parameters
- **Management**: Delete, duplicate, and organize favorite queries
- **Metadata**: Track creation date, last modified, and usage statistics

### Query History
- **Automatic Saving**: Queries saved to local storage
- **Management**: View, reload, and delete saved queries
- **Metadata**: Track service, template, and parameters
- **Limit**: Last 50 queries maintained automatically

### Shareable URLs
Generate URLs that encode complete query configurations:
```
/azure-kql?config=eyJzZXJ2aWNlIjoiYXp1cmUtZmlyZXdhbGwiLCJ0ZW1wbGF0ZSI6ImJhc2ljIiwicGFyYW1ldGVycyI6eyJ0aW1lUmFuZ2UiOiIyNGgiLCJBY3Rpb24iOiJEZW55In19
```

### Azure Portal Integration
Direct deep-linking to Azure Log Analytics:
- Automatically opens with generated query
- Pre-configured for immediate execution
- Maintains query context and formatting

## Field Reference

### Time Fields
- **timeRange**: User-friendly time range selection (1h, 6h, 24h, 7d, 30d)
- Generates: `TimeGenerated >= ago({range})`

### Network Fields
- **SourceIp / DestinationIp**: IPv4 addresses with CIDR support
  - Examples: `192.168.1.1`, `10.0.0.0/8`
  - Generates: `SourceIp == "192.168.1.1"` or `ipv4_is_in_range(SourceIp, "10.0.0.0/8")`

- **SourcePort / DestinationPort**: Port numbers (1-65535)
  - Generates: `DestinationPort == 443`

- **Protocol**: Network protocols
  - Options: TCP, UDP, ICMP, Any
  - Generates: `Protocol == "TCP"`

### Action Fields
- **Action**: Firewall action taken
  - Options: Allow, Deny, DNAT
  - Generates: `Action == "Allow"`

### Rule Fields
- **RuleCollection**: Name of the rule collection
  - Generates: `RuleCollection == "ProductionRules"`

- **RuleName**: Specific rule name
  - Generates: `Rule == "AllowHTTPS"`

### Resource Fields
- **SubscriptionId**: Azure subscription identifier
- **ResourceGroup**: Resource group name
- **ResourceId**: Full Azure resource path

### Azure Virtual Desktop Fields
- **UserName**: User Principal Name (UPN) of connecting user
  - Examples: `user@domain.com`, `john.doe@company.com`
  - Generates: `UserName == "user@domain.com"` or `UserName contains "john"`

- **ClientIPAddress / ClientSideIPAddress**: Client IP with CIDR support
  - Examples: `192.168.1.1`, `10.0.0.0/8`
  - Generates: `ClientIPAddress == "192.168.1.1"` or `ipv4_is_in_range(ClientIPAddress, "10.0.0.0/8")`

- **State**: Connection state
  - Options: Connected, Completed, Failed, Started
  - Generates: `State == "Connected"`

- **ConnectionType**: Type of connection
  - Options: RemoteApp, Desktop
  - Generates: `ConnectionType == "Desktop"`

- **ClientOS**: Client operating system
  - Examples: Windows 10, Windows 11, macOS, iOS, Android
  - Generates: `ClientOS == "Windows 10"`

- **ClientType**: Client application type
  - Examples: Desktop, Web, Mobile
  - Generates: `ClientType == "Desktop"`

- **CodeSymbolic**: Error codes for WVDErrors
  - Examples: ConnectionFailedClientDisconnect, ConnectionFailedTimeout
  - Generates: `CodeSymbolic == "ConnectionFailedTimeout"`

- **CorrelationId**: ID for matching connection events
  - Generates: `CorrelationId == "12345678-1234-5678-9012-123456789012"`

### Query Control Fields
- **limit**: Maximum results (1-10000, default: 100)
- **sortField**: Field to sort by (default: TimeGenerated)
- **sortOrder**: Sort direction (asc/desc, default: desc)

## Enhanced Validation System

### Field-Level Validation
- **Real-time Validation**: Parameter validation as you type with immediate feedback
- **IP Addresses**: IPv4 format validation with CIDR support
- **Ports**: Range validation (1-65535) with clear error messages
- **Time Ranges**: Format validation for relative ranges
- **Required Fields**: Enforcement of essential parameters with visual indicators

### Smart UI States
- **Dynamic Button States**: Generate button updates based on validation status
- **Field-Specific Errors**: Individual field error messages with specific guidance
- **Visual Indicators**: Color-coded validation states and warning icons
- **Progress Feedback**: Clear indication of validation progress

### Query Validation
- **Performance Warnings**: Large time ranges, missing limits with optimization suggestions
- **Syntax Checking**: KQL structure validation before generation
- **Optimization Suggestions**: Filter ordering recommendations for better performance

### Enhanced Error Handling
- **Contextual Messages**: Error messages specific to each field type and validation rule
- **Recovery Guidance**: Step-by-step instructions for fixing validation issues
- **Warning vs Error**: Clear distinction between blocking errors and performance suggestions
- **Batch Validation**: Summary of all validation issues with priority indication

## Browser Support

### Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Local Storage**: Required for query history and preferences
- **JavaScript**: ES6+ support required

### Privacy
- **No External APIs**: Query generation entirely client-side
- **Local Storage Only**: No server-side data storage
- **Optional Sharing**: URL sharing is opt-in only

## Performance Considerations

### Query Optimization
- **Automatic Ordering**: Filters ordered for optimal performance
- **Index Utilization**: TimeGenerated filters prioritized
- **Result Limiting**: Default and maximum limits enforced

### Client Performance
- **Lazy Loading**: Templates loaded on demand
- **Debounced Updates**: Real-time preview with performance optimization
- **Efficient Rendering**: Minimal re-renders on parameter changes

## Troubleshooting

### Common Issues

#### "Unknown parameter" warnings
**Cause**: Parameter name mismatch between form and template
**Solution**: Refresh page or report as bug

#### Query not generating
**Cause**: Required fields missing or validation errors
**Solution**: Check validation messages and fill required fields

#### Azure Portal link not working
**Cause**: Query too long or special characters
**Solution**: Simplify query or use copy/paste method

#### History not saving
**Cause**: Browser local storage disabled or full
**Solution**: Enable local storage or clear browser data

### Getting Help
- **Documentation**: Check field reference and use cases
- **Examples**: Use provided query templates as starting points
- **Favorites**: Browse and learn from saved favorite queries
- **Validation Messages**: Follow field-specific guidance for parameter corrections
- **Community**: Report issues via GitHub repository

## Contributing

### Template Development
Templates are defined in JSON format with:
- Service metadata and configuration
- Field schemas with validation rules
- Query patterns and default parameters
- Filter ordering for performance

### Feature Requests
- Enhanced service support
- Additional query templates
- UI/UX improvements
- Performance optimizations

## Security

### Data Handling
- **Client-Side Processing**: No data sent to external servers
- **Local Storage**: Query history stored locally only
- **No Tracking**: No analytics or user tracking
- **Safe Parameters**: Input sanitization and validation

### Query Safety
- **Parameter Validation**: Prevents KQL injection
- **Type Checking**: Ensures parameter type safety
- **Performance Limits**: Prevents resource-intensive queries

---

*This tool is part of RussTools, a comprehensive suite of developer and IT tools. For more information, visit the main RussTools documentation.*
# Azure Resource Naming Tool

## Overview

The Azure Resource Naming Tool is a comprehensive solution for generating consistent, compliant, and standardized Azure resource names following Microsoft's best practices and organizational conventions. It helps ensure naming consistency across Azure deployments while maintaining readability and compliance with Azure naming rules.

## Purpose

This tool addresses critical challenges in Azure resource management:
- **Naming Consistency**: Ensures uniform naming conventions across teams and projects
- **Compliance**: Validates names against Azure resource-specific requirements
- **Automation**: Generates multiple resource names following the same pattern
- **Best Practices**: Implements Microsoft's recommended naming conventions
- **Team Collaboration**: Standardizes naming across development teams

## Key Features

### 1. Intelligent Resource Type Selection
- **Comprehensive Coverage**: Supports 100+ Azure resource types
- **Category Organization**: Resources grouped by service (Compute, Storage, Networking, etc.)
- **Real-time Validation**: Instant feedback on naming compliance
- **Resource-Specific Rules**: Different validation rules per resource type

### 2. Flexible Naming Components
- **Required Fields**: Core components like environment, region, workload
- **Optional Fields**: Additional components like instance numbers, project codes
- **Custom Values**: Support for organization-specific naming elements
- **Dynamic Validation**: Real-time checking of naming rules

### 3. Advanced Validation System
- **Character Limits**: Enforces Azure-specific length restrictions
- **Character Sets**: Validates allowed characters per resource type
- **Uniqueness**: Helps ensure globally unique names where required
- **Pattern Matching**: Validates against defined naming patterns

### 4. Bulk Generation
- **Multiple Resources**: Generate names for multiple resource types simultaneously
- **Batch Processing**: Create consistent naming for entire deployments
- **Export Functionality**: Download generated names for documentation
- **History Tracking**: Maintain records of previously generated names

### 5. Organizational Integration
- **Custom Environments**: Define organization-specific environments
- **Region Mapping**: Support for all Azure regions with abbreviations
- **Template System**: Save and reuse naming templates
- **Team Sharing**: Export configurations for team use

## Usage Instructions

### Getting Started

1. **Access the Tool**
   - Navigate to the Azure Resource Naming Tool
   - Select "Name Builder" tab to begin

2. **Select Resource Types**
   - Browse or search for Azure resource types
   - Select one or more resources to name
   - View resource-specific naming requirements

3. **Configure Required Components**
   - **Environment**: Production, Development, Staging, etc.
   - **Region**: Azure region (automatically abbreviated)
   - **Workload**: Application or workload identifier
   - **Instance**: Instance number if multiple resources

4. **Set Optional Components**
   - **Project Code**: Organization-specific project identifier
   - **Owner**: Team or individual responsible for resource
   - **Cost Center**: For billing and cost tracking
   - **Custom Tags**: Additional organizational identifiers

5. **Generate Names**
   - Click "Generate Azure Resource Names"
   - Review generated names in the results tab
   - Copy individual names or export all results

### Advanced Features

#### Custom Naming Patterns
- Define organization-specific patterns
- Save templates for reuse
- Share configurations across teams
- Version control naming standards

#### Validation Rules
- Real-time validation feedback
- Detailed error explanations
- Suggestions for resolution
- Resource-specific guidance

#### Bulk Operations
- Generate names for entire deployments
- Consistent naming across related resources
- Export results in multiple formats
- Integration with infrastructure-as-code

## Technical Implementation

### Architecture

```
AzureNamingTool (Main Component)
├── ResourceTypeSelector - Resource selection interface
├── NamingForm - Input form components
├── ValidationIndicator - Real-time validation display
├── ResultsDisplay - Generated names presentation
├── NamingHistory - Previously generated names
└── AzureNamingContext - State management
```

### Component Breakdown

#### Core Components
- **AzureNamingTool.jsx**: Main container component
- **ResourceTypeSelector.jsx**: Multi-select resource type picker
- **NamingForm.jsx**: Input form with validation
- **ResultsDisplay.jsx**: Generated names presentation
- **ValidationIndicator.jsx**: Real-time validation feedback

#### Supporting Components
- **HelpTooltip.jsx**: Contextual help system
- **NamingHistory.jsx**: Historical name tracking

#### Context and Hooks
- **AzureNamingContext.jsx**: Global state management
- **useAzureNaming.js**: Custom hook for naming logic

### Data Sources

#### Resource Definitions
```javascript
// Resource definition structure
{
  "resourceType": "Virtual Machine",
  "prefix": "vm",
  "minLength": 1,
  "maxLength": 15,
  "validCharacters": "alphanumeric",
  "uniqueScope": "resource-group",
  "examples": ["vm-prod-web-001"]
}
```

#### Environment Configuration
```javascript
// Environment options
{
  "environments": [
    { "name": "Production", "abbreviation": "prod" },
    { "name": "Development", "abbreviation": "dev" },
    { "name": "Staging", "abbreviation": "stg" }
  ]
}
```

#### Region Mapping
```javascript
// Azure region abbreviations
{
  "eastus": "eus",
  "westus2": "wus2",
  "centralus": "cus",
  "eastus2": "eus2"
}
```

### Validation Engine

#### Rule Types
1. **Length Validation**: Ensures names meet Azure length requirements
2. **Character Validation**: Validates allowed characters per resource type
3. **Pattern Validation**: Checks against naming pattern requirements
4. **Uniqueness Validation**: Helps ensure globally unique names
5. **Scope Validation**: Validates uniqueness within appropriate scope

#### Validation Process
```javascript
// Validation workflow
1. Check resource type requirements
2. Validate each naming component
3. Combine components using pattern
4. Check final name against all rules
5. Provide specific feedback for violations
```

## API Integration

### Internal APIs
- **Resource Definition Service**: Loads Azure resource metadata
- **Validation Service**: Real-time name validation
- **Generation Service**: Name composition and formatting
- **History Service**: Persistent storage of generated names

### Data Sources
- **Azure Resource Definitions**: Official Microsoft naming requirements
- **Region Data**: Azure region codes and abbreviations
- **Environment Templates**: Common environment configurations

### External Dependencies
```json
{
  "@mantine/core": "UI components",
  "@mantine/hooks": "React hooks utilities",
  "react": "Core React framework"
}
```

## Data Storage and Privacy

### Local Storage
- **Generated Names**: Stored locally for history tracking
- **User Preferences**: Saved naming templates and defaults
- **Validation Cache**: Cached validation results for performance

### Storage Keys
```javascript
// Local storage keys
{
  "azure-naming-history": "Generated name history",
  "azure-naming-templates": "Saved naming templates",
  "azure-naming-preferences": "User preferences"
}
```

### Privacy Considerations
- **Client-Side Only**: All processing happens in browser
- **No Data Transmission**: Names never sent to external servers
- **Local Storage**: Data persists only in user's browser
- **No Analytics**: No tracking of generated names or patterns

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Resource definitions loaded on demand
- **Memoization**: Validation results cached
- **Debounced Validation**: Prevents excessive validation calls
- **Virtual Scrolling**: Efficient handling of large resource lists

### Scalability
- **Resource Types**: Supports 100+ Azure resource types
- **Concurrent Generation**: Multiple resources processed simultaneously
- **Memory Management**: Efficient state management
- **Browser Compatibility**: Works across modern browsers

## Best Practices

### Naming Convention Design
1. **Consistency**: Use the same pattern across all resources
2. **Readability**: Names should be human-readable
3. **Automation**: Design patterns that work with automation tools
4. **Compliance**: Follow Azure naming requirements strictly

### Tool Usage
1. **Template Creation**: Save commonly used patterns
2. **Validation**: Always validate before deployment
3. **Documentation**: Document naming conventions for teams
4. **Regular Updates**: Keep resource definitions current

### Organizational Implementation
1. **Standards Definition**: Establish organization-wide standards
2. **Training**: Ensure teams understand naming conventions
3. **Automation Integration**: Integrate with CI/CD pipelines
4. **Compliance Monitoring**: Regular audits of existing resources

## Supported Azure Resources

### Compute
- Virtual Machines (vm)
- Virtual Machine Scale Sets (vmss)
- App Services (app)
- Function Apps (func)
- Container Instances (aci)
- Kubernetes Service (aks)

### Storage
- Storage Accounts (st)
- Blob Containers (blob)
- File Shares (file)
- Table Storage (table)
- Queue Storage (queue)

### Networking
- Virtual Networks (vnet)
- Subnets (snet)
- Network Security Groups (nsg)
- Route Tables (rt)
- Public IP Addresses (pip)
- Load Balancers (lb)

### Databases
- SQL Databases (sqldb)
- SQL Servers (sql)
- Cosmos DB (cosmos)
- Redis Cache (redis)
- MySQL (mysql)
- PostgreSQL (psql)

### Analytics
- Data Factory (adf)
- Synapse Workspace (syn)
- Stream Analytics (asa)
- Event Hubs (evh)
- IoT Hubs (iot)

## Examples

### Web Application Deployment
```
Resource Type: Virtual Machine
Environment: Production
Region: East US
Workload: WebApp
Instance: 001
Generated: vm-prod-eus-webapp-001

Resource Type: App Service
Environment: Production
Region: East US
Workload: WebApp
Generated: app-prod-eus-webapp
```

### Database Tier
```
Resource Type: SQL Server
Environment: Production
Region: West US 2
Workload: Database
Generated: sql-prod-wus2-database

Resource Type: SQL Database
Environment: Production
Region: West US 2
Workload: CustomerDB
Generated: sqldb-prod-wus2-customerdb
```

## Troubleshooting

### Common Issues

1. **Name Too Long**
   - Reduce component lengths
   - Use abbreviations where appropriate
   - Consider shorter workload names

2. **Invalid Characters**
   - Check resource-specific character requirements
   - Remove special characters not allowed
   - Use alphanumeric characters only

3. **Generation Failures**
   - Verify all required fields are filled
   - Check validation errors
   - Ensure resource types are selected

### Validation Errors
- **Clear Descriptions**: Specific error messages
- **Resolution Guidance**: How to fix issues
- **Resource-Specific Help**: Context-aware assistance

## Integration Examples

### Terraform Integration
```hcl
# Example Terraform usage
resource "azurerm_virtual_machine" "example" {
  name                = "vm-prod-eus-webapp-001"
  location            = "East US"
  resource_group_name = "rg-prod-eus-webapp"
  # ... other configuration
}
```

### PowerShell Integration
```powershell
# Example PowerShell usage
$vmName = "vm-prod-eus-webapp-001"
New-AzVM -Name $vmName -ResourceGroupName "rg-prod-eus-webapp"
```

### Azure CLI Integration
```bash
# Example Azure CLI usage
az vm create \
  --name "vm-prod-eus-webapp-001" \
  --resource-group "rg-prod-eus-webapp"
```

## Contributing

### Development
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

### Resource Definition Updates
1. Update resource definition files
2. Add new Azure resource types
3. Update validation rules
4. Test thoroughly before submission

For detailed technical information, see the [Architecture Documentation](../../ARCHITECTURE.md).
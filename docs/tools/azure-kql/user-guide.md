# Azure KQL Query Builder - User Guide

This comprehensive guide walks you through using the Azure KQL Query Builder to create optimized KQL queries for Azure monitoring and log analytics without requiring deep KQL knowledge.

## Getting Started

### Accessing the Tool
1. Navigate to [RussTools](/) 
2. Find "Azure KQL Query Builder" in the tools grid
3. Click to access the tool at `/azure-kql`

### Tool Interface Overview
The tool is organized into two main tabs:
- **Query Builder**: Create and customize queries
- **Query History**: View and manage saved queries

## Building Your First Query

### Step 1: Select Azure Service
Start by choosing the Azure service you want to query:
- **Azure Firewall**: Network and application filtering logs
- More services coming soon (Application Gateway, NSG, etc.)

### Step 2: Choose a Template
Select a pre-configured template that matches your use case:

**Basic Query**
- Simple filtering with time range and actions
- Best for general exploration and basic monitoring

**Security Investigation**
- Focus on denied connections and security events
- Ideal for threat analysis and incident response

**Traffic Analysis**
- Analyze allowed traffic patterns and bandwidth usage
- Perfect for capacity planning and network optimization

**Rule Effectiveness**
- Evaluate firewall rule usage and performance
- Helps optimize rule sets and identify unused rules

### Step 3: Configure Parameters

#### Essential Parameters (Always Visible)
These core parameters are visible by default:

**Time Range**
- Select from common time ranges:
  - Last 1 hour
  - Last 6 hours
  - Last 24 hours (most common)
  - Last 7 days
  - Last 30 days

**Action** (Azure Firewall)
- **Allow**: Permitted connections
- **Deny**: Blocked connections (most useful for security)
- **DNAT**: Network address translation rules

**Source IP**
- Enter specific IP addresses: `192.168.1.100`
- Use CIDR notation for ranges: `10.0.0.0/8`
- Leave empty to include all source IPs

**Destination IP**
- Enter specific destination IPs: `8.8.8.8`
- Use CIDR notation: `172.16.0.0/12`
- Leave empty to include all destinations

#### Advanced Parameters (Expandable)
Click "Advanced Parameters" to access additional filtering:

**Source Port / Destination Port**
- Enter specific port numbers (1-65535)
- Common ports are suggested: 22, 80, 443, etc.

**Protocol**
- **TCP**: Most web and application traffic
- **UDP**: DNS, DHCP, and other protocols
- **ICMP**: Ping and network diagnostics
- **Any**: All protocols

**Rule Collection**
- Enter the name of specific firewall rule collections
- Useful for analyzing specific rule sets

**Rule Name**
- Enter specific rule names
- Helps track individual rule effectiveness

**Resource Filters**
- **Subscription ID**: Filter by Azure subscription
- **Resource Group**: Filter by resource group
- **Resource ID**: Filter by specific Azure resource

### Step 4: Generate and Preview
Click "Generate KQL Query" to create your query. The preview shows:
- **Generated KQL**: The complete query ready for execution
- **Performance Indicators**: Badges showing optimization status
- **Query Analysis**: Line count and feature detection

## Understanding Query Results

### Query Structure
Generated queries follow this optimized structure:
```kql
AZFWNetworkRule                    -- Table selection
| where TimeGenerated >= ago(24h)  -- Time filtering (indexed)
| where Action == "Deny"           -- High-selectivity filters
| where SourceIp == "192.168.1.1"  -- Specific IP filtering
| order by TimeGenerated desc      -- Result ordering
| limit 100                        -- Result limiting
```

### Performance Optimization
The tool automatically optimizes queries by:
1. **Time filters first**: Uses indexed TimeGenerated field
2. **High-selectivity filters**: Specific values before broad filters
3. **Resource filtering**: Subscription/resource group early
4. **Result limiting**: Prevents excessive data retrieval

## Export and Sharing Options

### Copy Query
Click "Copy Query" to copy the generated KQL to your clipboard for pasting into:
- Azure Portal Log Analytics
- Azure Monitor Workbooks
- PowerShell scripts
- Documentation

### Open in Azure Portal
Click "Open in Azure" to launch the Azure Portal with your query pre-loaded in Log Analytics. This:
- Opens a new browser tab
- Navigates to Azure Log Analytics
- Pre-populates your generated query
- Ready for immediate execution

### Share URL
Click "Share URL" to generate a shareable link that includes your complete configuration:
- Service selection
- Template choice
- All parameter values
- Anyone with the link can access the same configuration

### Download Query File
Click "Download .kql" to save your query as a file:
- Saves with `.kql` extension
- Includes timestamp in filename
- Ready for version control or documentation

### Save to History
Click "Save to History" to store your query locally:
- Persists in browser local storage
- Includes all parameters and metadata
- Accessible via "Query History" tab

### Share Configuration
Click "Share Configuration" to create a shareable link:
- **Compressed URL**: Uses gzip compression for shorter URLs
- **Complete State**: Preserves all parameters and selections
- **Cross-Platform**: Works across different devices and browsers
- **No Data Loss**: Includes complex parameters like UserName, IP addresses, etc.
- **Privacy-Safe**: All processing happens client-side only

**How Sharing Works:**
1. Configure your query parameters
2. Click "Share Configuration" button  
3. Shareable link automatically copied to clipboard
4. Share the link with colleagues or save for later
5. Opening the link restores exact configuration

**Example Shared URL:**
```
https://russ.tools/azure-kql?config=eJwVjUEKwzAMBP-icx1c2lNOeUEOhT5A...
```

**Benefits:**
- **Collaboration**: Share complex queries with team members
- **Documentation**: Include shareable links in runbooks
- **Troubleshooting**: Easily reproduce exact query conditions
- **Training**: Share example configurations for learning

## Managing Query History

### Viewing Saved Queries
Switch to the "Query History" tab to see:
- **Query List**: All saved queries with timestamps
- **Service/Template**: Which service and template were used
- **Parameters**: Key parameter values used
- **Preview**: Truncated query preview

### Loading Previous Queries
Click "Load Query" on any history item to:
- Restore all parameter values
- Switch to the original service/template
- Regenerate the query automatically
- Return to Query Builder tab

### Managing History
- **Delete Individual**: Remove specific queries from history
- **Clear All**: Remove all saved queries
- **Automatic Cleanup**: Only last 50 queries are kept
- **Local Storage**: History is stored locally, not on servers

## Common Use Cases

### Security Investigation Workflow

**Scenario**: Investigate suspicious network activity

1. **Select Template**: Security Investigation
2. **Set Time Range**: Last 24 hours
3. **Configure Action**: Deny (to see blocked attempts)
4. **Add Source IP**: Specific suspicious IP if known
5. **Generate Query**: Review denied connections
6. **Export**: Copy to Azure Portal for deeper analysis

**Example Query**:
```kql
AZFWNetworkRule
| where TimeGenerated >= ago(24h) and Action == "Deny"
| where SourceIp == "203.0.113.100"
| order by TimeGenerated desc
| limit 500
```

### Traffic Pattern Analysis

**Scenario**: Analyze network usage for capacity planning

1. **Select Template**: Traffic Analysis
2. **Set Time Range**: Last 7 days
3. **Configure Action**: Allow (to see permitted traffic)
4. **Add Protocol**: TCP (for web traffic)
5. **Set Higher Limit**: 1000 results
6. **Generate Query**: Review traffic patterns

**Example Query**:
```kql
AZFWNetworkRule
| where TimeGenerated >= ago(7d) and Action == "Allow"
| where Protocol == "TCP"
| order by TimeGenerated desc
| limit 1000
```

### Rule Optimization

**Scenario**: Identify unused or ineffective firewall rules

1. **Select Template**: Rule Effectiveness
2. **Set Time Range**: Last 7 days
3. **Add Rule Collection**: Specific collection to analyze
4. **Generate Query**: See rule usage statistics
5. **Export**: Save for compliance reporting

**Example Query**:
```kql
AZFWNetworkRule
| where TimeGenerated >= ago(7d)
| where RuleCollection == "ProductionRules"
| summarize HitCount = count() by Rule
| order by HitCount desc
```

## Advanced Features

### Parameter Validation
The tool provides real-time validation:
- **IP Address Format**: Validates IPv4 and CIDR notation
- **Port Ranges**: Ensures ports are between 1-65535
- **Time Ranges**: Validates time format and reasonable limits
- **Required Fields**: Highlights missing essential parameters

### Performance Warnings
Watch for performance indicators:
- **Time Range Warning**: Very large time ranges may be slow
- **Missing Limits**: Queries without limits may return too much data
- **Filter Optimization**: Suggestions for better performance

### URL Sharing Details
Shareable URLs encode configuration as base64:
```
/azure-kql?config=eyJzZXJ2aWNlIjoiYXp1cmUtZmlyZXdhbGwiLCJ0ZW1wbGF0ZSI6ImJhc2ljIiwicGFyYW1ldGVycyI6eyJ0aW1lUmFuZ2UiOiIyNGgiLCJBY3Rpb24iOiJEZW55In19
```

This allows:
- Bookmarking specific configurations
- Sharing with team members
- Including in documentation
- Creating standard query templates

## Troubleshooting

### Common Issues

#### Query Not Generating
**Symptoms**: Generate button disabled or no query appears
**Solutions**:
- Check for validation errors (red text)
- Ensure required fields are filled
- Verify time range is selected
- Try refreshing the page

#### "Unknown Parameter" Warnings
**Symptoms**: Yellow warning about unknown parameters
**Solutions**:
- This is typically a temporary issue
- Refresh the page to reload templates
- Clear browser cache if persistent
- Report as bug if continues

#### Azure Portal Link Not Working
**Symptoms**: Link doesn't open or shows error
**Solutions**:
- Ensure you're logged into Azure Portal
- Check query length (very long queries may fail)
- Try copying query manually instead
- Verify Azure subscription access

#### History Not Saving
**Symptoms**: Saved queries don't appear in history
**Solutions**:
- Check browser local storage is enabled
- Clear browser data if storage is full
- Disable privacy/incognito mode
- Ensure JavaScript is enabled

### Performance Issues

#### Slow Query Generation
**Solutions**:
- Reduce time range (try shorter periods)
- Add more specific filters
- Use smaller result limits
- Avoid very broad searches

#### Large Result Sets
**Solutions**:
- Increase result limit gradually
- Use aggregation queries instead
- Filter by specific resources
- Break large queries into smaller ones

### Getting Help

#### Built-in Help
- Field descriptions explain each parameter
- Validation messages provide specific guidance
- Performance warnings suggest optimizations
- Template descriptions explain use cases

#### External Resources
- [Azure KQL Documentation](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [Azure Firewall Logs Reference](https://docs.microsoft.com/en-us/azure/firewall/logs-and-metrics)
- [Log Analytics Query Examples](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/examples)

## Tips and Best Practices

### Query Performance
1. **Start Small**: Use shorter time ranges when exploring
2. **Filter Early**: Add specific filters before broadening search
3. **Use Limits**: Always include reasonable result limits
4. **Time First**: Time range filtering is most efficient

### Security Analysis
1. **Focus on Denies**: Start with denied connections for security
2. **Source Analysis**: Group by source IPs to identify patterns
3. **Time Correlation**: Look for time-based attack patterns
4. **Rule Mapping**: Correlate with rule names for context

### Operational Monitoring
1. **Regular Intervals**: Use consistent time ranges for trending
2. **Allow Analysis**: Monitor permitted traffic for capacity
3. **Rule Effectiveness**: Regular review of rule usage
4. **Performance Baselines**: Establish normal traffic patterns

### Documentation
1. **Save Important Queries**: Use history for frequently used queries
2. **Share Templates**: Use shareable URLs for team standards
3. **Document Findings**: Export queries for incident reports
4. **Version Control**: Save .kql files for audit trails

---

*This user guide provides comprehensive coverage of the Azure KQL Query Builder functionality. For technical details about templates and architecture, see the additional documentation files.*
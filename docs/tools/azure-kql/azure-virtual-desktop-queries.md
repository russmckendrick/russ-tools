# Azure Virtual Desktop KQL Queries

This document provides a comprehensive collection of KQL queries for Azure Virtual Desktop (AVD) monitoring, troubleshooting, and analysis. These queries are designed to help administrators gain insights into user connections, session patterns, geographic distribution, and error analysis.

## Overview

Azure Virtual Desktop generates rich telemetry data through several log tables:

- **WVDConnections**: Connection events and session information
- **WVDErrors**: Error events and troubleshooting data
- **WVDCheckpoints**: Session state transitions
- **WVDManagement**: Management operations and configuration changes

## Connection Analysis Queries

### Find All IP Addresses (Last 30 Days)

Analyzes connections over the past 30 days, counting connections by username and client IP address, then enriches the data with geolocation information.

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
| project ClientIPAddress, NumberOfConnections, Country, State, City
```

**Use Case**: Geographic distribution analysis, security monitoring, capacity planning.

### Users and Their IP Addresses (Last 30 Days)

Similar to the previous query but includes user information, providing a comprehensive view of user connection patterns and geographical distribution.

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

**Use Case**: User behavior analysis, compliance reporting, security auditing.

### Specific User Connection Locations

Focuses on connection patterns for a specific user, allowing for targeted analysis of individual user behavior.

```kql
let userSearch = "<replace with the UPN of a user>";
let daysAgo = 30d;
WVDConnections
| where TimeGenerated > ago(daysAgo)
| where UserName contains userSearch
| summarize NumberOfConnections = count() by ClientIPAddress
| order by NumberOfConnections desc
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress))
| extend
    Country = tostring(ip_location.country),
    State = tostring(ip_location.state),
    City = tostring(ip_location.city)
| project ClientIPAddress, NumberOfConnections, Country, State, City
```

**Use Case**: Individual user investigation, travel pattern analysis, security incident response.

## Error Analysis Queries

### Errors from Specific IP Address

Identifies users connected from a specified IP address and analyzes their error patterns, useful for troubleshooting location-specific issues.

```kql
let ipAddress = "<replace with the IP address you are interested in>";
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

**Use Case**: Location-specific troubleshooting, network issue diagnosis, user support.

### Errors per Host Pool

Analyzes error patterns across different host pools to identify problematic environments or configurations.

```kql
let daysAgo = 1d;
WVDErrors
| where TimeGenerated > ago(daysAgo) 
| project _ResourceId, CodeSymbolic
| project-rename Hostpool = _ResourceId
| extend HostPool=toupper(strcat(split(Hostpool, "/")[4], ".", split(Hostpool, "/")[8]))
| summarize Count=count() by CodeSymbolic, HostPool
```

**Use Case**: Infrastructure health monitoring, capacity planning, error pattern analysis.

## Session Analysis Queries

### Total Session Time Analysis

Calculates total session durations by matching Connected and Completed events, providing insights into user engagement and system usage.

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

**Use Case**: Usage analytics, capacity planning, license optimization, user behavior analysis.

### Sessions per Host Pool

Counts distinct users per host pool to understand user distribution and host pool utilization.

```kql
let daysAgo = 31d;
WVDConnections 
| where TimeGenerated > ago(daysAgo)
| where State == "Connected" 
| project _ResourceId, UserName 
| project-rename Hostpool = _ResourceId 
| summarize DistinctUsers= dcount(UserName) by Hostpool 
| extend HostPool=toupper(strcat(split(Hostpool, "/")[4], ".", split(Hostpool, "/")[8])) 
| project HostPool, DistinctUsers
```

**Use Case**: Resource utilization analysis, load balancing assessment, capacity planning.

### Recent Completed Sessions

Provides a detailed view of recent completed sessions with client and host pool information.

```kql
let daysAgo = 1d;
WVDConnections
| where TimeGenerated > ago(daysAgo) and State contains "Completed"
| project-rename Hostpool = _ResourceId
| extend HostPool=toupper(strcat(split(Hostpool, "/")[4], ".", split(Hostpool, "/")[8]))
| project TimeGenerated, UserName, ClientOS, ClientType, ConnectionType, HostPool
```

**Use Case**: Recent activity monitoring, client platform analysis, session tracking.

## Advanced Analysis Queries

### Top Users by Session Count

Identifies the most active users based on session count over a specified period.

```kql
WVDConnections 
| where TimeGenerated >= ago(7d) 
| where State == "Connected" 
| summarize SessionCount = count() by UserName 
| top 10 by SessionCount
```

### Failed Connection Analysis

Analyzes failed connection attempts with error details for troubleshooting.

```kql
WVDConnections 
| where TimeGenerated >= ago(24h) 
| where State == "Failed" 
| summarize FailureCount = count() by UserName, ClientIPAddress 
| order by FailureCount desc
```

### Geographic Distribution of Connections

Shows the geographic distribution of AVD connections for compliance and analysis.

```kql
WVDConnections 
| where TimeGenerated >= ago(7d) 
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress)) 
| extend Country = tostring(ip_location.country) 
| summarize Connections = count() by Country 
| order by Connections desc
```

### Connection Duration Statistics

Provides statistical analysis of connection durations per user.

```kql
WVDConnections 
| where TimeGenerated >= ago(7d) 
| where State == "Connected" 
| project CorrelationId, UserName, StartTime=TimeGenerated 
| join (WVDConnections 
    | where State == "Completed" 
    | project EndTime=TimeGenerated, CorrelationId) on CorrelationId 
| extend Duration = EndTime - StartTime 
| summarize 
    AvgDuration = avg(Duration), 
    MaxDuration = max(Duration), 
    MinDuration = min(Duration) 
  by UserName
```

## Query Optimization Tips

### Performance Best Practices

1. **Time Range First**: Always filter by `TimeGenerated` first for optimal performance
2. **Specific Users**: Use exact user matches when possible rather than contains operations
3. **IP Address Filtering**: Use `ipv4_is_in_range()` for CIDR-based filtering
4. **Limit Results**: Use `limit` clause to control result set size
5. **Index Usage**: Filter on indexed fields (TimeGenerated, UserName, State) early

### Common Patterns

```kql
// Time range filtering
| where TimeGenerated >= ago(24h)

// User filtering
| where UserName == "user@domain.com"
| where UserName contains "john"

// IP address filtering
| where ClientIPAddress == "192.168.1.1"
| where ipv4_is_in_range(ClientIPAddress, "10.0.0.0/8")

// State filtering
| where State in ("Connected", "Completed")

// Geolocation enrichment
| extend ip_location = parse_json(geo_info_from_ip_address(ClientIPAddress))
| extend Country = tostring(ip_location.country)
```

## Troubleshooting Common Issues

### No Data Returned

1. Verify Log Analytics workspace has AVD diagnostic settings enabled
2. Check time range - data may not be available for the specified period
3. Ensure correct table names (WVDConnections, WVDErrors)
4. Verify user permissions to access Log Analytics data

### Performance Issues

1. Reduce time range for large datasets
2. Add more specific filters (user, IP, host pool)
3. Use `limit` clause to control result size
4. Avoid complex string operations on large datasets

### Geolocation Data Missing

1. Geolocation functions require internet connectivity from Log Analytics
2. Private IP addresses won't return geolocation data
3. Consider using `geo_info_from_ip_address()` function limitations

## Integration with Azure KQL Tool

These queries are integrated into the Azure KQL Query Builder tool with the following templates:

- **IP Addresses Analysis**: 30-day IP address analysis with geolocation
- **Users and IP Analysis**: User-centric connection analysis
- **User Connection Locations**: Specific user location tracking
- **Errors from Specific IP**: IP-based error investigation
- **Session Duration Analysis**: Session time calculations
- **Sessions per Host Pool**: Host pool utilization analysis
- **Recent Completed Sessions**: Recent activity monitoring
- **Errors per Host Pool**: Error pattern analysis

Each template provides guided parameter input and automatic query generation with performance optimization. 
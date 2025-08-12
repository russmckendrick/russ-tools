const FILTER_PRIORITY = {
  timeRange: 1,
  subscriptionId: 2,
  resourceGroup: 3,
  resourceId: 4,
  action: 5,
  sourceIp: 6,
  destinationIp: 7,
  sourcePort: 8,
  destinationPort: 9,
  protocol: 10,
  ruleCollection: 11,
  ruleName: 12,
  userName: 13,
  state: 14,
  connectionType: 15,
  clientOS: 16,
  default: 99
};

export async function generateKQLQuery(template, parameters) {
  if (!template) {
    throw new Error('Template is required');
  }

  const filters = buildFilters(template, parameters);
  const orderedFilters = orderFiltersByPriority(filters);
  const query = assembleQuery(template, orderedFilters, parameters);

  return formatQuery(query);
}

function buildFilters(template, parameters) {
  const filters = [];
  
  // Skip control parameters that aren't filter fields
  const controlParams = ['limit', 'sortField', 'sortOrder'];
  
  for (const [key, value] of Object.entries(parameters)) {
    if (!value || value === '' || value === 'any') continue;
    if (controlParams.includes(key)) continue;
    
    const field = template.fields?.find(f => f.name === key);
    if (!field) continue;
    
    const filter = generateFilter(field, value);
    if (filter) {
      filters.push({
        priority: FILTER_PRIORITY[key] || FILTER_PRIORITY.default,
        filter
      });
    }
  }
  
  return filters;
}

function generateFilter(field, value) {
  switch (field.type) {
    case 'timeRange':
      return `TimeGenerated >= ago(${value})`;
    
    case 'ip':
      if (value.includes('/')) {
        return `ipv4_is_in_range(${field.kqlField}, "${value}")`;
      }
      return `${field.kqlField} == "${value}"`;
    
    case 'select':
      if (field.multiple && Array.isArray(value)) {
        const values = value.map(v => `"${v}"`).join(', ');
        return `${field.kqlField} in (${values})`;
      }
      return `${field.kqlField} == "${value}"`;
    
    case 'number':
      return `${field.kqlField} == ${value}`;
    
    case 'text':
      if (field.kqlField && value) {
        if (field.contains) {
          return `${field.kqlField} contains "${value}"`;
        }
        return `${field.kqlField} == "${value}"`;
      }
      break;
    
    default:
      if (field.kqlField) {
        return `${field.kqlField} == "${value}"`;
      }
  }
  
  return null;
}

function orderFiltersByPriority(filters) {
  return filters
    .sort((a, b) => a.priority - b.priority)
    .map(f => f.filter);
}

function assembleQuery(template, filters, parameters) {
  let query = template.table || 'AzureDiagnostics';
  
  if (filters.length > 0) {
    query += '\n| where ' + filters.join('\n| where ');
  }
  
  if (template.aggregation) {
    query += '\n' + processAggregation(template.aggregation, parameters);
  }
  
  const sortField = parameters.sortField || 'TimeGenerated';
  const sortOrder = parameters.sortOrder || 'desc';
  query += `\n| order by ${sortField} ${sortOrder}`;
  
  const limit = parameters.limit || template.defaultLimit || 100;
  query += `\n| limit ${limit}`;
  
  if (template.projection) {
    const fields = template.projection.join(', ');
    query += `\n| project ${fields}`;
  }
  
  return query;
}

function processAggregation(aggregation, parameters) {
  let agg = aggregation;
  
  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{{${key}}}`;
    if (agg.includes(placeholder)) {
      agg = agg.replace(new RegExp(placeholder, 'g'), value);
    }
  }
  
  return agg;
}

function formatQuery(query) {
  return query
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

export function getQueryMetadata(query) {
  const lines = query.split('\n');
  const table = lines[0]?.trim() || '';
  const filterCount = lines.filter(l => l.includes('| where')).length;
  const hasAggregation = lines.some(l => l.includes('| summarize'));
  const hasProjection = lines.some(l => l.includes('| project'));
  const limit = lines.find(l => l.includes('| limit'))?.match(/\d+/)?.[0] || '100';
  
  return {
    table,
    filterCount,
    hasAggregation,
    hasProjection,
    limit: parseInt(limit)
  };
}
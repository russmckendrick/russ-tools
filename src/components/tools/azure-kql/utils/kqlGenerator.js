/**
 * KQL Query Generator
 * Generates optimized KQL queries based on templates and parameters
 */

/**
 * Generate KQL query from template and parameters
 * @param {Object} template - Service template
 * @param {Object} parameters - Query parameters
 * @param {string} templateId - Template identifier
 * @returns {string} Generated KQL query
 */
export const generateKQLQuery = (template, parameters, templateId = 'basic') => {
  if (!template || !parameters) {
    throw new Error('Template and parameters are required');
  }

  const templateConfig = template.templates[templateId];
  if (!templateConfig) {
    throw new Error(`Template '${templateId}' not found`);
  }

  // Get the primary table
  const tableName = templateConfig.table || template.schema.tables.primary;
  
  // Build query parts
  const queryParts = [tableName];
  
  // Add filters in optimal order
  const filters = buildFilters(template, parameters);
  if (filters.length > 0) {
    queryParts.push(`| where ${filters.join(' and ')}`);
  }
  
  // Add aggregations if specified in template
  if (templateConfig.aggregations && parameters.enableAggregation) {
    const aggregation = templateConfig.aggregations[0]; // Use first aggregation for now
    queryParts.push(`| summarize ${aggregation}`);
  }
  
  // Add sorting
  const sortField = parameters.sortField || 'TimeGenerated';
  const sortOrder = parameters.sortOrder || 'desc';
  queryParts.push(`| order by ${sortField} ${sortOrder}`);
  
  // Add limit - handle different limit options
  const limitValue = parameters.limit || template.defaults?.limit || '1000';
  
  // Handle different limit options
  if (limitValue === '0') {
    // "Max. limit" - don't add limit clause
  } else if (limitValue === 'custom') {
    // Use custom limit value if provided
    const customLimit = parameters.limit_custom;
    if (customLimit && !isNaN(parseInt(customLimit, 10)) && parseInt(customLimit, 10) > 0) {
      queryParts.push(`| limit ${parseInt(customLimit, 10)}`);
    } else {
      // If no valid custom limit, use default
      queryParts.push(`| limit 1000`);
    }
  } else {
    // Standard limit value
    const numericLimit = parseInt(limitValue, 10);
    if (!isNaN(numericLimit) && numericLimit > 0) {
      queryParts.push(`| limit ${numericLimit}`);
    }
  }
  
  return queryParts.join('\n');
};

/**
 * Build filters array in optimal order
 * @param {Object} template - Service template
 * @param {Object} parameters - Query parameters
 * @returns {Array} Array of filter strings
 */
const buildFilters = (template, parameters) => {
  const filters = [];
  const filterOrder = template.schema.filterOrder || [];
  
  // Fields that should not be treated as filters
  const nonFilterFields = ['limit', 'sortField', 'sortOrder', 'enableAggregation'];
  
  // Process filters in optimal order for performance
  filterOrder.forEach(fieldName => {
    // Skip non-filter fields
    if (nonFilterFields.includes(fieldName)) {
      return;
    }
    
    const fieldConfig = template.schema.fields[fieldName];
    const value = parameters[fieldName];
    
    if (value !== undefined && value !== null && value !== '') {
      const filter = buildFieldFilter(fieldName, value, fieldConfig, template);
      if (filter) {
        filters.push(filter);
      }
    }
  });
  
  return filters;
};

/**
 * Build filter for a specific field
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @param {Object} template - Service template
 * @returns {string|null} Filter string or null
 */
const buildFieldFilter = (fieldName, value, fieldConfig, template) => {
  const kqlField = fieldConfig.kqlField || fieldName;
  const patterns = template.queryPatterns || {};
  
  switch (fieldConfig.type) {
    case 'datetime':
      return buildTimeFilter(kqlField, value, patterns);
    
    case 'ipaddress':
      return buildIpFilter(kqlField, value, fieldConfig, patterns);
    
    case 'number':
      return buildNumericFilter(kqlField, value, fieldConfig, patterns);
    
    case 'select':
      return buildSelectFilter(kqlField, value, patterns);
    
    case 'string':
      return buildStringFilter(kqlField, value, fieldConfig, patterns);
    
    default:
      return buildBasicFilter(kqlField, value, patterns);
  }
};

/**
 * Build time range filter
 * @param {string} field - Field name
 * @param {string} value - Time range value
 * @param {Object} patterns - Query patterns
 * @returns {string} Time filter
 */
const buildTimeFilter = (field, value, patterns) => {
  if (!value) return null;
  
  // Special handling for timeRange field - it should generate TimeGenerated filter
  if (field === 'timeRange') {
    // Handle relative time ranges (e.g., "24h", "7d")
    if (value.match(/^\d+[hdwmy]$/)) {
      const pattern = patterns.timeRange?.relative || 'TimeGenerated >= ago({range})';
      return pattern.replace('{range}', value);
    }
    
    // Handle absolute time ranges (future implementation)
    // For now, default to relative
    const pattern = patterns.timeRange?.relative || 'TimeGenerated >= ago({range})';
    return pattern.replace('{range}', value);
  }
  
  // Handle direct TimeGenerated field
  if (field === 'TimeGenerated') {
    // Handle relative time ranges (e.g., "24h", "7d")
    if (value.match(/^\d+[hdwmy]$/)) {
      return `TimeGenerated >= ago(${value})`;
    }
    
    // Handle ISO datetime format
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return `TimeGenerated >= datetime('${date.toISOString()}')`;
    }
  }
  
  return null;
};

/**
 * Build IP address filter
 * @param {string} field - Field name
 * @param {string} value - IP address or CIDR
 * @param {Object} fieldConfig - Field configuration
 * @param {Object} patterns - Query patterns
 * @returns {string} IP filter
 */
const buildIpFilter = (field, value, fieldConfig, patterns) => {
  if (!value) return null;
  
  // Check if it's a CIDR range
  if (value.includes('/') && fieldConfig.supportsCIDR) {
    const pattern = patterns.ipFilter || 'ipv4_is_in_range({field}, "{cidr}")';
    return pattern.replace('{field}', field).replace('{cidr}', value);
  }
  
  // Regular IP address
  const pattern = patterns.basicFilter || '{field} == "{value}"';
  return pattern.replace('{field}', field).replace('{value}', value);
};

/**
 * Build numeric filter
 * @param {string} field - Field name
 * @param {number|string} value - Numeric value
 * @param {Object} fieldConfig - Field configuration
 * @param {Object} patterns - Query patterns
 * @returns {string} Numeric filter
 */
const buildNumericFilter = (field, value, fieldConfig, patterns) => {
  if (value === undefined || value === null || value === '') return null;
  
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(numValue)) return null;
  
  // Validate range if specified
  if (fieldConfig.min !== undefined && numValue < fieldConfig.min) return null;
  if (fieldConfig.max !== undefined && numValue > fieldConfig.max) return null;
  
  const pattern = patterns.numericFilter || '{field} {operator} {value}';
  return pattern
    .replace('{field}', field)
    .replace('{operator}', '==')
    .replace('{value}', numValue);
};

/**
 * Build select filter
 * @param {string} field - Field name
 * @param {string|Array} value - Selected value(s)
 * @param {Object} patterns - Query patterns
 * @returns {string} Select filter
 */
const buildSelectFilter = (field, value, patterns) => {
  if (!value) return null;
  
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const values = value.map(v => `"${v}"`).join(', ');
    const pattern = patterns.inFilter || '{field} in ({values})';
    return pattern.replace('{field}', field).replace('{values}', values);
  }
  
  const pattern = patterns.basicFilter || '{field} == "{value}"';
  return pattern.replace('{field}', field).replace('{value}', value);
};

/**
 * Build string filter
 * @param {string} field - Field name
 * @param {string} value - String value
 * @param {Object} fieldConfig - Field configuration
 * @param {Object} patterns - Query patterns
 * @returns {string} String filter
 */
const buildStringFilter = (field, value, fieldConfig, patterns) => {
  if (!value || typeof value !== 'string') return null;
  
  // Choose filter type based on value content
  if (value.includes('*') || value.includes('?')) {
    // Wildcard pattern
    const pattern = patterns.containsFilter || '{field} contains "{value}"';
    return pattern.replace('{field}', field).replace('{value}', value.replace(/[*?]/g, ''));
  }
  
  // Exact match
  const pattern = patterns.basicFilter || '{field} == "{value}"';
  return pattern.replace('{field}', field).replace('{value}', value);
};

/**
 * Build basic filter (fallback)
 * @param {string} field - Field name
 * @param {*} value - Field value
 * @param {Object} patterns - Query patterns
 * @returns {string} Basic filter
 */
const buildBasicFilter = (field, value, patterns) => {
  if (value === undefined || value === null || value === '') return null;
  
  const pattern = patterns.basicFilter || '{field} == "{value}"';
  return pattern.replace('{field}', field).replace('{value}', String(value));
};

/**
 * Validate and optimize query
 * @param {string} query - Generated query
 * @param {Object} template - Service template
 * @param {Object} parameters - Query parameters
 * @returns {Object} Validation result
 */
export const validateQuery = (query, template, parameters) => {
  const warnings = [];
  const errors = [];
  
  // Check for time range
  if (!query.includes('TimeGenerated')) {
    warnings.push('Query does not include time range filtering, which may impact performance');
  }
  
  // Check query length
  if (query.length > 8000) {
    warnings.push('Query is very long and may be complex to execute');
  }
  
  // Check for limit
  if (!query.includes('limit') && !parameters.limit) {
    warnings.push('Query does not include result limiting, which may return large datasets');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
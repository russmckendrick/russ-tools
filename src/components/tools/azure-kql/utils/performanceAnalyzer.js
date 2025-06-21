/**
 * Query performance analysis and optimization utilities
 */

/**
 * Analyze query performance and provide warnings/suggestions
 * @param {string} query - Generated KQL query
 * @param {Object} parameters - Query parameters
 * @param {Object} template - Service template
 * @returns {Object} Performance analysis result
 */
export const analyzeQueryPerformance = (query, parameters, template) => {
  const warnings = [];
  const suggestions = [];
  const score = calculatePerformanceScore(query, parameters, template);
  const estimatedCost = estimateQueryCost(query, parameters);
  
  // Time range analysis
  analyzeTimeRange(parameters, warnings, suggestions);
  
  // Result limit analysis
  analyzeResultLimit(parameters, warnings, suggestions);
  
  // Filter efficiency analysis
  analyzeFilterEfficiency(query, parameters, template, warnings, suggestions);
  
  // Query complexity analysis
  analyzeQueryComplexity(query, warnings, suggestions);
  
  // Resource scope analysis
  analyzeResourceScope(parameters, warnings, suggestions);
  
  return {
    score,
    estimatedCost,
    warnings,
    suggestions,
    optimizationTips: generateOptimizationTips(warnings, suggestions),
    executionTime: estimateExecutionTime(score, estimatedCost)
  };
};

/**
 * Analyze time range performance impact
 * @param {Object} parameters - Query parameters
 * @param {Array} warnings - Warnings array
 * @param {Array} suggestions - Suggestions array
 */
const analyzeTimeRange = (parameters, warnings, suggestions) => {
  const timeRange = parameters.timeRange || parameters.TimeGenerated;
  
  if (!timeRange) {
    warnings.push({
      type: 'performance',
      severity: 'high',
      message: 'No time range specified - query will scan all data',
      impact: 'Very high performance impact and cost',
      recommendation: 'Add a time range filter to limit data scan'
    });
    return;
  }
  
  // Parse time range
  const timeValue = parseTimeRange(timeRange);
  if (!timeValue) return;
  
  const { amount, unit } = timeValue;
  
  // Warn about large time ranges
  if (unit === 'h' && amount > 24 * 7) { // More than 1 week in hours
    warnings.push({
      type: 'performance',
      severity: 'medium',
      message: 'Large time range may impact performance',
      impact: 'Increased query execution time and cost',
      recommendation: 'Consider breaking into smaller time ranges or adding more filters'
    });
  } else if (unit === 'd' && amount > 30) { // More than 30 days
    warnings.push({
      type: 'performance',
      severity: 'high',
      message: 'Very large time range detected',
      impact: 'Significantly increased execution time and cost',
      recommendation: 'Reduce time range to 30 days or less for better performance'
    });
  } else if (unit === 'd' && amount > 90) { // More than 90 days
    warnings.push({
      type: 'performance',
      severity: 'critical',
      message: 'Extremely large time range may cause query timeout',
      impact: 'Query may fail or time out',
      recommendation: 'Reduce time range to 30 days or less'
    });
  }
  
  // Suggest optimization for medium ranges
  if ((unit === 'h' && amount > 24) || (unit === 'd' && amount > 7)) {
    suggestions.push({
      type: 'optimization',
      message: 'Consider adding more specific filters to reduce data volume',
      benefit: 'Faster execution and lower cost'
    });
  }
};

/**
 * Analyze result limit impact
 * @param {Object} parameters - Query parameters
 * @param {Array} warnings - Warnings array
 * @param {Array} suggestions - Suggestions array
 */
const analyzeResultLimit = (parameters, warnings, suggestions) => {
  const limit = parseInt(parameters.limit, 10);
  
  if (!limit || isNaN(limit)) {
    warnings.push({
      type: 'performance',
      severity: 'medium',
      message: 'No result limit specified',
      impact: 'May return large result sets',
      recommendation: 'Add a limit clause to control result size'
    });
    return;
  }
  
  if (limit > 10000) {
    warnings.push({
      type: 'performance',
      severity: 'high',
      message: 'Very large result limit',
      impact: 'High memory usage and slow data transfer',
      recommendation: 'Consider reducing limit or using pagination'
    });
  } else if (limit > 5000) {
    suggestions.push({
      type: 'optimization',
      message: 'Large result set - consider using aggregation instead',
      benefit: 'Reduced data transfer and faster processing'
    });
  }
  
  if (limit > 1000) {
    suggestions.push({
      type: 'pagination',
      message: 'Consider implementing pagination for large result sets',
      benefit: 'Better user experience and performance'
    });
  }
};

/**
 * Analyze filter efficiency
 * @param {string} query - KQL query
 * @param {Object} parameters - Query parameters
 * @param {Object} template - Service template
 * @param {Array} warnings - Warnings array
 * @param {Array} suggestions - Suggestions array
 */
const analyzeFilterEfficiency = (query, parameters, template, warnings, suggestions) => {
  const filterOrder = template?.schema?.filterOrder || [];
  const appliedFilters = Object.keys(parameters).filter(key => 
    parameters[key] && key !== 'limit' && key !== 'sortField' && key !== 'sortOrder'
  );
  
  // Check for high-cardinality filters without selective filters
  const hasTimeFilter = appliedFilters.some(filter => 
    filter.toLowerCase().includes('time') || filter === 'timeRange'
  );
  const hasSelectiveFilter = appliedFilters.some(filter => 
    ['SourceIp', 'DestinationIp', 'clientIP_s', 'Action', 'httpStatus_d'].includes(filter)
  );
  
  if (!hasTimeFilter) {
    warnings.push({
      type: 'performance',
      severity: 'critical',
      message: 'Missing time filter',
      impact: 'Query will scan all historical data',
      recommendation: 'Always include a time range filter'
    });
  }
  
  if (hasTimeFilter && !hasSelectiveFilter && appliedFilters.length < 2) {
    suggestions.push({
      type: 'optimization',
      message: 'Add more selective filters to reduce data volume',
      benefit: 'Significantly improved query performance'
    });
  }
  
  // Check for string pattern matching on large datasets
  const hasStringPatterns = query.includes('contains') || query.includes('has') || query.includes('startswith');
  if (hasStringPatterns && !hasSelectiveFilter) {
    warnings.push({
      type: 'performance',
      severity: 'medium',
      message: 'String pattern matching without selective filters',
      impact: 'Slower query execution',
      recommendation: 'Add IP, status, or action filters before string patterns'
    });
  }
  
  // Check filter ordering
  if (filterOrder.length > 0) {
    const queryFilters = extractFiltersFromQuery(query);
    const orderScore = calculateFilterOrderScore(queryFilters, filterOrder);
    
    if (orderScore < 0.7) {
      suggestions.push({
        type: 'optimization',
        message: 'Filters could be reordered for better performance',
        benefit: 'Improved query execution speed'
      });
    }
  }
};

/**
 * Analyze query complexity
 * @param {string} query - KQL query
 * @param {Array} warnings - Warnings array
 * @param {Array} suggestions - Suggestions array
 */
const analyzeQueryComplexity = (query, warnings, suggestions) => {
  const lines = query.split('\n').filter(line => line.trim());
  const operatorCount = (query.match(/\|/g) || []).length;
  
  // Complex query detection
  if (operatorCount > 10) {
    warnings.push({
      type: 'complexity',
      severity: 'medium',
      message: 'Complex query with many operators',
      impact: 'Increased execution time and resource usage',
      recommendation: 'Consider breaking into smaller queries or using let statements'
    });
  }
  
  // Multiple joins detection
  const joinCount = (query.match(/\bjoin\b/gi) || []).length;
  if (joinCount > 2) {
    warnings.push({
      type: 'complexity',
      severity: 'high',
      message: 'Multiple joins detected',
      impact: 'Significantly increased execution time',
      recommendation: 'Optimize join conditions and consider reducing join count'
    });
  }
  
  // Expensive operations detection
  const expensiveOps = ['distinct', 'dcount', 'percentile', 'arg_max', 'arg_min'];
  const hasExpensiveOps = expensiveOps.some(op => query.toLowerCase().includes(op));
  
  if (hasExpensiveOps) {
    suggestions.push({
      type: 'optimization',
      message: 'Query uses expensive operations - ensure sufficient filtering',
      benefit: 'Better performance for complex aggregations'
    });
  }
  
  // Regex patterns detection
  if (query.includes('matches') || query.includes('extract')) {
    warnings.push({
      type: 'performance',
      severity: 'medium',
      message: 'Regex operations detected',
      impact: 'Higher CPU usage',
      recommendation: 'Use simpler string operations when possible'
    });
  }
};

/**
 * Analyze resource scope
 * @param {Object} parameters - Query parameters
 * @param {Array} warnings - Warnings array
 * @param {Array} suggestions - Suggestions array
 */
const analyzeResourceScope = (parameters, warnings, suggestions) => {
  const hasSubscriptionFilter = parameters.SubscriptionId;
  const hasResourceGroupFilter = parameters.ResourceGroup;
  const hasResourceFilter = parameters.ResourceId;
  
  if (!hasSubscriptionFilter && !hasResourceGroupFilter && !hasResourceFilter) {
    warnings.push({
      type: 'scope',
      severity: 'medium',
      message: 'No resource scope filtering',
      impact: 'Query will scan data across all subscriptions',
      recommendation: 'Add subscription, resource group, or resource filters'
    });
  }
  
  if (hasSubscriptionFilter && !hasResourceGroupFilter) {
    suggestions.push({
      type: 'optimization',
      message: 'Consider adding resource group filter for better performance',
      benefit: 'Reduced data scan scope'
    });
  }
};

/**
 * Calculate overall performance score
 * @param {string} query - KQL query
 * @param {Object} parameters - Query parameters
 * @param {Object} template - Service template
 * @returns {number} Score from 0-100
 */
const calculatePerformanceScore = (query, parameters, template) => {
  let score = 100;
  
  // Time range scoring
  const timeRange = parameters.timeRange || parameters.TimeGenerated;
  if (!timeRange) {
    score -= 40; // No time range is very bad
  } else {
    const timeValue = parseTimeRange(timeRange);
    if (timeValue) {
      const { amount, unit } = timeValue;
      if (unit === 'd' && amount > 30) score -= 20;
      else if (unit === 'd' && amount > 7) score -= 10;
      else if (unit === 'h' && amount > 24) score -= 5;
    }
  }
  
  // Filter count scoring
  const filterCount = Object.keys(parameters).filter(key => 
    parameters[key] && key !== 'limit' && key !== 'sortField' && key !== 'sortOrder'
  ).length;
  
  if (filterCount < 2) score -= 15;
  else if (filterCount >= 3) score += 5;
  
  // Limit scoring
  const limit = parseInt(parameters.limit, 10);
  if (!limit || isNaN(limit)) score -= 10;
  else if (limit > 10000) score -= 25;
  else if (limit > 5000) score -= 15;
  else if (limit > 1000) score -= 5;
  
  // Query complexity scoring
  const operatorCount = (query.match(/\|/g) || []).length;
  if (operatorCount > 10) score -= 15;
  else if (operatorCount > 5) score -= 5;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Estimate query execution cost
 * @param {string} query - KQL query
 * @param {Object} parameters - Query parameters
 * @returns {Object} Cost estimation
 */
const estimateQueryCost = (query, parameters) => {
  const timeRange = parameters.timeRange || parameters.TimeGenerated;
  const limit = parseInt(parameters.limit, 10) || 100;
  
  let baseCost = 1; // Base cost units
  
  // Time range impact
  if (!timeRange) {
    baseCost *= 50; // No time range is extremely expensive
  } else {
    const timeValue = parseTimeRange(timeRange);
    if (timeValue) {
      const { amount, unit } = timeValue;
      if (unit === 'h') baseCost *= Math.max(1, amount / 24);
      else if (unit === 'd') baseCost *= amount;
      else if (unit === 'w') baseCost *= amount * 7;
      else if (unit === 'm') baseCost *= amount * 30;
    }
  }
  
  // Complexity impact
  const operatorCount = (query.match(/\|/g) || []).length;
  baseCost *= (1 + operatorCount * 0.1);
  
  // Result size impact
  baseCost *= Math.log10(Math.max(10, limit)) / 2;
  
  return {
    estimated: Math.round(baseCost * 10) / 10,
    unit: 'cost units',
    category: baseCost < 5 ? 'low' : baseCost < 20 ? 'medium' : 'high'
  };
};

/**
 * Estimate query execution time
 * @param {number} performanceScore - Performance score
 * @param {Object} costEstimate - Cost estimate
 * @returns {Object} Time estimation
 */
const estimateExecutionTime = (performanceScore, costEstimate) => {
  const baseTime = costEstimate.estimated * 100; // Base milliseconds
  const performanceMultiplier = (100 - performanceScore) / 100 + 0.5;
  
  const estimatedMs = baseTime * performanceMultiplier;
  
  let timeString, category;
  
  if (estimatedMs < 1000) {
    timeString = `${Math.round(estimatedMs)}ms`;
    category = 'fast';
  } else if (estimatedMs < 10000) {
    timeString = `${Math.round(estimatedMs / 1000 * 10) / 10}s`;
    category = 'moderate';
  } else if (estimatedMs < 60000) {
    timeString = `${Math.round(estimatedMs / 1000)}s`;
    category = 'slow';
  } else {
    timeString = `${Math.round(estimatedMs / 60000 * 10) / 10}m`;
    category = 'very_slow';
  }
  
  return {
    estimated: estimatedMs,
    display: timeString,
    category
  };
};

/**
 * Generate optimization tips based on analysis
 * @param {Array} warnings - Performance warnings
 * @param {Array} suggestions - Optimization suggestions
 * @returns {Array} Prioritized optimization tips
 */
const generateOptimizationTips = (warnings, suggestions) => {
  const tips = [];
  
  // Add critical warnings as high-priority tips
  warnings
    .filter(w => w.severity === 'critical')
    .forEach(warning => {
      tips.push({
        priority: 'high',
        category: 'critical',
        tip: warning.recommendation,
        impact: warning.impact
      });
    });
  
  // Add high-severity warnings
  warnings
    .filter(w => w.severity === 'high')
    .forEach(warning => {
      tips.push({
        priority: 'medium',
        category: 'performance',
        tip: warning.recommendation,
        impact: warning.impact
      });
    });
  
  // Add optimization suggestions
  suggestions.forEach(suggestion => {
    tips.push({
      priority: 'low',
      category: 'optimization',
      tip: suggestion.message,
      impact: suggestion.benefit
    });
  });
  
  return tips.slice(0, 5); // Return top 5 tips
};

/**
 * Parse time range string
 * @param {string} timeRange - Time range string (e.g., "24h", "7d")
 * @returns {Object|null} Parsed time range
 */
const parseTimeRange = (timeRange) => {
  if (!timeRange || typeof timeRange !== 'string') return null;
  
  const match = timeRange.match(/^(\d+)([smhdwmy])$/);
  if (!match) return null;
  
  return {
    amount: parseInt(match[1], 10),
    unit: match[2]
  };
};

/**
 * Extract filters from KQL query
 * @param {string} query - KQL query
 * @returns {Array} Array of filter names
 */
const extractFiltersFromQuery = (query) => {
  const filters = [];
  const lines = query.split('\n');
  
  lines.forEach(line => {
    if (line.includes('where') || line.includes('|')) {
      // Simple extraction - could be more sophisticated
      const matches = line.match(/(\w+)\s*(?:==|!=|>=|<=|>|<|contains|has|startswith)/g);
      if (matches) {
        matches.forEach(match => {
          const field = match.split(/\s*(?:==|!=|>=|<=|>|<|contains|has|startswith)/)[0];
          if (field && !filters.includes(field)) {
            filters.push(field);
          }
        });
      }
    }
  });
  
  return filters;
};

/**
 * Calculate filter order score
 * @param {Array} queryFilters - Filters in query order
 * @param {Array} optimalOrder - Optimal filter order
 * @returns {number} Score from 0-1
 */
const calculateFilterOrderScore = (queryFilters, optimalOrder) => {
  if (queryFilters.length === 0) return 1;
  
  let score = 0;
  let matches = 0;
  
  queryFilters.forEach((filter, index) => {
    const optimalIndex = optimalOrder.indexOf(filter);
    if (optimalIndex !== -1) {
      matches++;
      // Score based on how close the filter is to its optimal position
      const positionScore = 1 - Math.abs(index - optimalIndex) / Math.max(queryFilters.length, optimalOrder.length);
      score += positionScore;
    }
  });
  
  return matches > 0 ? score / matches : 0;
};
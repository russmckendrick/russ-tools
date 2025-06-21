/**
 * Parameter validation utilities for Azure KQL queries
 */

/**
 * Validate all parameters against template schema
 * @param {Object} parameters - Parameters to validate
 * @param {Object} template - Service template
 * @returns {Object} Validation result
 */
export const validateParameters = (parameters, template) => {
  const errors = [];
  const warnings = [];
  
  if (!template || !template.schema) {
    errors.push('Template schema is required');
    return { isValid: false, errors, warnings };
  }
  
  const fields = template.schema.fields || {};
  
  // Validate each parameter
  Object.keys(parameters).forEach(paramName => {
    const paramValue = parameters[paramName];
    const fieldConfig = fields[paramName];
    
    if (!fieldConfig) {
      warnings.push(`Unknown parameter: ${paramName}`);
      return;
    }
    
    const fieldValidation = validateField(paramName, paramValue, fieldConfig);
    errors.push(...fieldValidation.errors);
    warnings.push(...fieldValidation.warnings);
  });
  
  // Check required fields
  Object.keys(fields).forEach(fieldName => {
    const fieldConfig = fields[fieldName];
    if (fieldConfig.required && !parameters[fieldName]) {
      errors.push(`Required field '${fieldName}' is missing`);
    }
  });
  
  // Performance warnings
  if (!parameters.TimeGenerated && !parameters.timeRange) {
    warnings.push('No time range specified - query may be slow');
  }
  
  if (parameters.limit && parameters.limit > 5000) {
    warnings.push('Large result limit may impact performance');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate a single field
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @returns {Object} Validation result
 */
export const validateField = (fieldName, value, fieldConfig) => {
  const errors = [];
  const warnings = [];
  
  // Skip validation for empty values unless required
  if (value === undefined || value === null || value === '') {
    if (fieldConfig.required) {
      errors.push(`${fieldName} is required`);
    }
    return { errors, warnings };
  }
  
  // Skip validation for very short values (user is likely still typing)
  if (typeof value === 'string' && value.length < 2) {
    return { errors, warnings };
  }
  
  switch (fieldConfig.type) {
    case 'string':
      validateString(fieldName, value, fieldConfig, errors);
      break;
    case 'number':
      validateNumber(fieldName, value, fieldConfig, errors);
      break;
    case 'ipaddress':
      validateIpAddress(fieldName, value, fieldConfig, errors);
      break;
    case 'datetime':
      validateDateTime(fieldName, value, fieldConfig, errors, warnings);
      break;
    case 'select':
      validateSelect(fieldName, value, fieldConfig, errors, warnings);
      break;
    default:
      // Basic validation for unknown types
      if (typeof value !== 'string' && typeof value !== 'number') {
        warnings.push(`${fieldName} has unknown type: ${fieldConfig.type}`);
      }
  }
  
  return { errors, warnings };
};

/**
 * Validate string field
 * @param {string} fieldName - Field name
 * @param {string} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @param {Array} errors - Error array
 * @param {Array} warnings - Warning array
 */
const validateString = (fieldName, value, fieldConfig, errors) => {
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return;
  }
  
  // Skip validation for placeholder values
  if (value.includes('<replace') || value.includes('[object Object]')) {
    return;
  }
  
  if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
    errors.push(`${fieldName} must be at least ${fieldConfig.minLength} characters`);
  }
  
  if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
    errors.push(`${fieldName} must be no more than ${fieldConfig.maxLength} characters`);
  }
  
  if (fieldConfig.pattern && !new RegExp(fieldConfig.pattern).test(value)) {
    errors.push(`${fieldName} format is invalid`);
  }
};

/**
 * Validate number field
 * @param {string} fieldName - Field name
 * @param {number|string} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @param {Array} errors - Error array
 * @param {Array} warnings - Warning array
 */
const validateNumber = (fieldName, value, fieldConfig, errors) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    errors.push(`${fieldName} must be a valid number`);
    return;
  }
  
  if (fieldConfig.min !== undefined && numValue < fieldConfig.min) {
    errors.push(`${fieldName} must be at least ${fieldConfig.min}`);
  }
  
  if (fieldConfig.max !== undefined && numValue > fieldConfig.max) {
    errors.push(`${fieldName} must be no more than ${fieldConfig.max}`);
  }
  
  // Port-specific validation
  if (fieldName.toLowerCase().includes('port')) {
    if (numValue < 1 || numValue > 65535) {
      errors.push(`${fieldName} must be between 1 and 65535`);
    }
  }
};

/**
 * Validate IP address field
 * @param {string} fieldName - Field name
 * @param {string} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @param {Array} errors - Error array
 * @param {Array} warnings - Warning array
 */
const validateIpAddress = (fieldName, value, fieldConfig, errors) => {
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return;
  }
  
  // Skip validation for partial IP addresses (user is likely still typing)
  if (value.length < 7) { // Minimum valid IP is "1.1.1.1" (7 chars)
    return;
  }
  
  // Check for CIDR notation
  if (value.includes('/')) {
    if (!fieldConfig.supportsCIDR) {
      errors.push(`${fieldName} does not support CIDR notation`);
      return;
    }
    
    const [ip, mask] = value.split('/');
    const maskNum = parseInt(mask, 10);
    
    if (mask && (isNaN(maskNum) || maskNum < 0 || maskNum > 32)) {
      errors.push(`${fieldName} has invalid CIDR mask`);
      return;
    }
    
    if (ip && ip.length >= 7 && !isValidIpv4(ip)) {
      errors.push(`${fieldName} has invalid IP address in CIDR`);
      return;
    }
  } else {
    // Regular IP address - only validate if it looks complete
    if (!isValidIpv4(value)) {
      errors.push(`${fieldName} is not a valid IPv4 address`);
    }
  }
};

/**
 * Validate datetime field
 * @param {string} fieldName - Field name
 * @param {string} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @param {Array} errors - Error array
 * @param {Array} warnings - Warning array
 */
const validateDateTime = (fieldName, value, fieldConfig, errors, warnings) => {
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return;
  }
  
  // Check for relative time ranges (e.g., "24h", "7d", "30m")
  const relativeTimePattern = /^\d+[smhdwmy]$/;
  if (relativeTimePattern.test(value)) {
    const num = parseInt(value.slice(0, -1), 10);
    const unit = value.slice(-1);
    
    if (num <= 0) {
      errors.push(`${fieldName} time value must be positive`);
    }
    
    // Warn about very large time ranges
    if ((unit === 'h' && num > 24 * 30) || (unit === 'd' && num > 90)) {
      warnings.push(`${fieldName} covers a very large time range which may impact performance`);
    }
    
    return;
  }
  
  // Check for ISO datetime format
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} is not a valid datetime format`);
  }
};

/**
 * Validate select field
 * @param {string} fieldName - Field name
 * @param {string|Array} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @param {Array} errors - Error array
 * @param {Array} warnings - Warning array
 */
const validateSelect = (fieldName, value, fieldConfig, errors, warnings) => {
  if (!fieldConfig.options || !Array.isArray(fieldConfig.options)) {
    warnings.push(`${fieldName} has no defined options`);
    return;
  }
  
  if (Array.isArray(value)) {
    // Multiple selection
    const invalidOptions = value.filter(v => !fieldConfig.options.includes(v));
    if (invalidOptions.length > 0) {
      errors.push(`${fieldName} contains invalid options: ${invalidOptions.join(', ')}`);
    }
  } else {
    // Single selection
    if (!fieldConfig.options.includes(value)) {
      errors.push(`${fieldName} must be one of: ${fieldConfig.options.join(', ')}`);
    }
  }
};

/**
 * Validate IPv4 address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IPv4
 */
const isValidIpv4 = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

/**
 * Get validation summary
 * @param {Object} validation - Validation result
 * @returns {string} Summary message
 */
export const getValidationSummary = (validation) => {
  if (!validation) return '';
  
  const { isValid, errors, warnings } = validation;
  
  if (isValid && warnings.length === 0) {
    return 'All parameters are valid';
  }
  
  const parts = [];
  
  if (errors.length > 0) {
    parts.push(`${errors.length} error${errors.length === 1 ? '' : 's'}`);
  }
  
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
  }
  
  return parts.join(', ');
};
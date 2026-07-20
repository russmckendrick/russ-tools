const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateParameters(parameters, template) {
  const errors = {};
  
  if (!template || !template.fields) {
    return errors;
  }
  
  for (const field of template.fields) {
    if (field.required && !parameters[field.name]) {
      errors[field.name] = `${field.label} is required`;
      continue;
    }
    
    const value = parameters[field.name];
    if (!value) continue;
    
    const error = validateField(field, value);
    if (error) {
      errors[field.name] = error;
    }
  }
  
  return errors;
}

function validateField(field, value) {
  switch (field.type) {
    case 'ip':
      return validateIP(value);
    
    case 'number':
      return validateNumber(value, field.min, field.max);
    
    case 'email':
      return validateEmail(value);
    
    case 'text':
      return validateText(value, field.minLength, field.maxLength);
    
    case 'select':
      return validateSelect(value, field.options, field.multiple);
    
    case 'timeRange':
      return validateTimeRange(value);
    
    default:
      return null;
  }
}

function validateIP(value) {
  if (!IPV4_REGEX.test(value)) {
    return 'Invalid IP address format';
  }
  
  const parts = value.split('/')[0].split('.');
  for (const part of parts) {
    const num = parseInt(part);
    if (num < 0 || num > 255) {
      return 'IP octets must be between 0 and 255';
    }
  }
  
  if (value.includes('/')) {
    const cidr = parseInt(value.split('/')[1]);
    if (cidr < 0 || cidr > 32) {
      return 'CIDR notation must be between 0 and 32';
    }
  }
  
  return null;
}

function validateNumber(value, min, max) {
  const num = parseInt(value);
  
  if (isNaN(num)) {
    return 'Must be a valid number';
  }
  
  if (min !== undefined && num < min) {
    return `Must be at least ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `Must be at most ${max}`;
  }
  
  return null;
}

function validateEmail(value) {
  if (!EMAIL_REGEX.test(value)) {
    return 'Invalid email format';
  }
  return null;
}

function validateText(value, minLength, maxLength) {
  if (minLength !== undefined && value.length < minLength) {
    return `Must be at least ${minLength} characters`;
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    return `Must be at most ${maxLength} characters`;
  }
  
  return null;
}

function validateSelect(value, options, multiple) {
  if (multiple && Array.isArray(value)) {
    for (const v of value) {
      if (!options.some(opt => opt.value === v)) {
        return `Invalid option: ${v}`;
      }
    }
  } else {
    if (!options.some(opt => opt.value === value)) {
      return `Invalid option: ${value}`;
    }
  }
  
  return null;
}

function validateTimeRange(value) {
  const validRanges = ['1h', '6h', '12h', '24h', '2d', '7d', '14d', '30d', '90d'];
  
  if (!validRanges.includes(value) && !value.match(/^\d+[hdm]$/)) {
    return 'Invalid time range format';
  }
  
  return null;
}

export function validateQuery(query) {
  const issues = [];
  
  if (!query || query.trim().length === 0) {
    issues.push('Query is empty');
    return issues;
  }
  
  const lines = query.split('\n');
  
  if (!lines[0].match(/^[A-Za-z_]\w*/)) {
    issues.push('Query must start with a table name');
  }
  
  const timeFilter = lines.find(l => l.includes('TimeGenerated'));
  if (!timeFilter) {
    issues.push('Warning: No time filter found, query may be slow');
  }
  
  const limitLine = lines.find(l => l.includes('| limit'));
  if (!limitLine) {
    issues.push('Warning: No limit specified, query may return too many results');
  } else {
    const limit = parseInt(limitLine.match(/\d+/)?.[0] || '0');
    if (limit > 10000) {
      issues.push('Warning: Large limit may cause performance issues');
    }
  }
  
  return issues;
}
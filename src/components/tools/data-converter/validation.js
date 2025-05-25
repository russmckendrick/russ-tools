import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import betterAjvErrors from 'better-ajv-errors';
import jsonSourceMap from 'json-source-map';
import parseJson from 'json-parse-even-better-errors';
import yaml from 'js-yaml';
import SourceMap from 'js-yaml-source-map';
import TOML from '@iarna/toml';

/**
 * Enhanced validation utility that provides detailed error messages
 * with line numbers and suggestions for JSON, YAML, and TOML formats
 */

// Initialize AJV with better error reporting and format validation
const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false
});

// Add format validation (email, date, uri, etc.)
addFormats(ajv);

/**
 * Common validation schemas for different data types
 */
export const commonSchemas = {
  user: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 0, maximum: 150 },
      website: { type: 'string', format: 'uri' },
      phone: { type: 'string', pattern: '^[+]?[0-9\\s\\-\\(\\)]+$' },
      birthDate: { type: 'string', format: 'date' },
      isActive: { type: 'boolean' }
    },
    required: ['name', 'email']
  },
  
  product: {
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      price: { type: 'number', minimum: 0 },
      currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY'] },
      category: { type: 'string', minLength: 1 },
      inStock: { type: 'boolean' },
      tags: { 
        type: 'array', 
        items: { type: 'string' },
        uniqueItems: true
      },
      createdAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'price']
  },
  
  config: {
    type: 'object',
    properties: {
      apiUrl: { type: 'string', format: 'uri' },
      timeout: { type: 'number', minimum: 1000, maximum: 30000 },
      retries: { type: 'integer', minimum: 0, maximum: 10 },
      environment: { type: 'string', enum: ['development', 'staging', 'production'] },
      features: {
        type: 'object',
        additionalProperties: { type: 'boolean' }
      },
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' }
    },
    required: ['apiUrl', 'environment']
  }
};

/**
 * Enhanced error class with line numbers and suggestions
 */
export class ValidationError extends Error {
  constructor(message, line = null, column = null, suggestions = []) {
    super(message);
    this.name = 'ValidationError';
    this.line = line;
    this.column = column;
    this.suggestions = suggestions;
  }
}

/**
 * Parse and validate JSON with enhanced error reporting using json-parse-even-better-errors
 */
export function validateJSON(input) {
  try {
    // Use json-parse-even-better-errors for much better error reporting
    const parsed = parseJson(input);
    return { 
      success: true, 
      data: parsed, 
      errors: [] 
    };
  } catch (error) {
    // json-parse-even-better-errors provides excellent error details
    const errors = [];
    let suggestions = [];
    
    // Extract line and column from the enhanced error
    let line = error.line || null;
    let column = error.column || null;
    
    // If line/column not directly available, parse from the detailed message
    if (!line || !column) {
      const positionMatch = error.message.match(/position (\d+)/);
      const lineColumnMatch = error.message.match(/line (\d+) column (\d+)/);
      
      if (lineColumnMatch) {
        line = parseInt(lineColumnMatch[1]);
        column = parseInt(lineColumnMatch[2]);
      } else if (positionMatch) {
        const position = parseInt(positionMatch[1]);
        const lines = input.substring(0, position).split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }
    }
    
    // Generate suggestions based on the error message
    const errorMsg = error.message.toLowerCase();
    
    // Handle specific error patterns from json-parse-even-better-errors
    if (errorMsg.includes("expected ',' or '}'")) {
      suggestions.push("Add a comma ',' after the previous property value");
      suggestions.push("Missing comma between object properties");
      suggestions.push("Each property in a JSON object must be separated by a comma");
    } else if (errorMsg.includes("expected double-quoted property name")) {
      suggestions.push("Remove the trailing comma - JSON doesn't allow trailing commas");
      suggestions.push("Add another property after the comma, or remove the comma");
    } else if (errorMsg.includes("expected property name or '}'")) {
      suggestions.push("Property names must be wrapped in double quotes");
      suggestions.push('Use "propertyName" instead of propertyName');
      suggestions.push("All object keys in JSON must be strings in double quotes");
    } else if (errorMsg.includes("unexpected token")) {
      if (errorMsg.includes("'")) {
        suggestions.push("Use double quotes (\") instead of single quotes (') for strings");
        suggestions.push("JSON only allows double quotes, not single quotes");
      } else {
        suggestions.push("Check for invalid characters or syntax");
        suggestions.push("Ensure proper JSON syntax with correct punctuation");
      }
    } else if (errorMsg.includes('expected') && errorMsg.includes(',')) {
      suggestions.push("Add a comma after the previous property");
      suggestions.push("Check if you're missing a comma between object properties");
    } else if (errorMsg.includes('expected') && errorMsg.includes('}')) {
      suggestions.push("Add a closing curly brace '}' to close the object");
      suggestions.push("Check for missing closing brackets or braces");
    } else if (errorMsg.includes('expected') && errorMsg.includes(']')) {
      suggestions.push("Add a closing square bracket ']' to close the array");
      suggestions.push("Check for missing closing brackets");
    } else if (errorMsg.includes('expected') && errorMsg.includes(':')) {
      suggestions.push("Add a colon ':' after the property name");
      suggestions.push("Object properties need a colon between key and value");
    } else if (errorMsg.includes('expected') && errorMsg.includes('"')) {
      suggestions.push("Add quotes around the property name or value");
      suggestions.push("All strings in JSON must be wrapped in double quotes");
    }
    
    if (errorMsg.includes('unexpected end')) {
      suggestions.push("The JSON is incomplete - check for missing closing brackets, braces, or quotes");
      suggestions.push("Ensure all objects and arrays are properly closed");
    }
    
    if (errorMsg.includes('trailing comma')) {
      suggestions.push("Remove the trailing comma - JSON doesn't allow trailing commas");
      suggestions.push("Add another property after the comma, or remove the comma");
    }
    
    // Check for common structural issues
    const trimmedInput = input.trim();
    if (!trimmedInput.startsWith('{') && !trimmedInput.startsWith('[') && 
        (trimmedInput.includes(':') || trimmedInput.includes('"'))) {
      suggestions.push("JSON objects must start with '{' and end with '}'");
      suggestions.push("JSON arrays must start with '[' and end with ']'");
    }
    
    // Check for unquoted keys
    if (errorMsg.includes('unexpected token') && /^\s*\w+\s*:/.test(trimmedInput)) {
      suggestions.push("Object keys must be wrapped in double quotes");
      suggestions.push('Example: {"key": "value"} not {key: "value"}');
    }
    
    // Default suggestions if none were generated
    if (suggestions.length === 0) {
      suggestions.push("Check for missing commas, quotes, brackets, or braces");
      suggestions.push("Ensure proper JSON syntax with correct punctuation");
      suggestions.push("Use a JSON validator to identify the specific issue");
    }
    
    const errorMessage = error.message || 'Unknown JSON parsing error';
    errors.push(new ValidationError(
      `JSON Parse Error: ${errorMessage}`,
      line,
      column,
      suggestions
    ));
    
    return { 
      success: false, 
      data: null, 
      errors 
    };
  }
}

/**
 * Parse and validate YAML with enhanced error reporting
 */
export function validateYAML(input) {
  try {
    // Use source map for better error reporting
    const sourceMap = new SourceMap();
    const parsed = yaml.load(input, { 
      listener: sourceMap.listen(),
      filename: 'input.yaml'
    });
    
    return { 
      success: true, 
      data: parsed, 
      errors: [],
      sourceMap 
    };
  } catch (error) {
    const errors = [];
    let line = null;
    let column = null;
    let suggestions = [];
    
    // Extract line/column from YAML error
    if (error.mark) {
      line = error.mark.line + 1; // YAML uses 0-based line numbers
      column = error.mark.column + 1;
    }
    
    // Generate suggestions based on common YAML errors
    let message = error.message;
    
    if (error.name === 'YAMLException') {
      if (message.includes('bad indentation')) {
        suggestions.push("Check your indentation - YAML uses spaces, not tabs");
        suggestions.push("Ensure consistent indentation levels (usually 2 or 4 spaces)");
      }
      
      if (message.includes('unexpected character')) {
        suggestions.push("Check for special characters that need to be quoted");
        suggestions.push("Use quotes around strings containing special characters");
      }
      
      if (message.includes('could not find expected')) {
        suggestions.push("Check for missing closing brackets or quotes");
        suggestions.push("Ensure proper YAML structure with correct nesting");
      }
      
      if (message.includes('found duplicate key')) {
        suggestions.push("Remove or rename duplicate keys in the same object");
      }
      
      if (message.includes('tab character')) {
        suggestions.push("Replace tabs with spaces - YAML doesn't allow tabs for indentation");
      }
    }
    
    const errorMessage = message || error.message || 'Unknown YAML parsing error';
    errors.push(new ValidationError(
      `YAML Parse Error: ${errorMessage}`,
      line,
      column,
      suggestions
    ));
    
    return { 
      success: false, 
      data: null, 
      errors 
    };
  }
}

/**
 * Parse and validate TOML with enhanced error reporting
 */
export function validateTOML(input) {
  try {
    const parsed = TOML.parse(input);
    return { 
      success: true, 
      data: parsed, 
      errors: [] 
    };
  } catch (error) {
    const errors = [];
    let line = null;
    let column = null;
    let suggestions = [];
    
    // Extract line/column from TOML error
    if (error.line !== undefined) {
      line = error.line;
    }
    if (error.col !== undefined) {
      column = error.col;
    }
    
    // Parse error message for position info if not directly available
    const lineMatch = error.message.match(/at row (\d+)/i);
    const columnMatch = error.message.match(/col (\d+)/i);
    
    if (lineMatch && !line) {
      line = parseInt(lineMatch[1]);
    }
    if (columnMatch && !column) {
      column = parseInt(columnMatch[1]);
    }
    
    // Generate suggestions based on common TOML errors
    let message = error.message;
    const lowerMessage = message.toLowerCase();
    
    // Enhanced error handling with more specific suggestions
    if (lowerMessage.includes('unexpected character') || lowerMessage.includes('unexpected token')) {
      if (message.includes('"') || message.includes("'")) {
        suggestions.push("Check string quotes - TOML supports both single and double quotes");
        suggestions.push("Ensure strings are properly closed with matching quotes");
      } else {
        suggestions.push("Check for invalid characters or syntax");
        suggestions.push("Ensure proper TOML key=value format");
        suggestions.push("Use quotes around string values that contain special characters");
      }
    }
    
    if (lowerMessage.includes('expected') || lowerMessage.includes('missing')) {
      if (lowerMessage.includes('=')) {
        suggestions.push("Add an equals sign '=' between the key and value");
        suggestions.push("TOML uses key = value format, not key: value");
      } else if (lowerMessage.includes('newline') || lowerMessage.includes('end')) {
        suggestions.push("Add a newline after the value");
        suggestions.push("Each TOML key-value pair should be on its own line");
      } else {
        suggestions.push("Check the TOML syntax - ensure proper key=value format");
        suggestions.push("Verify that arrays and inline tables are properly formatted");
      }
    }
    
    if (lowerMessage.includes('invalid') || lowerMessage.includes('bad')) {
      if (lowerMessage.includes('date') || lowerMessage.includes('time')) {
        suggestions.push("Use proper date format: YYYY-MM-DD");
        suggestions.push("Use proper datetime format: YYYY-MM-DDTHH:MM:SS or RFC 3339");
        suggestions.push("Example: 2023-12-25T10:30:00Z");
      } else if (lowerMessage.includes('number') || lowerMessage.includes('integer')) {
        suggestions.push("Check number format - no leading zeros allowed (except 0 itself)");
        suggestions.push("Use underscores for readability: 1_000_000");
        suggestions.push("Ensure no invalid characters in numbers");
      } else if (lowerMessage.includes('string')) {
        suggestions.push("Check string escaping and quote matching");
        suggestions.push("Use triple quotes for multi-line strings: \"\"\"text\"\"\"");
      } else if (lowerMessage.includes('boolean')) {
        suggestions.push("Use lowercase: true or false (not True/False)");
      }
    }
    
    if (lowerMessage.includes('duplicate') || lowerMessage.includes('already defined')) {
      suggestions.push("Remove duplicate keys - TOML doesn't allow duplicate keys in the same table");
      suggestions.push("Use different key names or organize into separate tables");
    }
    
    if (lowerMessage.includes('array') || lowerMessage.includes('bracket')) {
      suggestions.push("Check array syntax: [item1, item2, item3]");
      suggestions.push("Ensure arrays contain values of the same type");
      suggestions.push("Use proper comma separation between array elements");
    }
    
    if (lowerMessage.includes('table') || lowerMessage.includes('[')) {
      suggestions.push("Check table header syntax: [table.name]");
      suggestions.push("Ensure table names don't conflict with existing keys");
      suggestions.push("Use [[array.of.tables]] for arrays of tables");
    }
    
    // Check for common JSON-to-TOML conversion issues
    if (input.includes(':') && !input.includes('=')) {
      suggestions.push("TOML uses '=' not ':' for key-value pairs");
      suggestions.push("Convert 'key: value' to 'key = value'");
    }
    
    if (input.includes('{') || input.includes('}')) {
      suggestions.push("TOML doesn't use curly braces for objects");
      suggestions.push("Use [table.name] headers instead of nested objects");
      suggestions.push("Consider using inline tables: table = { key = value }");
    }
    
    // Default suggestions if none were generated
    if (suggestions.length === 0) {
      suggestions.push("Check TOML syntax - use key = value format");
      suggestions.push("Ensure proper data types and formatting");
      suggestions.push("Visit https://toml.io for TOML specification and examples");
    }
    
    const errorMessage = message || error.message || 'Unknown TOML parsing error';
    errors.push(new ValidationError(
      `TOML Parse Error: ${errorMessage}`,
      line,
      column,
      suggestions
    ));
    
    return { 
      success: false, 
      data: null, 
      errors 
    };
  }
}

/**
 * Auto-detect format and validate with enhanced error reporting
 */
export function validateWithDetection(input) {
  if (!input.trim()) {
    return {
      success: false,
      data: null,
      errors: [new ValidationError("Input is empty", 1, 1, ["Please provide some data to validate"])]
    };
  }
  
  const trimmedInput = input.trim();
  
  // Try JSON first (most strict)
  const jsonResult = validateJSON(input);
  if (jsonResult.success) {
    return { ...jsonResult, detectedFormat: 'json' };
  }
  
  // Check for TOML patterns before YAML (since YAML is more permissive)
  const tomlPatterns = [
    /^\s*\[.*\]\s*$/m,           // Section headers like [server]
    /^\s*\w+\s*=\s*.+$/m,        // Key-value pairs like key = "value"
    /^\s*#.*$/m,                 // Comments starting with #
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime format
    /^\s*\[\[.*\]\]\s*$/m        // Array of tables like [[products]]
  ];
  
  const hasTomlPatterns = tomlPatterns.some(pattern => pattern.test(trimmedInput));
  
  if (hasTomlPatterns) {
    const tomlResult = validateTOML(input);
    if (tomlResult.success) {
      return { ...tomlResult, detectedFormat: 'toml' };
    }
  }
  
  // Try YAML
  const yamlResult = validateYAML(input);
  if (yamlResult.success) {
    return { ...yamlResult, detectedFormat: 'yaml' };
  }
  
  // Try TOML as fallback
  const tomlResult = validateTOML(input);
  if (tomlResult.success) {
    return { ...tomlResult, detectedFormat: 'toml' };
  }
  
  // If all fail, determine which format the input most likely intended to be
  // and prioritize those errors
  
  // Check if it looks like JSON (has quotes, colons, and JSON-like structure)
  const looksLikeJSON = (
    trimmedInput.includes('"') && 
    trimmedInput.includes(':') && 
    (trimmedInput.includes('{') || trimmedInput.includes('[') || 
     /"\w+"\s*:/.test(trimmedInput))
  );
  
  // Check if it looks like TOML (has = signs and section headers)
  const looksLikeTOML = (
    trimmedInput.includes('=') && 
    (trimmedInput.includes('[') || /^\w+\s*=/.test(trimmedInput))
  );
  
  // Prioritize errors based on what format it most likely is
  let prioritizedErrors = [];
  
  if (looksLikeJSON) {
    // Show only JSON errors when it clearly looks like JSON
    prioritizedErrors = jsonResult.errors.map(e => {
      const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
      newError.format = 'JSON';
      return newError;
    });
  } else if (looksLikeTOML) {
    // Show TOML errors first, then others
    prioritizedErrors = [
      ...tomlResult.errors.map(e => {
        const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
        newError.format = 'TOML';
        return newError;
      }),
      ...jsonResult.errors.map(e => {
        const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
        newError.format = 'JSON';
        return newError;
      }),
      ...yamlResult.errors.map(e => {
        const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
        newError.format = 'YAML';
        return newError;
      })
    ];
  } else {
    // Default to YAML first (most permissive), then others
    prioritizedErrors = [
      ...yamlResult.errors.map(e => {
        const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
        newError.format = 'YAML';
        return newError;
      }),
      ...jsonResult.errors.map(e => {
        const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
        newError.format = 'JSON';
        return newError;
      }),
      ...tomlResult.errors.map(e => {
        const newError = new ValidationError(e.message, e.line, e.column, e.suggestions);
        newError.format = 'TOML';
        return newError;
      })
    ];
  }
  
  return {
    success: false,
    data: null,
    errors: prioritizedErrors,
    detectedFormat: null
  };
}

/**
 * Validate data against a JSON schema with enhanced error reporting
 */
export function validateWithSchema(data, schema, originalInput = '', format = 'json') {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (valid) {
      return {
        success: true,
        data,
        errors: [],
        validatedFields: getValidatedFields(data, schema)
      };
    }
    
    // Use better-ajv-errors for enhanced error messages
    let errors = [];
    
    try {
      const betterErrors = betterAjvErrors(schema, data, validate.errors, {
        format: 'js', // Return structured errors instead of CLI format
        indent: 2
      });
      
      errors = betterErrors.map(error => {
        const suggestions = generateSchemaErrorSuggestions(error, schema);
        return new ValidationError(
          error.error || error.message || 'Schema validation error',
          error.start?.line,
          error.start?.column,
          suggestions
        );
      });
    } catch (betterErrorsError) {
      // Fallback to basic AJV errors if better-ajv-errors fails
      console.warn('better-ajv-errors failed, using basic errors:', betterErrorsError);
      errors = validate.errors.map(error => {
        const suggestions = generateSchemaErrorSuggestions(error, schema);
        return new ValidationError(
          error.message || 'Schema validation error',
          null,
          null,
          suggestions
        );
      });
    }
    
    return {
      success: false,
      data: null,
      errors,
      validatedFields: getValidatedFields(data, schema)
    };
    
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [new ValidationError(`Schema validation error: ${error.message}`)]
    };
  }
}

/**
 * Get information about validated fields
 */
function getValidatedFields(data, schema) {
  const fields = [];
  
  if (schema.properties && typeof data === 'object' && data !== null) {
    Object.keys(schema.properties).forEach(key => {
      const property = schema.properties[key];
      const value = data[key];
      const isRequired = schema.required?.includes(key) || false;
      const isPresent = value !== undefined;
      
      fields.push({
        name: key,
        type: property.type,
        format: property.format,
        required: isRequired,
        present: isPresent,
        valid: isPresent || !isRequired
      });
    });
  }
  
  return fields;
}

/**
 * Generate suggestions for schema validation errors
 */
function generateSchemaErrorSuggestions(error, schema) {
  const suggestions = [];
  
  if (error.error.includes('should be')) {
    const typeMatch = error.error.match(/should be (\w+)/);
    if (typeMatch) {
      const expectedType = typeMatch[1];
      suggestions.push(`Convert the value to ${expectedType} type`);
      
      if (expectedType === 'string') {
        suggestions.push('Wrap the value in quotes');
      } else if (expectedType === 'number') {
        suggestions.push('Remove quotes if the value is numeric');
      } else if (expectedType === 'boolean') {
        suggestions.push('Use true or false (without quotes)');
      } else if (expectedType === 'array') {
        suggestions.push('Use square brackets: ["item1", "item2"]');
      } else if (expectedType === 'object') {
        suggestions.push('Use curly braces: {"key": "value"}');
      }
    }
  }
  
  // Format-specific suggestions
  if (error.error.includes('format')) {
    if (error.error.includes('email')) {
      suggestions.push('Use a valid email format: user@example.com');
    } else if (error.error.includes('uri')) {
      suggestions.push('Use a valid URL format: https://example.com');
    } else if (error.error.includes('date')) {
      suggestions.push('Use ISO date format: YYYY-MM-DD');
    } else if (error.error.includes('date-time')) {
      suggestions.push('Use ISO datetime format: YYYY-MM-DDTHH:mm:ssZ');
    } else if (error.error.includes('time')) {
      suggestions.push('Use time format: HH:mm:ss');
    } else if (error.error.includes('ipv4')) {
      suggestions.push('Use IPv4 format: 192.168.1.1');
    } else if (error.error.includes('ipv6')) {
      suggestions.push('Use IPv6 format: 2001:db8::1');
    }
  }
  
  if (error.error.includes('additional properties')) {
    suggestions.push('Remove the unexpected property or check for typos');
    suggestions.push('Verify the property name against the schema');
  }
  
  if (error.error.includes('required property')) {
    const propMatch = error.error.match(/required property '(\w+)'/);
    if (propMatch) {
      suggestions.push(`Add the missing property: ${propMatch[1]}`);
    }
  }
  
  if (error.error.includes('should match pattern')) {
    suggestions.push('Check the format of the value against the expected pattern');
    // Add specific pattern suggestions based on common patterns
    if (error.error.includes('phone')) {
      suggestions.push('Use phone format: +1-234-567-8900 or (234) 567-8900');
    } else if (error.error.includes('version')) {
      suggestions.push('Use semantic version format: 1.2.3');
    }
  }
  
  if (error.error.includes('minimum')) {
    const minMatch = error.error.match(/minimum (\d+)/);
    if (minMatch) {
      suggestions.push(`Value must be at least ${minMatch[1]}`);
    }
  }
  
  if (error.error.includes('maximum')) {
    const maxMatch = error.error.match(/maximum (\d+)/);
    if (maxMatch) {
      suggestions.push(`Value must be no more than ${maxMatch[1]}`);
    }
  }
  
  if (error.error.includes('enum')) {
    const enumMatch = error.error.match(/should be equal to one of the allowed values/);
    if (enumMatch) {
      suggestions.push('Use one of the allowed values from the schema');
    }
  }
  
  return suggestions;
}

/**
 * Format error for display with line highlighting
 */
export function formatErrorForDisplay(error, input) {
  if (!error.line) {
    return {
      message: error.message,
      suggestions: error.suggestions || []
    };
  }
  
  const lines = input.split('\n');
  const errorLine = lines[error.line - 1];
  const lineNumber = error.line;
  
  // Create context around the error
  const contextStart = Math.max(0, lineNumber - 3);
  const contextEnd = Math.min(lines.length, lineNumber + 2);
  const contextLines = [];
  
  for (let i = contextStart; i < contextEnd; i++) {
    const isErrorLine = i === lineNumber - 1;
    const prefix = isErrorLine ? '→' : ' ';
    const num = String(i + 1).padStart(3, ' ');
    contextLines.push(`${prefix} ${num} | ${lines[i]}`);
    
    // Add pointer to error column
    if (isErrorLine && error.column) {
      const pointer = ' '.repeat(7 + error.column - 1) + '^';
      contextLines.push(pointer);
    }
  }
  
  return {
    message: error.message,
    line: error.line,
    column: error.column,
    context: contextLines.join('\n'),
    suggestions: error.suggestions || []
  };
} 
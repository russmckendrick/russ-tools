import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import betterAjvErrors from 'better-ajv-errors';
import parseJson from 'json-parse-even-better-errors';
import yaml from 'js-yaml';
import SourceMap from 'js-yaml-source-map';
import * as TOML from '@ltd/j-toml';

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
import {
  jsonSuggestions,
  yamlSuggestions,
  tomlSuggestions,
  generateSchemaErrorSuggestions,
} from './errorSuggestions.js';

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
    
    suggestions = jsonSuggestions(error.message.toLowerCase(), error.message, input);

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
    
    const message = error.message;
    suggestions = yamlSuggestions(error.name, message);

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
    
    const message = error.message;
    suggestions = tomlSuggestions(message, input);

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
export function validateWithSchema(data, schema, _originalInput = '', _format = 'json') {
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
export function formatErrorForDisplay(error, input) {
  if (!error.line) {
    return {
      message: error.message,
      suggestions: error.suggestions || []
    };
  }
  
  const lines = input.split('\n');
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
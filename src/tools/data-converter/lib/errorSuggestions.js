/**
 * The suggestion tables: every "did you mean" string the converter shows,
 * keyed off parser error text. Extracted from validation.js verbatim — the
 * conditions and ordering are behaviour (validation.test.js runs against
 * them), so they moved as one block per format rather than being reshaped.
 */

/** @param {string} errorMsg lower-cased parser message
 *  @param {string} rawMessage the original message
 *  @param {string} input the raw input text */
export function jsonSuggestions(errorMsg, rawMessage, input) {
  const suggestions = [];

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


  return suggestions;
}

/** @param {string} errorName error.name from js-yaml
 *  @param {string} message the parser message */
export function yamlSuggestions(errorName, message) {
  const suggestions = [];

if (errorName === 'YAMLException') {
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


  return suggestions;
}

/** @param {string} message the parser message
 *  @param {string} input the raw input text */
export function tomlSuggestions(message, input) {
  const suggestions = [];
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


  return suggestions;
}

export function generateSchemaErrorSuggestions(error, _schema) {
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

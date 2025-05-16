// Azure Resource Definitions Loader
import resourceDefinitions from '../../../src/azure-naming/azure-name-resourceDefinition.json';
import outOfDocsDefinitions from '../../../src/azure-naming/azure-name-resourceDefinition_out_of_docs.json';

// Convert Go-style regex to JavaScript-compatible regex, with fallback
function goRegexToJs(str, fallback = /.*/) {
  if (!str || typeof str !== 'string' || str.trim() === '') return fallback;
  // Remove wrapping quotes/backticks
  let cleaned = str.trim().replace(/^(["'`])|(["'`])$/g, '');
  // Replace double backslashes with single
  cleaned = cleaned.replace(/\\/g, '\\');
  try {
    return new RegExp(cleaned);
  } catch (e) {
    console.warn('Invalid Go regex for JS RegExp:', str, '->', cleaned, e);
    return fallback;
  }
}

// Merge and process resource definitions
const processDefinitions = (defs) => {
  return defs.reduce((acc, def) => {
    // Convert the definition to our internal format
    const processedDef = {
      type: def.slug,
      maxLength: def.max_length,
      minLength: def.min_length,
      caseSensitive: !def.lowercase,
      validChars: goRegexToJs(def.regex),
      pattern: goRegexToJs(def.validation_regex),
      format: `${def.slug}-[workload]-[environment]-[region]`,
      dashes: def.dashes,
      scope: def.scope
    };

    // Add any special rules based on the resource type
    if (def.name.includes('virtual_machine')) {
      processedDef.maxLength = {
        windows: 15,
        linux: 64
      };
    }

    // Store by both the full name and the slug for easy lookup
    acc[def.name] = processedDef;
    acc[def.slug] = processedDef;
    
    return acc;
  }, {});
};

// Merge both definition files
const allDefinitions = [...resourceDefinitions, ...outOfDocsDefinitions];
export const RESOURCE_DEFINITIONS = processDefinitions(allDefinitions);

// Helper function to get resource definition by type
export const getResourceDefinition = (type) => {
  return RESOURCE_DEFINITIONS[type] || null;
}; 
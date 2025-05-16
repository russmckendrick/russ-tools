// Azure Resource Definitions Loader
import resourceDefinitions from '../../../src/azure-naming/azure-name-resourceDefinition.json';
import outOfDocsDefinitions from '../../../src/azure-naming/azure-name-resourceDefinition_out_of_docs.json';

// Convert Go-style regex to JavaScript-compatible regex for validation (full string)
function goRegexToJsValidation(str, fallback = /.*/) {
  if (!str || typeof str !== 'string' || str.trim() === '') return fallback;
  let cleaned = str.trim().replace(/^(["'`])|(["'`])$/g, '');
  cleaned = cleaned.replace(/\\/g, '\\');
  if (/^\[\^.*\]$/.test(cleaned)) {
    const charSet = cleaned.slice(2, -1);
    cleaned = `^[${charSet}]+$`;
  }
  try {
    return new RegExp(cleaned);
  } catch (e) {
    console.warn('Invalid Go regex for JS RegExp (validation):', str, '->', cleaned, e);
    return fallback;
  }
}

// Convert Go-style regex to JS for cleaning (negated set, global)
function goRegexToJsCleaning(str, fallback = /[^a-zA-Z0-9-._()]/g) {
  if (!str || typeof str !== 'string' || str.trim() === '') return fallback;
  let cleaned = str.trim().replace(/^(["'`])|(["'`])$/g, '');
  cleaned = cleaned.replace(/\\/g, '\\');
  if (/^\[\^.*\]$/.test(cleaned)) {
    // Use as-is, but add global flag
    try {
      return new RegExp(cleaned, 'g');
    } catch (e) {
      console.warn('Invalid Go regex for JS RegExp (cleaning):', str, '->', cleaned, e);
      return fallback;
    }
  }
  // If not a negated set, invert it for cleaning
  if (/^\[.*\]$/.test(cleaned)) {
    const charSet = cleaned.slice(1, -1);
    cleaned = `[^${charSet}]`;
    try {
      return new RegExp(cleaned, 'g');
    } catch (e) {
      console.warn('Invalid Go regex for JS RegExp (cleaning):', str, '->', cleaned, e);
      return fallback;
    }
  }
  return fallback;
}

// Check for duplicate slugs in a definitions array
function hasDuplicateSlugs(defs) {
  const seen = new Set();
  for (const def of defs) {
    if (seen.has(def.slug)) {
      return true;
    }
    seen.add(def.slug);
  }
  return false;
}

// Merge and process resource definitions
const processDefinitions = (defs) => {
  return defs.reduce((acc, def) => {
    // Convert the definition to our internal format
    const cleaningRegex = goRegexToJsCleaning(def.regex);
    const validationRegex = goRegexToJsValidation(def.regex);
    const processedDef = {
      name: def.name,
      type: def.slug,
      maxLength: def.max_length,
      minLength: def.min_length,
      caseSensitive: !def.lowercase,
      validChars: cleaningRegex, // for cleaning
      validPattern: validationRegex, // for validation
      pattern: goRegexToJsValidation(def.validation_regex),
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

// Prefer main resourceDefinitions if there are duplicates
let allDefinitions = [...resourceDefinitions, ...outOfDocsDefinitions];
if (hasDuplicateSlugs(allDefinitions)) {
  console.warn('[Azure Naming] Duplicate slugs detected. Using only azure-name-resourceDefinition.json definitions.');
  allDefinitions = [...resourceDefinitions];
}

export const RESOURCE_DEFINITIONS = processDefinitions(allDefinitions);

// Helper function to get resource definition by type
export const getResourceDefinition = (type) => {
  return RESOURCE_DEFINITIONS[type] || null;
}; 
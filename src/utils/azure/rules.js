// Azure Resource Naming Rules and Configuration

// Import the region parser
// import { getRegionAbbreviation } from './region-parser';
import environments from '../../data/environments.json';
import { RESOURCE_DEFINITIONS, getResourceDefinition } from './resource-definitions';

// Export the resource definitions for external use
export const RESOURCE_TYPES = RESOURCE_DEFINITIONS;

// Validation functions
export const validateResourceName = (name, resourceType) => {
  // Get the rules object
  const rules = getResourceDefinition(resourceType);
  console.log('[validateResourceName] name:', name, 'resourceType:', resourceType, 'rules:', rules);
  if (!rules) return { valid: false, error: 'Invalid resource type' };

  // Check length
  if (typeof rules.maxLength === 'object') {
    const maxLength = rules.maxLength.windows;
    if (name.length > maxLength) {
      console.log('[validateResourceName] FAIL: too long', name.length, '>', maxLength);
      return { valid: false, error: `Name exceeds maximum length of ${maxLength} characters` };
    }
  } else if (name.length > rules.maxLength) {
    console.log('[validateResourceName] FAIL: too long', name.length, '>', rules.maxLength);
    return { valid: false, error: `Name exceeds maximum length of ${rules.maxLength} characters` };
  }

  if (rules.minLength && name.length < rules.minLength) {
    console.log('[validateResourceName] FAIL: too short', name.length, '<', rules.minLength);
    return { valid: false, error: `Name must be at least ${rules.minLength} characters` };
  }

  // Check character validity (use validPattern)
  if (!rules.validPattern.test(name)) {
    const invalidChars = name.split('').filter(c => !rules.validPattern.test(c));
    console.log('[validateResourceName] FAIL: invalid chars', name, 'regex:', rules.validPattern, 'invalid:', invalidChars);
    return {
      valid: false,
      error: `Name contains invalid characters: "${name}". Invalid: [${invalidChars.join(', ')}]. Regex: ${rules.validPattern}`
    };
  }

  // Check pattern
  if (!rules.pattern.test(name)) {
    console.log('[validateResourceName] FAIL: pattern mismatch', name, 'pattern:', rules.pattern);
    return { valid: false, error: 'Name does not match required pattern' };
  }

  console.log('[validateResourceName] PASS:', name);
  return { valid: true };
};

// Helper: Clean a string using the resource's cleaning regex (removes invalid chars)
function cleanString(str, cleaningRegex) {
  if (!str || !cleaningRegex) return str;
  return str.replace(cleaningRegex, '');
}

// Helper: Compose the name using precedence array
function composeName(separator, parts, maxLength, precedence) {
  let contents = [];
  let currentLength = 0;
  let used = { prefixes: false, suffixes: false };

  for (let i = 0; i < precedence.length; i++) {
    const key = precedence[i];
    let initialized = contents.length > 0 ? separator.length : 0;
    switch (key) {
      case 'name':
        if (parts.name && currentLength + parts.name.length + initialized <= maxLength) {
          contents.push(parts.name);
          currentLength += parts.name.length + initialized;
        }
        break;
      case 'slug':
        if (parts.slug && currentLength + parts.slug.length + initialized <= maxLength) {
          contents.unshift(parts.slug);
          currentLength += parts.slug.length + initialized;
        }
        break;
      case 'random':
        if (parts.random && currentLength + parts.random.length + initialized <= maxLength) {
          contents.push(parts.random);
          currentLength += parts.random.length + initialized;
        }
        break;
      case 'suffixes':
        if (!used.suffixes && parts.suffixes && parts.suffixes.length > 0) {
          for (const suffix of parts.suffixes) {
            if (suffix && currentLength + suffix.length + initialized <= maxLength) {
              contents.push(suffix);
              currentLength += suffix.length + initialized;
            }
          }
          used.suffixes = true;
        }
        break;
      case 'prefixes':
        if (!used.prefixes && parts.prefixes && parts.prefixes.length > 0) {
          for (let j = parts.prefixes.length - 1; j >= 0; j--) {
            const prefix = parts.prefixes[j];
            if (prefix && currentLength + prefix.length + initialized <= maxLength) {
              contents.unshift(prefix);
              currentLength += prefix.length + initialized;
            }
          }
          used.prefixes = true;
        }
        break;
    }
  }
  return contents.join(separator);
}

// Helper: Trim to max length
function trimResourceName(resourceName, maxLength) {
  if (resourceName.length > maxLength) {
    return resourceName.substring(0, maxLength);
  }
  return resourceName;
}

// Helper: Generate a random string (if needed)
function randSeq(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Refactored name generation function
export const generateResourceName = (params, shortNames = {}) => {
  let { resourceType, ...rest } = params;
  // If resourceType is composite (slug|name), extract slug
  if (resourceType && resourceType.includes('|')) {
    resourceType = resourceType.split('|')[0];
  }
  const {
    workload,
    environment,
    region, // region slug
    instance = '',
    customPrefix,
    customSuffix,
    separator = '-',
    randomLength = 0 // Optionally support random
  } = rest;

  // Get the rules object
  const rules = getResourceDefinition(resourceType);
  if (!rules) throw new Error('Invalid resource type');

  // Get abbreviations
  const envAbbr = environments[environment]?.abbreviation || environment;
  const regionAbbr = shortNames[region] || region;

  // Clean each part
  const cleanedWorkload = cleanString(workload, rules.regex);
  const cleanedPrefix = customPrefix ? cleanString(customPrefix, rules.regex) : '';
  const cleanedSuffix = customSuffix ? cleanString(customSuffix, rules.regex) : '';
  const cleanedInstance = cleanString(instance, rules.regex);
  const cleanedEnv = cleanString(envAbbr, rules.regex);
  const cleanedRegion = cleanString(regionAbbr, rules.regex);
  const cleanedSeparator = rules.dashes === false ? '' : cleanString(separator, rules.regex);

  // Compose the name parts
  let name = rules.format
    .replace('[workload]', cleanedWorkload)
    .replace('[environment]', cleanedEnv)
    .replace('[region]', cleanedRegion)
    .replace('[instance]', cleanedInstance ? cleanedInstance : '');

  // Add instance number if defined
  if (cleanedInstance) {
    name = `${name}${cleanedSeparator}${cleanedInstance}`;
  }

  // Compose using precedence (default: name, slug, random, suffixes, prefixes)
  const precedence = ['name', 'slug', 'random', 'suffixes', 'prefixes'];
  const slug = rules.type;
  const random = randomLength > 0 ? randSeq(randomLength) : '';
  const parts = {
    name,
    slug,
    random,
    suffixes: cleanedSuffix ? [cleanedSuffix] : [],
    prefixes: cleanedPrefix ? [cleanedPrefix] : []
  };

  let composed = composeName(cleanedSeparator, parts, rules.maxLength, precedence);
  composed = trimResourceName(composed, rules.maxLength);

  // Clean the composed name before validation
  composed = cleanString(composed, rules.regex);

  // Lowercase if required
  if (rules.caseSensitive === true) {
    composed = composed.toLowerCase();
  }

  // Validate the generated name
  const validation = validateResourceName(composed, resourceType);
  if (!validation.valid) {
    throw new Error(`Generated name is invalid: ${validation.error}`);
  }

  return composed;
}; 
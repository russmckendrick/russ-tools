// Azure Resource Naming Rules and Configuration

// Import the region parser
import { getRegionAbbreviation } from './region-parser';
import environments from '../../../src/environments.json';
import { RESOURCE_DEFINITIONS, getResourceDefinition } from './resource-definitions';

// Export the resource definitions for external use
export const RESOURCE_TYPES = RESOURCE_DEFINITIONS;

// Validation functions
export const validateResourceName = (name, resourceType) => {
  // Get the rules object
  const rules = getResourceDefinition(resourceType);
  if (!rules) return { valid: false, error: 'Invalid resource type' };

  // Check length
  if (typeof rules.maxLength === 'object') {
    // Special case for VMs with different Windows/Linux limits
    const maxLength = rules.maxLength.windows; // Default to Windows limit
    if (name.length > maxLength) {
      return { valid: false, error: `Name exceeds maximum length of ${maxLength} characters` };
    }
  } else if (name.length > rules.maxLength) {
    return { valid: false, error: `Name exceeds maximum length of ${rules.maxLength} characters` };
  }

  if (rules.minLength && name.length < rules.minLength) {
    return { valid: false, error: `Name must be at least ${rules.minLength} characters` };
  }

  // Check character validity
  if (!rules.validChars.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  // Check pattern
  if (!rules.pattern.test(name)) {
    return { valid: false, error: 'Name does not match required pattern' };
  }

  return { valid: true };
};

// Name generation function
// Accepts shortNames as an argument for region abbreviation lookup
export const generateResourceName = (params, shortNames = {}) => {
  const {
    resourceType,
    workload,
    environment,
    region, // region slug
    instance = '001',
    customPrefix,
    customSuffix
  } = params;

  // Get the rules object
  const rules = getResourceDefinition(resourceType);
  if (!rules) throw new Error('Invalid resource type');

  // Get abbreviations
  const envAbbr = environments[environment]?.abbreviation || environment;
  const regionAbbr = shortNames[region] || region;

  // Build name according to format
  let name = rules.format
    .replace('[workload]', workload)
    .replace('[environment]', envAbbr)
    .replace('[region]', regionAbbr)
    .replace('[instance]', instance);

  // Apply case sensitivity
  if (rules.caseSensitive === true) {
    name = name.toLowerCase();
  }

  // Add custom prefix/suffix if provided
  if (customPrefix) name = `${customPrefix}-${name}`;
  if (customSuffix) name = `${name}-${customSuffix}`;

  // Validate the generated name
  const validation = validateResourceName(name, resourceType);
  if (!validation.valid) {
    throw new Error(`Generated name is invalid: ${validation.error}`);
  }

  return name;
}; 
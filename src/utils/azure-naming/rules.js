// Azure Resource Naming Rules and Configuration

// Import the region parser
import { getRegionAbbreviation } from './region-parser';

// Resource type definitions with their constraints
export const RESOURCE_TYPES = {
  RESOURCE_GROUP: {
    type: 'rg',
    maxLength: 90,
    caseSensitive: false,
    validChars: /^[a-zA-Z0-9_\-\.\(\)]+$/,
    pattern: /^[a-zA-Z0-9_\-\.\(\)]+$/,
    cantEndWith: ['.'],
    format: 'rg-[workload]-[environment]-[region]'
  },
  VIRTUAL_MACHINE: {
    type: 'vm',
    maxLength: {
      windows: 15,
      linux: 64
    },
    caseSensitive: false,
    validChars: /^[a-zA-Z0-9\-]+$/,
    pattern: /^[a-zA-Z0-9\-]+$/,
    cantStartWith: ['-'],
    cantEndWith: ['-'],
    format: 'vm-[workload]-[environment]-[region]-[instance]'
  },
  STORAGE_ACCOUNT: {
    type: 'st',
    minLength: 3,
    maxLength: 24,
    caseSensitive: true,
    validChars: /^[a-z0-9]+$/,
    pattern: /^[a-z0-9]+$/,
    format: 'st[workload][environment][region][instance]'
  },
  VIRTUAL_NETWORK: {
    type: 'vnet',
    maxLength: 64,
    caseSensitive: false,
    validChars: /^[a-zA-Z0-9_\-\.]+$/,
    pattern: /^[a-zA-Z0-9_\-\.]+$/,
    cantStartWith: ['microsoft'],
    format: 'vnet-[workload]-[environment]-[region]'
  },
  KEY_VAULT: {
    type: 'kv',
    minLength: 3,
    maxLength: 24,
    caseSensitive: false,
    validChars: /^[a-zA-Z0-9\-]+$/,
    pattern: /^[a-zA-Z0-9\-]+$/,
    mustStartWith: ['letter'],
    cantEndWith: ['-'],
    format: 'kv-[workload]-[environment]-[region]'
  },
  SQL_SERVER: {
    type: 'sql',
    maxLength: 63,
    caseSensitive: true,
    validChars: /^[a-z0-9\-]+$/,
    pattern: /^[a-z0-9\-]+$/,
    mustStartWith: ['letter'],
    format: 'sql-[workload]-[environment]-[region]'
  },
  APP_SERVICE: {
    type: 'app',
    maxLength: 60,
    caseSensitive: false,
    validChars: /^[a-zA-Z0-9\-]+$/,
    pattern: /^[a-zA-Z0-9\-]+$/,
    cantStartWith: ['-'],
    cantEndWith: ['-'],
    format: 'app-[workload]-[environment]-[region]'
  },
  FUNCTION_APP: {
    type: 'func',
    maxLength: 60,
    caseSensitive: false,
    validChars: /^[a-zA-Z0-9\-]+$/,
    pattern: /^[a-zA-Z0-9\-]+$/,
    cantStartWith: ['-'],
    cantEndWith: ['-'],
    format: 'func-[workload]-[environment]-[region]'
  }
};

// Environment abbreviations
export const ENVIRONMENT_ABBREVIATIONS = {
  development: 'dev',
  testing: 'test',
  staging: 'stage',
  userAcceptanceTesting: 'uat',
  qualityAssurance: 'qa',
  production: 'prod',
  disasterRecovery: 'dr'
};

// Validation functions
export const validateResourceName = (name, resourceType) => {
  // Find the rules object by type code
  const rules = Object.values(RESOURCE_TYPES).find(def => def.type === resourceType);
  if (!rules) return { valid: false, error: 'Invalid resource type' };

  // Check length
  if (name.length > rules.maxLength) {
    return { valid: false, error: `Name exceeds maximum length of ${rules.maxLength} characters` };
  }

  if (rules.minLength && name.length < rules.minLength) {
    return { valid: false, error: `Name must be at least ${rules.minLength} characters` };
  }

  // Check character validity
  if (!rules.validChars.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  // Check start/end restrictions
  if (rules.cantStartWith && rules.cantStartWith.some(prefix => name.toLowerCase().startsWith(prefix))) {
    return { valid: false, error: `Name cannot start with: ${rules.cantStartWith.join(', ')}` };
  }

  if (rules.cantEndWith && rules.cantEndWith.some(suffix => name.endsWith(suffix))) {
    return { valid: false, error: `Name cannot end with: ${rules.cantEndWith.join(', ')}` };
  }

  if (rules.mustStartWith && rules.mustStartWith.includes('letter') && !/^[a-zA-Z]/.test(name)) {
    return { valid: false, error: 'Name must start with a letter' };
  }

  return { valid: true };
};

// Name generation function
export const generateResourceName = async (params) => {
  const {
    resourceType,
    workload,
    environment,
    region,
    instance = '001',
    customPrefix,
    customSuffix
  } = params;

  // Find the rules object by type code
  const rules = Object.values(RESOURCE_TYPES).find(def => def.type === resourceType);
  if (!rules) throw new Error('Invalid resource type');

  // Get abbreviations
  const envAbbr = ENVIRONMENT_ABBREVIATIONS[environment] || environment;
  const regionAbbr = await getRegionAbbreviation(region);

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
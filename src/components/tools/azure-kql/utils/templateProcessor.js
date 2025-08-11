// Template processor for Azure KQL service templates
import azureFirewallTemplate from '../templates/azure-firewall.json';
import azureApplicationGatewayTemplate from '../templates/azure-application-gateway.json';
import azureVirtualDesktopTemplate from '../templates/azure-virtual-desktop.json';
import baseTemplate from '../templates/base-template.json';

const templates = {
  'azure-firewall': azureFirewallTemplate,
  'azure-application-gateway': azureApplicationGatewayTemplate,
  'azure-virtual-desktop': azureVirtualDesktopTemplate,
  'base': baseTemplate
};

/**
 * Load and process a template with inheritance
 * @param {string} serviceId - The service identifier
 * @param {string} templateId - The template identifier
 * @returns {Promise<Object>} Processed template
 */
export const loadTemplate = async (serviceId) => {
  try {
    const serviceTemplate = templates[serviceId];
    if (!serviceTemplate) {
      throw new Error(`Template not found for service: ${serviceId}`);
    }

    // Apply inheritance from base template
    const processedTemplate = {
      ...baseTemplate,
      ...serviceTemplate,
      schema: {
        ...baseTemplate.schema,
        ...serviceTemplate.schema,
        fields: {
          ...baseTemplate.schema?.fields,
          ...serviceTemplate.schema?.fields
        }
      }
    };

    return processedTemplate;
  } catch (error) {
    console.error('Template loading error:', error);
    throw error;
  }
};

/**
 * Get available services
 * @returns {Array} Array of service configurations
 */
export const getAvailableServices = () => {
  return Object.keys(templates)
    .filter(key => key !== 'base')
    .map(serviceId => {
      const template = templates[serviceId];
      return {
        id: serviceId,
        name: template.service?.name || serviceId,
        description: template.service?.description || '',
        category: template.service?.category || 'General'
      };
    });
};

/**
 * Get available templates for a service
 * @param {string} serviceId - The service identifier
 * @returns {Array} Array of template configurations
 */
export const getServiceTemplates = (serviceId) => {
  const serviceTemplate = templates[serviceId];
  if (!serviceTemplate?.templates) {
    return [];
  }

  return Object.keys(serviceTemplate.templates).map(templateId => ({
    value: templateId,
    label: serviceTemplate.templates[templateId].name,
    description: serviceTemplate.templates[templateId].description
  }));
};

/**
 * Validate template structure comprehensively
 * @param {Object} template - Template to validate
 * @returns {Object} Validation result
 */
export const validateTemplate = (template) => {
  const errors = [];
  const warnings = [];

  // Service validation
  if (!template.service) {
    errors.push('Template missing service configuration');
  } else {
    if (!template.service.id) errors.push('Service ID is required');
    if (!template.service.name) errors.push('Service name is required');
    if (!template.service.description) errors.push('Service description is required');
    if (!template.service.category) warnings.push('Service category is recommended');
    if (!template.service.version) warnings.push('Service version is recommended');
  }

  // Schema validation
  if (!template.schema) {
    errors.push('Template missing schema configuration');
  } else {
    // Tables validation
    if (!template.schema.tables) {
      errors.push('Schema missing tables configuration');
    } else {
      if (!template.schema.tables.primary) {
        errors.push('Schema missing primary table');
      }
    }

    // Fields validation
    if (!template.schema.fields) {
      errors.push('Template missing field definitions');
    } else {
      const fieldCount = Object.keys(template.schema.fields).length;
      if (fieldCount === 0) {
        errors.push('At least one field must be defined');
      }

      // Validate individual fields
      Object.entries(template.schema.fields).forEach(([fieldName, fieldConfig]) => {
        validateFieldConfig(fieldName, fieldConfig, errors, warnings);
      });

      // Check for essential fields
      const hasTimeField = Object.keys(template.schema.fields).some(field => 
        field.toLowerCase().includes('time') || field === 'timeRange'
      );
      if (!hasTimeField) {
        warnings.push('No time-based field found - query performance may be impacted');
      }
    }

    // Filter order validation
    if (template.schema.filterOrder && Array.isArray(template.schema.filterOrder)) {
      const fields = Object.keys(template.schema.fields || {});
      const invalidFilters = template.schema.filterOrder.filter(filter => 
        filter !== 'timeRange' && !fields.includes(filter)
      );
      if (invalidFilters.length > 0) {
        warnings.push(`Filter order references undefined fields: ${invalidFilters.join(', ')}`);
      }
    }
  }

  // Templates validation
  if (!template.templates) {
    errors.push('Template missing query templates');
  } else {
    const templateCount = Object.keys(template.templates).length;
    if (templateCount === 0) {
      warnings.push('No query templates defined');
    }

    // Validate individual query templates
    Object.entries(template.templates).forEach(([templateId, templateConfig]) => {
      validateQueryTemplate(templateId, templateConfig, template.schema, errors, warnings);
    });
  }

  // Query examples validation
  if (template.queryExamples) {
    Object.entries(template.queryExamples).forEach(([exampleId, exampleConfig]) => {
      if (!exampleConfig.name) warnings.push(`Query example '${exampleId}' missing name`);
      if (!exampleConfig.query) errors.push(`Query example '${exampleId}' missing query`);
      if (!exampleConfig.description) warnings.push(`Query example '${exampleId}' missing description`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: calculateTemplateScore(template, errors, warnings)
  };
};

/**
 * Validate field configuration
 * @param {string} fieldName - Field name
 * @param {Object} fieldConfig - Field configuration
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateFieldConfig = (fieldName, fieldConfig, errors, warnings) => {
  // Required properties
  if (!fieldConfig.type) {
    errors.push(`Field '${fieldName}' missing type`);
  } else {
    // Validate type-specific properties
    const validTypes = ['string', 'number', 'ipaddress', 'datetime', 'select', 'multiselect'];
    if (!validTypes.includes(fieldConfig.type)) {
      warnings.push(`Field '${fieldName}' has unknown type: ${fieldConfig.type}`);
    }

    // Type-specific validation
    switch (fieldConfig.type) {
      case 'number':
        if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
          if (fieldConfig.min >= fieldConfig.max) {
            errors.push(`Field '${fieldName}' min value must be less than max value`);
          }
        }
        break;
      case 'select':
      case 'multiselect':
        if (!fieldConfig.options || !Array.isArray(fieldConfig.options)) {
          errors.push(`Field '${fieldName}' must have options array`);
        } else if (fieldConfig.options.length === 0) {
          warnings.push(`Field '${fieldName}' has empty options array`);
        }
        break;
    }
  }

  if (!fieldConfig.description) {
    warnings.push(`Field '${fieldName}' missing description`);
  }

  if (!fieldConfig.kqlField) {
    warnings.push(`Field '${fieldName}' missing kqlField mapping`);
  }

  // Category validation
  if (fieldConfig.category) {
    const validCategories = ['network', 'http', 'security', 'performance', 'routing', 'action', 'rule', 'application', 'system'];
    if (!validCategories.includes(fieldConfig.category)) {
      warnings.push(`Field '${fieldName}' has unknown category: ${fieldConfig.category}`);
    }
  }
};

/**
 * Validate query template configuration
 * @param {string} templateId - Template ID
 * @param {Object} templateConfig - Template configuration
 * @param {Object} schema - Service schema
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateQueryTemplate = (templateId, templateConfig, schema, errors, warnings) => {
  if (!templateConfig.name) {
    errors.push(`Query template '${templateId}' missing name`);
  }

  if (!templateConfig.description) {
    warnings.push(`Query template '${templateId}' missing description`);
  }

  if (!templateConfig.table) {
    errors.push(`Query template '${templateId}' missing table`);
  } else {
    // Validate table exists in schema
    const availableTables = [
      schema?.tables?.primary,
      ...(schema?.tables?.secondary || []),
      schema?.tables?.legacy
    ].filter(Boolean);

    if (!availableTables.includes(templateConfig.table)) {
      warnings.push(`Query template '${templateId}' references unknown table: ${templateConfig.table}`);
    }
  }

  // Validate default parameters
  if (templateConfig.defaultParameters) {
    const schemaFields = Object.keys(schema?.fields || {});
    Object.keys(templateConfig.defaultParameters).forEach(param => {
      if (param !== 'timeRange' && param !== 'limit' && !schemaFields.includes(param)) {
        warnings.push(`Query template '${templateId}' has unknown default parameter: ${param}`);
      }
    });
  }

  // Validate common filters
  if (templateConfig.commonFilters) {
    const schemaFields = Object.keys(schema?.fields || {});
    const invalidFilters = templateConfig.commonFilters.filter(filter => !schemaFields.includes(filter));
    if (invalidFilters.length > 0) {
      warnings.push(`Query template '${templateId}' references unknown fields in commonFilters: ${invalidFilters.join(', ')}`);
    }
  }
};

/**
 * Calculate template quality score
 * @param {Object} template - Template object
 * @param {Array} errors - Validation errors
 * @param {Array} warnings - Validation warnings
 * @returns {number} Score from 0-100
 */
const calculateTemplateScore = (template, errors, warnings) => {
  let score = 100;

  // Deduct for errors (critical issues)
  score -= errors.length * 20;

  // Deduct for warnings (quality issues)
  score -= warnings.length * 5;

  // Bonus points for completeness
  if (template.service?.documentation) score += 5;
  if (template.queryExamples && Object.keys(template.queryExamples).length > 0) score += 10;
  if (template.schema?.filterOrder) score += 5;

  // Field completeness bonus
  const fields = template.schema?.fields || {};
  const fieldCount = Object.keys(fields).length;
  if (fieldCount >= 5) score += 5;
  if (fieldCount >= 10) score += 5;

  // Template completeness bonus
  const templates = template.templates || {};
  const templateCount = Object.keys(templates).length;
  if (templateCount >= 3) score += 5;
  if (templateCount >= 5) score += 5;

  return Math.max(0, Math.min(100, score));
};
// Template processor for Azure KQL service templates
import azureFirewallTemplate from '../templates/azure-firewall.json';
import baseTemplate from '../templates/base-template.json';

const templates = {
  'azure-firewall': azureFirewallTemplate,
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
    id: templateId,
    name: serviceTemplate.templates[templateId].name,
    description: serviceTemplate.templates[templateId].description
  }));
};

/**
 * Validate template structure
 * @param {Object} template - Template to validate
 * @returns {Object} Validation result
 */
export const validateTemplate = (template) => {
  const errors = [];

  if (!template.service) {
    errors.push('Template missing service configuration');
  }

  if (!template.schema) {
    errors.push('Template missing schema configuration');
  }

  if (!template.schema?.fields) {
    errors.push('Template missing field definitions');
  }

  if (!template.templates) {
    errors.push('Template missing query templates');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
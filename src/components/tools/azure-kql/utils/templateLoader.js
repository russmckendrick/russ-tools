import azureFirewall from '../templates/azure-firewall.json';
import azureVirtualDesktop from '../templates/azure-virtual-desktop.json';
import azureApplicationGateway from '../templates/azure-application-gateway.json';

const TEMPLATE_CACHE = new Map();

const TEMPLATES = {
  'azure-firewall': azureFirewall,
  'azure-virtual-desktop': azureVirtualDesktop,
  'azure-application-gateway': azureApplicationGateway
};

export function loadTemplate(service, templateName) {
  const cacheKey = `${service}:${templateName}`;
  
  if (TEMPLATE_CACHE.has(cacheKey)) {
    return TEMPLATE_CACHE.get(cacheKey);
  }
  
  const serviceTemplates = TEMPLATES[service];
  if (!serviceTemplates) {
    console.warn(`No templates found for service: ${service}`);
    return null;
  }
  
  const template = serviceTemplates.templates?.[templateName];
  if (!template) {
    console.warn(`Template not found: ${templateName} in service: ${service}`);
    return null;
  }
  
  const mergedTemplate = {
    ...serviceTemplates.service,
    ...template,
    fields: mergeFields(serviceTemplates.schema?.fields || {}, template.fields)
  };
  
  TEMPLATE_CACHE.set(cacheKey, mergedTemplate);
  return mergedTemplate;
}

function mergeFields(schemaFields = {}, templateFields = []) {
  const fields = [];
  
  // Add timeRange as the first field for all templates
  fields.push({
    name: 'timeRange',
    label: 'Time Range',
    type: 'timeRange',
    essential: true,
    required: true,
    kqlField: 'TimeGenerated'
  });
  
  // Convert schema fields to component format
  for (const [fieldName, fieldSchema] of Object.entries(schemaFields)) {
    if (fieldName === 'limit') continue; // Handle separately
    
    let fieldType = 'text';
    let options = null;
    
    switch (fieldSchema.type) {
      case 'ipaddress':
        fieldType = 'ip';
        break;
      case 'number':
        fieldType = 'number';
        break;
      case 'select':
        fieldType = 'select';
        options = fieldSchema.options;
        break;
    }
    
    // Handle special enum fields
    if (fieldName === 'Action') {
      fieldType = 'select';
      options = [
        { value: 'Allow', label: 'Allow' },
        { value: 'Deny', label: 'Deny' },
        { value: 'DNAT', label: 'DNAT' }
      ];
    } else if (fieldName === 'Protocol') {
      fieldType = 'select';
      options = [
        { value: 'TCP', label: 'TCP' },
        { value: 'UDP', label: 'UDP' },
        { value: 'ICMP', label: 'ICMP' },
        { value: 'Any', label: 'Any' }
      ];
    }
    
    fields.push({
      name: fieldName,
      label: fieldName.replace(/([A-Z])/g, ' $1').trim(),
      type: fieldType,
      kqlField: fieldSchema.kqlField || fieldName,
      essential: fieldName === 'Action' || fieldName === 'SourceIp' || fieldName === 'DestinationIp',
      required: false,
      placeholder: fieldSchema.examples?.[0],
      description: fieldSchema.description,
      min: fieldSchema.min,
      max: fieldSchema.max,
      options
    });
  }
  
  // Add limit field
  fields.push({
    name: 'limit',
    label: 'Limit Results',
    type: 'number',
    essential: false,
    required: false,
    min: 1,
    max: 10000,
    placeholder: '100'
  });
  
  // Merge with any template-specific field overrides
  for (const templateField of templateFields || []) {
    const existingIndex = fields.findIndex(f => f.name === templateField.name);
    if (templateField && templateField.exclude) {
      if (existingIndex >= 0) {
        fields.splice(existingIndex, 1);
      }
      continue;
    }
    if (existingIndex >= 0) {
      fields[existingIndex] = { ...fields[existingIndex], ...templateField };
    } else {
      fields.push(templateField);
    }
  }
  
  return fields;
}

export function getServiceList() {
  return Object.keys(TEMPLATES).map(key => {
    const template = TEMPLATES[key];
    return {
      id: key,
      name: template.service?.name || key,
      description: template.service?.description || '',
      icon: template.service?.icon || 'Database'
    };
  });
}

export function getTemplateList(service) {
  const serviceTemplates = TEMPLATES[service];
  if (!serviceTemplates || !serviceTemplates.templates) {
    return [];
  }
  
  return Object.entries(serviceTemplates.templates).map(([key, template]) => ({
    id: key,
    name: template.name || key,
    description: template.description || '',
    category: template.category || 'General'
  }));
}

export function getCustomTemplates() {
  const stored = localStorage.getItem('azure-kql-custom-templates');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template) {
  const templates = getCustomTemplates();
  const existing = templates.findIndex(t => t.id === template.id);
  
  if (existing >= 0) {
    templates[existing] = template;
  } else {
    templates.push(template);
  }
  
  localStorage.setItem('azure-kql-custom-templates', JSON.stringify(templates));
  return template;
}

export function deleteCustomTemplate(id) {
  const templates = getCustomTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem('azure-kql-custom-templates', JSON.stringify(filtered));
}
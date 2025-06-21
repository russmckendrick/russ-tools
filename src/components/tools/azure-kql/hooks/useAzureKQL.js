import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { generateKQLQuery } from '../utils/kqlGenerator';
import { validateParameters } from '../utils/parameterValidator';
import { loadTemplate } from '../utils/templateProcessor';

export const useAzureKQL = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedService, setSelectedService] = useState('azure-firewall');
  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [parameters, setParameters] = useState({});
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [queryHistory, setQueryHistory] = useLocalStorage({
    key: 'azure-kql-history',
    defaultValue: []
  });

  // Load configuration from URL parameters on mount
  useEffect(() => {
    const configParam = searchParams.get('config');
    if (configParam) {
      try {
        const config = JSON.parse(atob(configParam));
        if (config.service) setSelectedService(config.service);
        if (config.template) setSelectedTemplate(config.template);
        if (config.parameters) setParameters(config.parameters);
      } catch (error) {
        console.error('Failed to load config from URL:', error);
        notifications.show({
          title: 'URL Config Error',
          message: 'Failed to load configuration from URL',
          color: 'orange'
        });
      }
    }
  }, [searchParams]);

  // Load template when service changes
  useEffect(() => {
    const loadServiceTemplate = async () => {
      try {
        const template = await loadTemplate(selectedService);
        setCurrentTemplate(template);
        
        // Reset template to first available when service changes
        const availableTemplates = Object.keys(template?.templates || {});
        if (availableTemplates.length > 0 && !availableTemplates.includes(selectedTemplate)) {
          setSelectedTemplate(availableTemplates[0]);
        }
      } catch (error) {
        console.error('Failed to load template:', error);
        notifications.show({
          title: 'Template Load Error',
          message: `Failed to load template for ${selectedService}`,
          color: 'red'
        });
      }
    };

    loadServiceTemplate();
  }, [selectedService]);

  // Update parameters when template changes
  useEffect(() => {
    if (currentTemplate?.templates?.[selectedTemplate]?.defaultParameters) {
      const defaults = currentTemplate.templates[selectedTemplate].defaultParameters;
      // Clean up any placeholder values
      const cleanDefaults = Object.entries(defaults).reduce((acc, [key, value]) => {
        if (typeof value === 'string' && (value.includes('<replace') || value === '[object Object]')) {
          // Skip placeholder values
          return acc;
        }
        acc[key] = value;
        return acc;
      }, {});
      setParameters(cleanDefaults);
    }
  }, [currentTemplate, selectedTemplate]);

  // Validate and fix parameters when service changes
  useEffect(() => {
    if (currentTemplate?.schema?.fields) {
      setParameters(prevParams => {
        const validatedParams = { ...prevParams };
        const fields = currentTemplate.schema.fields;
        
        Object.keys(validatedParams).forEach(paramName => {
          const fieldConfig = fields[paramName];
          const paramValue = validatedParams[paramName];
          
          // If field exists in new template, validate it
          if (fieldConfig) {
            // For select fields, ensure the value is in the options
            if (fieldConfig.type === 'select' && fieldConfig.options) {
              if (!fieldConfig.options.includes(paramValue)) {
                // Use template default or first option
                validatedParams[paramName] = fieldConfig.default || fieldConfig.options[0];
              }
            }
          }
        });
        
        return validatedParams;
      });
    }
  }, [currentTemplate]);

  // Update a single parameter
  const updateParameter = useCallback((key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Generate KQL query
  const generateQuery = useCallback(() => {
    if (!currentTemplate) {
      notifications.show({
        title: 'No Template',
        message: 'Please select a service and template first',
        color: 'orange'
      });
      return;
    }

    try {
      // Validate parameters
      const validation = validateParameters(parameters, currentTemplate);
      if (!validation.isValid) {
        notifications.show({
          title: 'Validation Error',
          message: validation.errors.join(', '),
          color: 'red'
        });
        return;
      }

      // Generate query
      const query = generateKQLQuery(currentTemplate, parameters, selectedTemplate);
      setGeneratedQuery(query);

      notifications.show({
        title: 'Query Generated',
        message: 'KQL query has been generated successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Query generation error:', error);
      notifications.show({
        title: 'Generation Error',
        message: 'Failed to generate KQL query',
        color: 'red'
      });
    }
  }, [currentTemplate, parameters, selectedTemplate]);

  // Save query to history
  const saveQuery = useCallback((queryData) => {
    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      service: selectedService,
      template: selectedTemplate,
      parameters: { ...parameters },
      query: generatedQuery,
      name: queryData?.name || `${selectedService} Query`,
      ...queryData
    };

    setQueryHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 queries
    
    notifications.show({
      title: 'Query Saved',
      message: 'Query has been saved to history',
      color: 'green'
    });
  }, [selectedService, selectedTemplate, parameters, generatedQuery, setQueryHistory]);

  // Load query from history or favorites
  const loadQuery = useCallback((queryData) => {
    setSelectedService(queryData.service);
    setSelectedTemplate(queryData.template);
    setParameters(queryData.parameters);
    setGeneratedQuery(queryData.query);

    const source = queryData.name ? 'favorites' : 'history';
    notifications.show({
      title: 'Query Loaded',
      message: `Query has been loaded from ${source}`,
      color: 'blue'
    });
  }, []);

  // Generate shareable URL
  const generateShareableURL = useCallback(() => {
    // Only include simple string/number parameters to avoid circular references
    const safeParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const config = {
      service: selectedService,
      template: selectedTemplate,
      parameters: safeParameters
    };
    
    try {
      const encodedConfig = btoa(safeStringify(config));
      const currentUrl = window.location.origin + window.location.pathname;
      const shareableUrl = `${currentUrl}?config=${encodedConfig}`;
      
      return shareableUrl;
    } catch (error) {
      console.error('Failed to generate shareable URL:', error);
      notifications.show({
        title: 'URL Generation Error',
        message: 'Failed to generate shareable URL',
        color: 'red'
      });
      return null;
    }
  }, [selectedService, selectedTemplate, parameters]);

  // Safe JSON stringify that handles circular references
  const safeStringify = (obj) => {
    const seen = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      // Skip function values and complex objects
      if (typeof value === 'function' || 
          (typeof value === 'object' && value !== null && value.constructor && value.constructor.name !== 'Object' && value.constructor.name !== 'Array')) {
        return undefined;
      }
      return value;
    });
  };

  // Update URL with current configuration
  const updateURL = useCallback(() => {
    // Only include simple string/number parameters to avoid circular references
    const safeParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const config = {
      service: selectedService,
      template: selectedTemplate,
      parameters: safeParameters
    };
    
    try {
      const encodedConfig = btoa(safeStringify(config));
      setSearchParams({ config: encodedConfig }, { replace: true });
    } catch (error) {
      console.error('Failed to update URL:', error);
      // Don't update URL if there's an error
    }
  }, [selectedService, selectedTemplate, parameters, setSearchParams]);

  // Reset form
  const resetForm = useCallback(() => {
    setParameters({});
    setGeneratedQuery('');
    
    // Clear URL parameters
    setSearchParams({}, { replace: true });
    
    // Reset to template defaults if available
    if (currentTemplate?.templates?.[selectedTemplate]?.defaultParameters) {
      setParameters(currentTemplate.templates[selectedTemplate].defaultParameters);
    }
  }, [currentTemplate, selectedTemplate, setSearchParams]);

  // Update URL when significant state changes occur (disabled for now to prevent circular reference errors)
  // useEffect(() => {
  //   // Only update URL if we have meaningful parameters
  //   if (Object.keys(parameters).length > 0 || selectedService !== 'azure-virtual-desktop' || selectedTemplate !== 'ip-addresses-analysis') {
  //     updateURL();
  //   }
  // }, [selectedService, selectedTemplate, parameters, updateURL]);

  // Custom setSelectedService that resets template
  const handleSetSelectedService = useCallback((service) => {
    setSelectedService(service);
    // Reset parameters when service changes
    setParameters({});
    setGeneratedQuery('');
  }, []);

  return {
    selectedService,
    selectedTemplate,
    parameters,
    generatedQuery,
    currentTemplate,
    queryHistory,
    setSelectedService: handleSetSelectedService,
    setSelectedTemplate,
    updateParameter,
    generateQuery,
    saveQuery,
    loadQuery,
    resetForm,
    generateShareableURL,
    updateURL
  };
};
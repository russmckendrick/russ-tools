import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../../../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { generateKQLQuery } from '../utils/kqlGenerator';
import { validateParameters } from '../utils/parameterValidator';
import { loadTemplate } from '../utils/templateProcessor';
import { generateShareableURL, parseConfigFromURL, updateURLWithConfig } from '../../../../utils/sharelink';

export const useAzureKQLShadcn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedService, setSelectedService] = useState('azure-firewall');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [parameters, setParameters] = useState({});
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [queryHistory, setQueryHistory] = useLocalStorage({
    key: 'azure-kql-history',
    defaultValue: []
  });

  // Load configuration from URL parameters on mount
  useEffect(() => {
    const config = parseConfigFromURL(searchParams);
    if (config) {
      if (config.service) setSelectedService(config.service);
      if (config.template) setSelectedTemplate(config.template);
      if (config.parameters) setParameters(config.parameters);
    }
  }, [searchParams]);

  // Load template when service changes
  useEffect(() => {
    const loadServiceTemplate = async () => {
      try {
        const template = await loadTemplate(selectedService);
        setCurrentTemplate(template);
        
        // Set template to first available when service changes or no template is selected
        const availableTemplates = Object.keys(template?.templates || {});
        if (availableTemplates.length > 0 && (!selectedTemplate || !availableTemplates.includes(selectedTemplate))) {
          setSelectedTemplate(availableTemplates[0]);
        }
      } catch (error) {
        console.error('Failed to load template:', error);
        toast.error('Template Load Error', {
          description: `Failed to load template for ${selectedService}`
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
      
      // Merge with existing parameters instead of replacing them
      setParameters(prevParams => ({
        ...cleanDefaults,
        ...prevParams  // URL parameters take precedence over defaults
      }));
    }
  }, [currentTemplate, selectedTemplate, setParameters]);

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

  // Update parameter
  const updateParameter = useCallback((paramName, value) => {
    setParameters(prev => ({ ...prev, [paramName]: value }));
  }, []);

  // Generate KQL query
  const generateQuery = useCallback(() => {
    if (!currentTemplate || !selectedTemplate) {
      toast.error('Template Not Loaded', {
        description: 'Please wait for the template to load or select a valid template'
      });
      return;
    }

    const validation = validateParameters(parameters, currentTemplate.schema);
    if (!validation.isValid) {
      toast.error('Invalid Parameters', {
        description: validation.errors.join(', ')
      });
      return;
    }

    try {
      const query = generateKQLQuery(
        currentTemplate.templates[selectedTemplate],
        parameters,
        currentTemplate
      );
      
      setGeneratedQuery(query);
      
      // Add to history
      const historyEntry = {
        id: Date.now().toString(),
        query,
        service: selectedService,
        template: selectedTemplate,
        parameters: { ...parameters },
        timestamp: new Date().toISOString()
      };
      
      setQueryHistory(prev => [historyEntry, ...prev.slice(0, 49)]);
      
      // Update URL with current configuration
      updateURLWithConfig(searchParams, setSearchParams, {
        service: selectedService,
        template: selectedTemplate,
        parameters
      });
      
      toast.success('Query Generated', {
        description: 'KQL query has been generated successfully'
      });
    } catch (error) {
      console.error('Failed to generate query:', error);
      toast.error('Generation Failed', {
        description: error.message || 'Failed to generate KQL query'
      });
    }
  }, [currentTemplate, selectedTemplate, parameters, selectedService, searchParams, setSearchParams, setQueryHistory]);

  // Save query
  const saveQuery = useCallback((format) => {
    if (!generatedQuery) {
      toast.warning('No Query', {
        description: 'Generate a query first before saving'
      });
      return;
    }

    const filename = `kql-query-${selectedService}-${Date.now()}.${format}`;
    const blob = new Blob([generatedQuery], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Query Saved', {
      description: `Query saved as ${filename}`
    });
  }, [generatedQuery, selectedService]);

  // Load query from history or favorites
  const loadQuery = useCallback((entry) => {
    setSelectedService(entry.service);
    setSelectedTemplate(entry.template);
    setParameters(entry.parameters);
    setGeneratedQuery(entry.query);
    
    toast.success('Query Loaded', {
      description: 'Query configuration has been loaded'
    });
  }, []);

  return {
    selectedService,
    selectedTemplate,
    parameters,
    generatedQuery,
    currentTemplate,
    queryHistory,
    setSelectedService,
    setSelectedTemplate,
    updateParameter,
    generateQuery,
    saveQuery,
    loadQuery,
    generateShareableURL
  };
};
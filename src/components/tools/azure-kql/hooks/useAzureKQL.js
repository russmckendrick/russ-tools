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

  // Load template when service or template changes
  useEffect(() => {
    const loadServiceTemplate = async () => {
      try {
        const template = await loadTemplate(selectedService);
        setCurrentTemplate(template);
        
        // Set default parameters from template
        if (template?.templates?.[selectedTemplate]?.defaultParameters) {
          setParameters(prev => ({
            ...template.templates[selectedTemplate].defaultParameters,
            ...prev
          }));
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
  }, [selectedService, selectedTemplate]);

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
    const config = {
      service: selectedService,
      template: selectedTemplate,
      parameters: parameters
    };
    
    try {
      const encodedConfig = btoa(JSON.stringify(config));
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

  // Update URL with current configuration
  const updateURL = useCallback(() => {
    const config = {
      service: selectedService,
      template: selectedTemplate,
      parameters: parameters
    };
    
    try {
      const encodedConfig = btoa(JSON.stringify(config));
      setSearchParams({ config: encodedConfig }, { replace: true });
    } catch (error) {
      console.error('Failed to update URL:', error);
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

  // Update URL when significant state changes occur
  useEffect(() => {
    // Only update URL if we have meaningful parameters
    if (Object.keys(parameters).length > 0 || selectedService !== 'azure-firewall' || selectedTemplate !== 'basic') {
      updateURL();
    }
  }, [selectedService, selectedTemplate, parameters, updateURL]);

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
    resetForm,
    generateShareableURL,
    updateURL
  };
};
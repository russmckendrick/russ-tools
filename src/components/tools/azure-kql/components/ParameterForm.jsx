import React, { useState, useEffect, useCallback } from 'react';
import { 
  Stack, 
  Text, 
  TextInput, 
  NumberInput, 
  Select, 
  MultiSelect,
  Button, 
  Accordion,
  Group,
  Badge,
  Tooltip,
  Alert
} from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { loadTemplate, getServiceTemplates } from '../utils/templateProcessor';
import { validateParameters } from '../utils/parameterValidator';

const ParameterForm = ({ 
  service, 
  template, 
  parameters, 
  onParameterChange, 
  onTemplateChange,
  onGenerate 
}) => {
  const [serviceTemplate, setServiceTemplate] = useState(null);
  const [validation, setValidation] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Load template when service changes
  useEffect(() => {
    if (service) {
      loadTemplate(service)
        .then(setServiceTemplate)
        .catch(console.error);
      
      setTemplates(getServiceTemplates(service));
    }
  }, [service]);

  // Update templates when service changes
  useEffect(() => {
    if (service) {
      const serviceTemplates = getServiceTemplates(service);
      setTemplates(serviceTemplates);
    }
  }, [service]);

  // Only validate when generating query, not on every parameter change
  const validateOnDemand = useCallback(() => {
    if (serviceTemplate && parameters) {
      const validationResult = validateParameters(parameters, serviceTemplate);
      validationResult.hasBeenValidated = true;
      setValidation(validationResult);
      return validationResult;
    }
    return { isValid: true, errors: [], warnings: [], hasBeenValidated: false };
  }, [serviceTemplate, parameters]);

  const handleParameterChange = (field, value) => {
    onParameterChange(field, value);
  };

  const handleGenerate = () => {
    const currentValidation = validateOnDemand();
    if (currentValidation.isValid) {
      onGenerate();
    }
  };

  const renderField = (fieldName, fieldConfig) => {
    const value = parameters[fieldName] || '';
    
    // Clean up placeholder values
    const cleanValue = (() => {
      if (typeof value === 'string') {
        if (value.includes('<replace') || value === '[object Object]' || value.startsWith('[object')) {
          return '';
        }
      }
      if (typeof value === 'object' && value !== null) {
        return '';
      }
      return value;
    })();
    
    // Only show validation errors when not actively typing (no real-time validation)
    const fieldErrors = [];
    const fieldWarnings = [];
    const hasError = false;
    const hasWarning = false;
    
    // Get specific error message for this field
    const errorMessage = null;
    const warningMessage = null;
    
    const commonProps = {
      label: (
        <Group gap="xs">
          <Text size="sm">{fieldConfig.description || fieldName}</Text>
          {fieldConfig.required && <Text size="xs" c="red">*</Text>}
        </Group>
      ),
      value: cleanValue,
      onChange: (event) => {
        const newValue = event?.target?.value !== undefined ? event.target.value : event;
        handleParameterChange(fieldName, newValue);
      },
      error: errorMessage,
      placeholder: Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 ? fieldConfig.examples[0] : `Enter ${fieldName}`,
      description: warningMessage || (Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 ? `Example: ${fieldConfig.examples[0]}` : undefined)
    };

    switch (fieldConfig.type) {
      case 'number':
        return (
          <NumberInput
            key={fieldName}
            {...commonProps}
            min={fieldConfig.min}
            max={fieldConfig.max}
            onChange={(val) => handleParameterChange(fieldName, val)}
          />
        );

      case 'select':
        // Prepare select data with labels
        let selectData = fieldConfig.options || [];
        if (fieldConfig.optionLabels) {
          selectData = fieldConfig.options.map(value => ({
            value: value,
            label: fieldConfig.optionLabels[value] || value
          }));
        }
        
        // Special handling for limit field with custom option
        if (fieldName === 'limit') {
          return (
            <Stack key={fieldName} gap="xs">
              <Select
                {...commonProps}
                data={selectData}
                clearable
                searchable={selectData.length > 5}
                onChange={(value) => handleParameterChange(fieldName, value)}
              />
              {/* Show custom input when "custom" is selected */}
              {parameters[fieldName] === 'custom' && (
                <NumberInput
                  label="Custom limit"
                  placeholder="Enter custom number of results"
                  min={1}
                  max={100000}
                  value={parameters[`${fieldName}_custom`] || ''}
                  onChange={(val) => handleParameterChange(`${fieldName}_custom`, val)}
                  description="Enter a custom number between 1 and 100,000"
                />
              )}
            </Stack>
          );
        }
        
        return (
          <Select
            key={fieldName}
            {...commonProps}
            data={selectData}
            clearable
            searchable={selectData.length > 5}
            onChange={(value) => handleParameterChange(fieldName, value)}
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
            key={fieldName}
            {...commonProps}
            data={fieldConfig.options || []}
            clearable
            searchable={fieldConfig.options?.length > 5}
          />
        );

      case 'datetime':
        if (fieldName === 'timeRange' || fieldName === 'TimeGenerated') {
          return (
            <Select
              key={fieldName}
              {...commonProps}
              data={[
                { value: '1h', label: 'Last 1 hour' },
                { value: '6h', label: 'Last 6 hours' },
                { value: '24h', label: 'Last 24 hours' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
              ]}
              placeholder="Select time range"
            />
          );
        }
        return (
          <TextInput
            key={fieldName}
            {...commonProps}
            placeholder="e.g., 24h, 7d, or 2023-01-01"
            onChange={(event) => {
              const value = event.currentTarget.value;
              handleParameterChange(fieldName, value);
            }}
          />
        );

      default:
        return (
          <TextInput 
            key={fieldName} 
            {...commonProps}
            onChange={(event) => {
              const value = event.currentTarget.value;
              handleParameterChange(fieldName, value);
            }}
          />
        );
    }
  };

  if (!service) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        Please select an Azure service to configure query parameters.
      </Alert>
    );
  }

  if (!serviceTemplate) {
    return (
      <Text c="dimmed">Loading template...</Text>
    );
  }

  const fields = serviceTemplate.schema?.fields || {};
  
  // Determine essential fields based on service type
  let essentialFields = ['timeRange', 'limit'];
  if (service === 'azure-firewall') {
    essentialFields = ['timeRange', 'limit', 'Action', 'SourceIp', 'DestinationIp'];
  } else if (service === 'azure-virtual-desktop') {
    essentialFields = ['timeRange', 'limit', 'UserName', 'State', 'ClientIPAddress'];
  } else if (service === 'azure-application-gateway') {
    essentialFields = ['timeRange', 'limit', 'RequestUri', 'HttpStatus', 'ClientIP'];
  } else if (service === 'multi-service-correlation') {
    essentialFields = ['timeRange', 'limit', 'services', 'sourceIp', 'destinationIp'];
  }
  
  const advancedFields = Object.keys(fields).filter(f => !essentialFields.includes(f));

  return (
    <Stack gap="md">
      {/* Template Selector */}
      {templates.length > 0 && (
        <Select
          label="Query Template"
          data={templates.map(t => ({ value: t.id, label: t.name }))}
          value={template}
          onChange={(val) => {
            if (onTemplateChange) {
              onTemplateChange(val);
            }
          }}
          description="Choose a pre-configured query template"
          clearable={false}
        />
      )}
      {templates.length === 0 && (
        <Text size="sm" c="dimmed">No templates available for this service</Text>
      )}

      {/* Essential Parameters */}
      <Stack gap="sm">
        <Text size="sm" fw={600}>Essential Parameters</Text>
        {essentialFields
          .filter(fieldName => fields[fieldName])
          .map(fieldName => renderField(fieldName, fields[fieldName]))}
      </Stack>

      {/* Advanced Parameters */}
      {advancedFields.length > 0 && (
        <Accordion variant="contained">
          <Accordion.Item value="advanced">
            <Accordion.Control>
              <Group gap="sm">
                <Text>Advanced Parameters</Text>
                <Badge size="xs" color="gray">
                  {advancedFields.length} fields
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                {advancedFields.map(fieldName => renderField(fieldName, fields[fieldName]))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {/* Validation Summary - Only show after validation has been run */}
      {validation && validation.hasBeenValidated && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Stack gap="xs">
          {validation.errors.length > 0 && (
            <Alert 
              icon={<IconAlertTriangle size={16} />} 
              color="red" 
              size="sm"
              title={`${validation.errors.length} validation ${validation.errors.length === 1 ? 'error' : 'errors'}`}
            >
              <Text size="sm">Please fix the issues below to generate your query:</Text>
              <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                {validation.errors.map((error, index) => (
                  <li key={index} style={{ fontSize: '0.875rem' }}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          {validation.warnings.length > 0 && validation.errors.length === 0 && (
            <Alert 
              icon={<IconInfoCircle size={16} />} 
              color="yellow" 
              size="sm"
              title={`${validation.warnings.length} ${validation.warnings.length === 1 ? 'suggestion' : 'suggestions'}`}
            >
              <Text size="sm">Your query will work, but consider the suggestions above for better performance.</Text>
            </Alert>
          )}
        </Stack>
      )}

      {/* Generate Button */}
      <Button 
        onClick={handleGenerate}
        fullWidth
        size="md"
        color="blue"
        variant="filled"
      >
        Generate KQL Query
      </Button>
    </Stack>
  );
};

export default ParameterForm;
import React, { useState, useEffect } from 'react';
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
  onGenerate 
}) => {
  const [serviceTemplate, setServiceTemplate] = useState(null);
  const [validation, setValidation] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Load template when service changes
  useEffect(() => {
    if (service) {
      loadTemplate(service, template)
        .then(setServiceTemplate)
        .catch(console.error);
      
      setTemplates(getServiceTemplates(service));
    }
  }, [service, template]);

  // Validate parameters when they change
  useEffect(() => {
    if (serviceTemplate && parameters) {
      const validationResult = validateParameters(parameters, serviceTemplate);
      setValidation(validationResult);
    }
  }, [parameters, serviceTemplate]);

  const handleParameterChange = (field, value) => {
    onParameterChange(field, value);
  };

  const handleGenerate = () => {
    if (validation?.isValid) {
      onGenerate();
    }
  };

  const renderField = (fieldName, fieldConfig) => {
    const value = parameters[fieldName] || '';
    const hasError = validation?.errors.some(error => error.includes(fieldName));
    
    const commonProps = {
      key: fieldName,
      label: fieldConfig.description || fieldName,
      value,
      onChange: (val) => handleParameterChange(fieldName, val),
      error: hasError,
      placeholder: fieldConfig.examples?.[0] || `Enter ${fieldName}`
    };

    switch (fieldConfig.type) {
      case 'number':
        return (
          <NumberInput
            {...commonProps}
            min={fieldConfig.min}
            max={fieldConfig.max}
            onChange={(val) => handleParameterChange(fieldName, val)}
          />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            data={fieldConfig.options || []}
            clearable
            searchable={fieldConfig.options?.length > 5}
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
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
            {...commonProps}
            placeholder="e.g., 24h, 7d, or 2023-01-01"
          />
        );

      default:
        return (
          <TextInput {...commonProps} />
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
  const essentialFields = ['TimeGenerated', 'timeRange', 'Action', 'SourceIp', 'DestinationIp'];
  const advancedFields = Object.keys(fields).filter(f => !essentialFields.includes(f));

  return (
    <Stack gap="md">
      {/* Template Selector */}
      {templates.length > 1 && (
        <Select
          label="Query Template"
          data={templates.map(t => ({ value: t.id, label: t.name }))}
          value={template}
          onChange={(val) => onParameterChange('template', val)}
          description="Choose a pre-configured query template"
        />
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

      {/* Validation Messages */}
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Stack gap="xs">
          {validation.errors.map((error, index) => (
            <Alert key={`error-${index}`} icon={<IconAlertTriangle size={16} />} color="red" size="sm">
              {error}
            </Alert>
          ))}
          {validation.warnings.map((warning, index) => (
            <Alert key={`warning-${index}`} icon={<IconInfoCircle size={16} />} color="yellow" size="sm">
              {warning}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Generate Button */}
      <Button 
        onClick={handleGenerate}
        disabled={!validation?.isValid}
        fullWidth
        size="md"
      >
        Generate KQL Query
      </Button>
    </Stack>
  );
};

export default ParameterForm;
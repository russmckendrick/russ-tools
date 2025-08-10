import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../../ui/select';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { Info, AlertTriangle, Sparkles } from 'lucide-react';
import { loadTemplate, getServiceTemplates } from '../utils/templateProcessor';
import { validateParameters } from '../utils/parameterValidator';

const ParameterFormShadcn = ({ 
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
    
    const fieldId = `field-${fieldName}`;

    switch (fieldConfig.type) {
      case 'number':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="number"
              value={cleanValue}
              onChange={(e) => handleParameterChange(fieldName, e.target.value)}
              placeholder={Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 ? fieldConfig.examples[0] : `Enter ${fieldName}`}
              min={fieldConfig.min}
              max={fieldConfig.max}
            />
            {Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 && (
              <p className="text-xs text-muted-foreground">Example: {fieldConfig.examples[0]}</p>
            )}
          </div>
        );

      case 'select':
        // Prepare select data with labels
        let selectData = fieldConfig.options || [];
        if (fieldConfig.optionLabels) {
          selectData = fieldConfig.options.map(value => ({
            value: value,
            label: fieldConfig.optionLabels[value] || value
          }));
        } else {
          selectData = selectData.map(value => ({
            value: value,
            label: value
          }));
        }
        
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={cleanValue} onValueChange={(value) => handleParameterChange(fieldName, value)}>
              <SelectTrigger id={fieldId}>
                <SelectValue placeholder={`Select ${fieldName}`} />
              </SelectTrigger>
              <SelectContent>
                {selectData.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 && (
              <p className="text-xs text-muted-foreground">Example: {fieldConfig.examples[0]}</p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div key={fieldName} className="space-y-2">
            <Label>
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="text-xs text-muted-foreground">
              Multi-select functionality requires additional implementation
            </div>
          </div>
        );

      default:
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="text"
              value={cleanValue}
              onChange={(e) => handleParameterChange(fieldName, e.target.value)}
              placeholder={Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 ? fieldConfig.examples[0] : `Enter ${fieldName}`}
            />
            {Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 && (
              <p className="text-xs text-muted-foreground">Example: {fieldConfig.examples[0]}</p>
            )}
          </div>
        );
    }
  };

  if (!serviceTemplate) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Loading template configuration...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentTemplateConfig = serviceTemplate.templates?.[template];
  const fields = serviceTemplate.schema?.fields || {};
  
  // Group fields by category
  const requiredFields = [];
  const optionalFields = [];
  
  Object.entries(fields).forEach(([name, config]) => {
    if (config.required) {
      requiredFields.push({ name, config });
    } else {
      optionalFields.push({ name, config });
    }
  });

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template-select">Query Template</Label>
        <Select value={template} onValueChange={onTemplateChange}>
          <SelectTrigger id="template-select">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tmpl) => (
              <SelectItem key={tmpl.value} value={tmpl.value}>
                <div>
                  <div className="font-medium">{tmpl.label}</div>
                  {tmpl.description && (
                    <div className="text-xs text-muted-foreground">{tmpl.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Description */}
      {currentTemplateConfig?.description && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {currentTemplateConfig.description}
          </AlertDescription>
        </Alert>
      )}

      {/* Required Parameters */}
      {requiredFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Required Parameters</h3>
            <Badge variant="destructive" className="h-5">
              {requiredFields.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {requiredFields.map(({ name, config }) => renderField(name, config))}
          </div>
        </div>
      )}
      
      {/* Optional Parameters */}
      {optionalFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Optional Parameters</h3>
            <Badge variant="secondary" className="h-5">
              {optionalFields.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {optionalFields.map(({ name, config }) => renderField(name, config))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation?.hasBeenValidated && !validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.errors.map((error, idx) => (
                <div key={idx}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      <Button 
        onClick={handleGenerate} 
        className="w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate KQL Query
      </Button>
    </div>
  );
};

export default ParameterFormShadcn;
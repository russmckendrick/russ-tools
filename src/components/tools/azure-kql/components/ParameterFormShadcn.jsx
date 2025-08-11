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
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '../../../ui/collapsible';
import { Info, AlertTriangle, Sparkles, Settings, Zap, FileCode, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [optionalParamsOpen, setOptionalParamsOpen] = useState(false);

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
    if (serviceTemplate && parameters && template) {
      const validationResult = validateParameters(parameters, serviceTemplate);
      validationResult.hasBeenValidated = true;
      setValidation(validationResult);
      return validationResult;
    }
    return { isValid: true, errors: [], warnings: [], hasBeenValidated: false };
  }, [serviceTemplate, parameters, template]);

  const handleParameterChange = (field, value) => {
    onParameterChange(field, value);
  };

  const handleGenerate = () => {
    // Only generate if we have a service template and template selected
    if (!serviceTemplate || !template) {
      return;
    }
    
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
            <Label htmlFor={fieldId} className="text-sm font-medium">
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
              className="h-11"
            />
            {Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">Example:</span> {fieldConfig.examples[0]}
              </p>
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
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={cleanValue} onValueChange={(value) => handleParameterChange(fieldName, value)}>
              <SelectTrigger id={fieldId} className="h-11">
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
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">Example:</span> {fieldConfig.examples[0]}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div key={fieldName} className="space-y-2">
            <Label className="text-sm font-medium">
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="rounded-lg bg-muted/30 p-3 border border-dashed border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-select functionality requires additional implementation
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {fieldConfig.description || fieldName}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="text"
              value={cleanValue}
              onChange={(e) => handleParameterChange(fieldName, e.target.value)}
              placeholder={Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 ? fieldConfig.examples[0] : `Enter ${fieldName}`}
              className="h-11"
            />
            {Array.isArray(fieldConfig.examples) && fieldConfig.examples.length > 0 && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">Example:</span> {fieldConfig.examples[0]}
              </p>
            )}
          </div>
        );
    }
  };

  if (!serviceTemplate) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Loading template configuration...
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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
    <div className="space-y-5">
      {/* Template Selection Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileCode className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            Template Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="template-select" className="text-sm font-medium">
              Query Template
            </Label>
            <Select value={template} onValueChange={onTemplateChange}>
              <SelectTrigger id="template-select" className="h-12">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tmpl) => (
                  <SelectItem key={tmpl.value} value={tmpl.value} className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{tmpl.label}</div>
                      {tmpl.description && (
                        <div className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Description */}
          {currentTemplateConfig?.description && (
            <Alert className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-800/50 dark:bg-cyan-950/50">
              <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <AlertDescription className="text-cyan-800 dark:text-cyan-200">
                {currentTemplateConfig.description}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Required Parameters Card */}
      {requiredFields.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
              Required Parameters
              <Badge variant="destructive" className="h-6 px-2 text-xs">
                {requiredFields.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredFields.map(({ name, config }) => renderField(name, config))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Optional Parameters Card - Collapsible */}
      {optionalFields.length > 0 && (
        <Collapsible open={optionalParamsOpen} onOpenChange={setOptionalParamsOpen}>
          <Card className="border-border/50 shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Optional Parameters
                    <Badge variant="secondary" className="h-6 px-2 text-xs">
                      {optionalFields.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {optionalParamsOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {optionalFields.map(({ name, config }) => renderField(name, config))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Validation Errors */}
      {validation?.hasBeenValidated && !validation.isValid && (
        <Alert variant="destructive" className="border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      <div className="pt-1">
        <Button 
          onClick={handleGenerate} 
          disabled={!serviceTemplate || !template}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 dark:from-cyan-500 dark:to-blue-500 dark:hover:from-cyan-600 dark:hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate KQL Query
        </Button>
      </div>
    </div>
  );
};

export default ParameterFormShadcn;
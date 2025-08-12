import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/collapsible';
import { ChevronDown, AlertCircle, Sparkles } from 'lucide-react';
import { getTemplateList, loadTemplate } from '../utils/templateLoader';
import { cn } from '@/lib/utils';

const ParameterForm = ({
  service,
  template,
  parameters,
  errors,
  onParameterChange,
  onTemplateChange,
  onGenerate,
  isGenerating
}) => {
  const [expandAdvanced, setExpandAdvanced] = useState(false);
  const templates = useMemo(() => getTemplateList(service), [service]);
  const currentTemplate = useMemo(() => {
    if (!service || !template) return null;
    return loadTemplate(service, template);
  }, [service, template]);

  useEffect(() => {
    if (templates.length > 0 && !template) {
      onTemplateChange(templates[0].id);
    }
  }, [templates, template, onTemplateChange]);

  const renderField = (field) => {
    const value = parameters[field.name] || '';
    const error = errors[field.name];
    const hasError = !!error;
    
    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className={cn(hasError && "text-destructive")}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select 
              value={value} 
              onValueChange={(val) => onParameterChange(field.name, val)}
            >
              <SelectTrigger 
                id={field.name}
                className={cn(hasError && "border-destructive")}
              >
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
            {field.description && !error && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'text':
      case 'ip':
      case 'email':
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className={cn(hasError && "text-destructive")}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => onParameterChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className={cn(hasError && "border-destructive")}
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
            {field.description && !error && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'timeRange':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className={cn(hasError && "text-destructive")}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select 
              value={value || ''} 
              onValueChange={(val) => onParameterChange(field.name, val)}
            >
              <SelectTrigger 
                id={field.name}
                className={cn(hasError && "border-destructive")}
              >
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="6h">Last 6 hours</SelectItem>
                <SelectItem value="12h">Last 12 hours</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="2d">Last 2 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentTemplate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Please select a service to configure parameters
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const essentialFields = currentTemplate.fields?.filter(f => f.essential) || [];
  const advancedFields = currentTemplate.fields?.filter(f => !f.essential) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Query</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={template} onValueChange={onTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentTemplate.description && (
            <p className="text-sm text-muted-foreground">
              {currentTemplate.description}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {essentialFields.map(renderField)}
        </div>

        {advancedFields.length > 0 && (
          <Collapsible open={expandAdvanced} onOpenChange={setExpandAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Advanced Parameters
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandAdvanced && "transform rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {advancedFields.map(renderField)}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Button 
          onClick={onGenerate} 
          disabled={isGenerating}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Query'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ParameterForm;
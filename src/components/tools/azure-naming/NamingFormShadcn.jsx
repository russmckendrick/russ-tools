import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { useAzureNamingContextShadcn } from './context/AzureNamingContextShadcn';
import HelpTooltipShadcn from './HelpTooltipShadcn';

const NamingFormShadcn = ({ formState, updateFormState, validationState, generateName, column }) => {
  const { environmentOptions, regionDropdownOptions, isLoading } = useAzureNamingContextShadcn();
  
  // Toggle states for optional fields
  const [showInstance, setShowInstance] = useState(!!formState.instance);
  const [showCustomPrefix, setShowCustomPrefix] = useState(!!formState.customPrefix);
  const [showCustomSuffix, setShowCustomSuffix] = useState(!!formState.customSuffix);
  const [showRandomChars, setShowRandomChars] = useState((formState.randomLength || 0) > 0);

  const handleInputChange = (name, value) => {
    updateFormState(name, value);
  };

  const handleToggleChange = (field, enabled, setter) => {
    setter(enabled);
    if (!enabled) {
      // Clear the field when toggled off
      switch (field) {
        case 'instance':
          updateFormState('instance', '');
          break;
        case 'customPrefix':
          updateFormState('customPrefix', '');
          break;
        case 'customSuffix':
          updateFormState('customSuffix', '');
          break;
        case 'randomLength':
          updateFormState('randomLength', 0);
          break;
      }
    }
  };

  if (column === 'left') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-sm font-medium">Workload/Application Name</span>
                <HelpTooltipShadcn content="Enter the name of your workload or application. This will be used as the main identifier in the resource name." />
              </Label>
              <Input
                name="workload"
                value={formState.workload}
                onChange={(e) => handleInputChange('workload', e.target.value)}
                placeholder="e.g., payments, webapp, database"
                className={validationState.errors.workload ? "border-destructive" : ""}
              />
              {validationState.errors.workload && (
                <p className="text-sm text-destructive">{validationState.errors.workload}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-sm font-medium">Environment</span>
                <HelpTooltipShadcn content="Select the environment where this resource will be deployed." />
              </Label>
              <Select
                name="environment"
                value={formState.environment}
                onValueChange={(value) => handleInputChange('environment', value)}
              >
                <SelectTrigger className={validationState.errors.environment ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an environment" />
                </SelectTrigger>
                <SelectContent>
                  {environmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationState.errors.environment && (
                <p className="text-sm text-destructive">{validationState.errors.environment}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-sm font-medium">Region</span>
                <HelpTooltipShadcn content="Select the Azure region for your resource. Display name is shown, but the abbreviation will be used in the generated name." />
              </Label>
              <Select
                name="region"
                value={formState.region}
                onValueChange={(value) => handleInputChange('region', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={validationState.errors.region ? "border-destructive" : ""}>
                  <SelectValue placeholder={isLoading ? 'Loading regions...' : 'Select a region'} />
                </SelectTrigger>
                <SelectContent>
                  {regionDropdownOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationState.errors.region && (
                <p className="text-sm text-destructive">{validationState.errors.region}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (column === 'right') {
    return (
      <div className="space-y-4">
        {/* Instance Number */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm font-medium">Instance Number</span>
                  <HelpTooltipShadcn content="Enter a number up to 5 digits (e.g., 001, 12345). Optional field for resources that support multiple instances." />
                </Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="instance-toggle" className="text-sm">Enable</Label>
                  <Switch
                    id="instance-toggle"
                    checked={showInstance}
                    onCheckedChange={checked => handleToggleChange('instance', checked, setShowInstance)}
                  />
                </div>
              </div>
              
              {showInstance && (
                <div className="space-y-2">
                  <Input
                    name="instance"
                    value={formState.instance}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and limit to 5 digits
                      if (value === '' || (/^\d+$/.test(value) && value.length <= 5)) {
                        handleInputChange('instance', value);
                      }
                    }}
                    placeholder="001"
                  />
                  {formState.instance && (
                    !/^\d+$/.test(formState.instance) ? (
                      <p className="text-sm text-destructive">Only numbers are allowed</p>
                    ) : formState.instance.length > 5 ? (
                      <p className="text-sm text-destructive">Maximum 5 digits allowed</p>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Custom Prefix */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm font-medium">Custom Prefix</span>
                  <HelpTooltipShadcn content="Add a custom prefix to the resource name. This will be added before the resource type prefix." />
                </Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="prefix-toggle" className="text-sm">Enable</Label>
                  <Switch
                    id="prefix-toggle"
                    checked={showCustomPrefix}
                    onCheckedChange={checked => handleToggleChange('customPrefix', checked, setShowCustomPrefix)}
                  />
                </div>
              </div>
              
              {showCustomPrefix && (
                <Input
                  name="customPrefix"
                  value={formState.customPrefix}
                  onChange={(e) => handleInputChange('customPrefix', e.target.value)}
                  placeholder="e.g., team, project"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Suffix */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm font-medium">Custom Suffix</span>
                  <HelpTooltipShadcn content="Add a custom suffix to the resource name. This will be added at the end of the name." />
                </Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="suffix-toggle" className="text-sm">Enable</Label>
                  <Switch
                    id="suffix-toggle"
                    checked={showCustomSuffix}
                    onCheckedChange={checked => handleToggleChange('customSuffix', checked, setShowCustomSuffix)}
                  />
                </div>
              </div>
              
              {showCustomSuffix && (
                <Input
                  name="customSuffix"
                  value={formState.customSuffix}
                  onChange={(e) => handleInputChange('customSuffix', e.target.value)}
                  placeholder="e.g., backup, archive"
                />
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Random Characters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm font-medium">Random Characters</span>
                  <HelpTooltipShadcn content="Select how many random characters to append to the resource name for uniqueness." />
                </Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="random-toggle" className="text-sm">Enable</Label>
                  <Switch
                    id="random-toggle"
                    checked={showRandomChars}
                    onCheckedChange={checked => handleToggleChange('randomLength', checked, setShowRandomChars)}
                  />
                </div>
              </div>
              
              {showRandomChars && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Choose number of random characters to append (improves uniqueness)
                  </p>
                  <div className="space-y-2">
                    <Slider
                      value={[formState.randomLength || 0]}
                      onValueChange={([value]) => updateFormState('randomLength', value)}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>
                  {(formState.randomLength || 0) > 0 && (
                    <p className="text-xs text-blue-600 font-medium">
                      Will append {formState.randomLength} random character{formState.randomLength > 1 ? 's' : ''} (e.g., "abc123xy")
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return null;
};

export default NamingFormShadcn;
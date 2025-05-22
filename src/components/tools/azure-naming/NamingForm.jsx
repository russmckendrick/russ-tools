import React, { useState } from 'react';
import { TextInput, Select, Group, Stack, Grid, Text, Paper, Slider, Switch } from '@mantine/core';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const NamingForm = ({ formState, updateFormState, validationState, generateName, column }) => {
  const { environmentOptions, regionDropdownOptions, isLoading } = useAzureNamingContext();
  
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
      <Stack gap="md">
        <Paper p="md" withBorder radius="sm">
          <TextInput
            label={
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Workload/Application Name</Text>
                <HelpTooltip content="Enter the name of your workload or application. This will be used as the main identifier in the resource name." />
              </Group>
            }
            name="workload"
            value={formState.workload}
            onChange={(e) => handleInputChange('workload', e.target.value)}
            placeholder="e.g., payments, webapp, database"
            error={validationState.errors.workload}
            withAsterisk
            size="sm"
          />
        </Paper>
        
        <Paper p="md" withBorder radius="sm">
          <Select
            label={
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Environment</Text>
                <HelpTooltip content="Select the environment where this resource will be deployed." />
              </Group>
            }
            name="environment"
            value={formState.environment}
            onChange={(value) => handleInputChange('environment', value)}
            placeholder="Select an environment"
            data={environmentOptions}
            error={validationState.errors.environment}
            withAsterisk
            size="sm"
          />
        </Paper>

        <Paper p="md" withBorder radius="sm">
          <Select
            label={
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Region</Text>
                <HelpTooltip content="Select the Azure region for your resource. Display name is shown, but the abbreviation will be used in the generated name." />
              </Group>
            }
            name="region"
            value={formState.region}
            onChange={(value) => handleInputChange('region', value)}
            placeholder={isLoading ? 'Loading regions...' : 'Select a region'}
            data={regionDropdownOptions}
            error={validationState.errors.region}
            withAsterisk
            searchable
            size="sm"
          />
        </Paper>
      </Stack>
    );
  }
  
  if (column === 'right') {
    return (
      <Stack gap="md">
        {/* Instance Number */}
        <Paper p="md" withBorder radius="sm">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Instance Number</Text>
                <HelpTooltip content="Enter a number up to 5 digits (e.g., 001, 12345). Optional field for resources that support multiple instances." />
              </Group>
              <Switch
                label="Enable"
                size="sm"
                checked={showInstance}
                onChange={event => handleToggleChange('instance', event.currentTarget.checked, setShowInstance)}
              />
            </Group>
            
            {showInstance && (
              <TextInput
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
                error={
                  formState.instance && 
                  (!/^\d+$/.test(formState.instance) 
                    ? 'Only numbers are allowed' 
                    : formState.instance.length > 5 
                      ? 'Maximum 5 digits allowed' 
                      : null)
                }
                size="sm"
              />
            )}
          </Stack>
        </Paper>
        
        {/* Custom Prefix */}
        <Paper p="md" withBorder radius="sm">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Custom Prefix</Text>
                <HelpTooltip content="Add a custom prefix to the resource name. This will be added before the resource type prefix." />
              </Group>
              <Switch
                label="Enable"
                size="sm"
                checked={showCustomPrefix}
                onChange={event => handleToggleChange('customPrefix', event.currentTarget.checked, setShowCustomPrefix)}
              />
            </Group>
            
            {showCustomPrefix && (
              <TextInput
                name="customPrefix"
                value={formState.customPrefix}
                onChange={(e) => handleInputChange('customPrefix', e.target.value)}
                placeholder="e.g., team, project"
                size="sm"
              />
            )}
          </Stack>
        </Paper>

        {/* Custom Suffix */}
        <Paper p="md" withBorder radius="sm">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Custom Suffix</Text>
                <HelpTooltip content="Add a custom suffix to the resource name. This will be added at the end of the name." />
              </Group>
              <Switch
                label="Enable"
                size="sm"
                checked={showCustomSuffix}
                onChange={event => handleToggleChange('customSuffix', event.currentTarget.checked, setShowCustomSuffix)}
              />
            </Group>
            
            {showCustomSuffix && (
              <TextInput
                name="customSuffix"
                value={formState.customSuffix}
                onChange={(e) => handleInputChange('customSuffix', e.target.value)}
                placeholder="e.g., backup, archive"
                size="sm"
              />
            )}
          </Stack>
        </Paper>
        
        {/* Random Characters */}
        <Paper p="md" withBorder radius="sm">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap={4} align="center">
                <Text size="sm" fw={500}>Random Characters</Text>
                <HelpTooltip content="Select how many random characters to append to the resource name for uniqueness." />
              </Group>
              <Switch
                label="Enable"
                size="sm"
                checked={showRandomChars}
                onChange={event => handleToggleChange('randomLength', event.currentTarget.checked, setShowRandomChars)}
              />
            </Group>
            
            {showRandomChars && (
              <Stack gap="md">
                <Text size="xs" c="dimmed">
                  Choose number of random characters to append (improves uniqueness)
                </Text>
                <Slider
                  label={value => `${value} ${value === 1 ? 'character' : 'characters'}`}
                  min={0}
                  max={5}
                  step={1}
                  value={formState.randomLength || 0}
                  onChange={value => updateFormState('randomLength', value)}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 4, label: '4' },
                    { value: 5, label: '5' },
                  ]}
                  size="md"
                  color="blue"
                  styles={{
                    root: {
                      marginTop: '8px',
                      marginBottom: '16px',
                    },
                    track: {
                      height: '6px',
                    },
                    thumb: {
                      borderWidth: '2px',
                      backgroundColor: 'var(--mantine-color-gray-0)',
                      borderColor: 'var(--mantine-color-blue-5)',
                    },
                    mark: {
                      backgroundColor: 'var(--mantine-color-gray-4)',
                      borderColor: 'var(--mantine-color-gray-4)',
                    },
                    markLabel: {
                      fontSize: '11px',
                      color: 'var(--mantine-color-gray-6)',
                      fontWeight: 500,
                      marginTop: '8px',
                    },
                    label: {
                      backgroundColor: 'var(--mantine-color-blue-5)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }
                  }}
                />
                {(formState.randomLength || 0) > 0 && (
                  <Text size="xs" c="blue.6" fw={500} mt="sm">
                    Will append {formState.randomLength} random character{formState.randomLength > 1 ? 's' : ''} (e.g., "abc123xy")
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  }
  
  return null;
};

export default NamingForm; 
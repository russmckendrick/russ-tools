import React from 'react';
import { Select, Text, Group } from '@mantine/core';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import { RESOURCE_TYPES } from '../../../utils/azure-naming/rules';
import HelpTooltip from './HelpTooltip';

const ResourceTypeSelector = () => {
  const { formState, updateFormState, validationState } = useAzureNaming();

  // Map resource types to code/label pairs
  const resourceTypeOptions = Object.entries(RESOURCE_TYPES).map(([key, def]) => ({
    value: def.type,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  const handleResourceTypeChange = (value) => {
    console.log('[ResourceTypeSelector] onChange value:', value);
    updateFormState('resourceType', value);
  };

  return (
    <Select
      label={
        <Group gap={4} align="center">
          <Text size="sm" fw={500}>
            Resource Type
          </Text>
          <HelpTooltip
            content="Select the type of Azure resource you want to name. Each resource type has specific naming conventions and restrictions."
          />
        </Group>
      }
      placeholder="Select a resource type"
      data={resourceTypeOptions}
      value={formState.resourceType}
      onChange={handleResourceTypeChange}
      error={validationState.errors.resourceType}
      withAsterisk
      mb="md"
      searchable={false}
      creatable={false}
      allowDeselect={false}
    />
  );
};

export default ResourceTypeSelector; 
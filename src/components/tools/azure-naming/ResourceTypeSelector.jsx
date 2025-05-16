import React from 'react';
import { Select, Text, Group } from '@mantine/core';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const ResourceTypeSelector = ({ formState, updateFormState, validationState }) => {
  // Get resourceTypes from context (array of { value: name, label: slug })
  const { resourceTypes } = useAzureNamingContext();

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
      data={resourceTypes}
      value={formState.resourceType}
      onChange={handleResourceTypeChange}
      error={validationState.errors.resourceType}
      withAsterisk
      mb="md"
      searchable
    />
  );
};

export default ResourceTypeSelector; 
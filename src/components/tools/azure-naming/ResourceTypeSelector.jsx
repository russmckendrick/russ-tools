import React from 'react';
import { Select, Text, Group } from '@mantine/core';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const ResourceTypeSelector = () => {
  const { formState, updateFormState, validationState } = useAzureNaming();
  const { resourceTypes } = useAzureNamingContext();

  const handleResourceTypeChange = (value) => {
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
      data={resourceTypes.map((type) => ({ value: type, label: type.replace(/_/g, ' ') }))}
      value={formState.resourceType}
      onChange={handleResourceTypeChange}
      error={validationState.errors.resourceType}
      withAsterisk
      mb="md"
    />
  );
};

export default ResourceTypeSelector; 
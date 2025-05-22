import React from 'react';
import { MultiSelect, Text, Group } from '@mantine/core';
import { devLog } from '../../../utils/devLog';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const ResourceTypeSelector = ({ formState, updateFormState, validationState, showAsterisk }) => {
  // Get resourceTypes from context (array of { value: name, label: slug })
  const { resourceTypes } = useAzureNamingContext();

  const handleResourceTypeChange = (value) => {
    //devLog('[ResourceTypeSelector] onChange value:', value);
    updateFormState('resourceType', value);
  };

  return (
    <MultiSelect
      label={
        <Group gap={4} align="center">
          <Text size="sm" fw={500}>
            Resource Type
            {showAsterisk && (
              <Text span c="red" ml={4}>*</Text>
            )}
          </Text>
          <HelpTooltip
            content="Select one or more Azure resource types you want to name. Each resource type has specific naming conventions and restrictions."
          />
        </Group>
      }
      placeholder="Select resource type(s)"
      data={resourceTypes}
      value={formState.resourceType}
      onChange={handleResourceTypeChange}
      error={validationState.errors.resourceType}
      searchable
      clearable
      maxDropdownHeight={500}
      size="sm"
      withAsterisk
      styles={{
        input: {
          minHeight: '80px',
        }
      }}
    />
  );
};

export default ResourceTypeSelector; 
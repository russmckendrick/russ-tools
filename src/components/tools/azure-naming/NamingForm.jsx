import React from 'react';
import { TextInput, Select, Button, Group, Stack, Grid, Text } from '@mantine/core';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const NamingForm = () => {
  const { formState, updateFormState, validationState, generateName } = useAzureNaming();
  const { environments, regions } = useAzureNamingContext();

  const handleInputChange = (name, value) => {
    updateFormState(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateName();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
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
        />

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
          data={environments.map((env) => ({ value: env, label: env.charAt(0).toUpperCase() + env.slice(1) }))}
          error={validationState.errors.environment}
          withAsterisk
        />

        <Select
          label={
            <Group gap={4} align="center">
              <Text size="sm" fw={500}>Region</Text>
              <HelpTooltip content="Select the Azure region where this resource will be deployed." />
            </Group>
          }
          name="region"
          value={formState.region}
          onChange={(value) => handleInputChange('region', value)}
          placeholder="Select a region"
          data={regions.map((region) => ({ value: region, label: region.replace(/([A-Z])/g, ' $1').trim() }))}
          error={validationState.errors.region}
          withAsterisk
        />

        <TextInput
          label={
            <Group gap={4} align="center">
              <Text size="sm" fw={500}>Instance Number</Text>
              <HelpTooltip content="Enter a 3-digit instance number (e.g., 001, 002). Required for resources that support multiple instances." />
            </Group>
          }
          name="instance"
          value={formState.instance}
          onChange={(e) => handleInputChange('instance', e.target.value)}
          placeholder="001"
          error={validationState.errors.instance}
        />

        <Grid gutter="md">
          <Grid.Col span={6}>
            <TextInput
              label={
                <Group gap={4} align="center">
                  <Text size="sm" fw={500}>Custom Prefix (Optional)</Text>
                  <HelpTooltip content="Add a custom prefix to the resource name. This will be added before the resource type prefix." />
                </Group>
              }
              name="customPrefix"
              value={formState.customPrefix}
              onChange={(e) => handleInputChange('customPrefix', e.target.value)}
              placeholder="e.g., team, project"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label={
                <Group gap={4} align="center">
                  <Text size="sm" fw={500}>Custom Suffix (Optional)</Text>
                  <HelpTooltip content="Add a custom suffix to the resource name. This will be added at the end of the name." />
                </Group>
              }
              name="customSuffix"
              value={formState.customSuffix}
              onChange={(e) => handleInputChange('customSuffix', e.target.value)}
              placeholder="e.g., backup, archive"
            />
          </Grid.Col>
        </Grid>

        <Button type="submit" fullWidth mt="md" variant="filled" color="blue">
          Generate Name
        </Button>
      </Stack>
    </form>
  );
};

export default NamingForm; 
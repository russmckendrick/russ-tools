import React from 'react';
import { Container, Paper, Title, Group, Stack, Space, Text, Button, Grid, TextInput, Select } from '@mantine/core';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import ResourceTypeSelector from './ResourceTypeSelector';
import ValidationIndicator from './ValidationIndicator';
import ResultsDisplay from './ResultsDisplay';
import NamingHistory from './NamingHistory';
import HelpTooltip from './HelpTooltip';

const AzureNamingTool = () => {
  const {
    formState,
    validationState,
    updateFormState,
    generateName,
    resetForm
  } = useAzureNaming();
  const { environmentOptions, regionDropdownOptions, isLoading } = useAzureNamingContext();

  const handleInputChange = (name, value) => {
    updateFormState(name, value);
  };

  return (
    <Container size="lg" py="xl">
      {/* Tool Title */}
      <Group align="center" mb="lg">
        <Title order={2} color="blue.8">
          Azure Resource Naming Tool
        </Title>
        <HelpTooltip
          content="Generate compliant Azure resource names following Microsoft's naming conventions and best practices."
          className="ml-2"
        />
      </Group>

      {/* Section 1: Resource Naming Form */}
      <Paper radius="md" shadow="xs" p="lg" withBorder mb="md">
        <Title order={4} mb="md">Resource Naming Form</Title>
        <ValidationIndicator
          formState={formState}
          validationState={validationState}
        />
        <form onSubmit={e => { e.preventDefault(); generateName(); }}>
          <Grid gutter="md">
            {/* Row 1 */}
            <Grid.Col span={12} mb="md">
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
            </Grid.Col>
            {/* Row 2 */}
            <Grid.Col span={12} mb="md">
              <ResourceTypeSelector
                formState={formState}
                updateFormState={updateFormState}
                validationState={validationState}
              />
            </Grid.Col>
            {/* Row 3 */}
            <Grid.Col span={6} mb="md">
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
              />
            </Grid.Col>
            <Grid.Col span={6} mb="md">
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
              />
            </Grid.Col>
            {/* Row 4 */}
            <Grid.Col span={4} mb="md">
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
            </Grid.Col>
            <Grid.Col span={4} mb="md">
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
            <Grid.Col span={4} mb="md">
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
            {/* Button Row */}
            <Grid.Col span={12}>
              <Button type="submit" fullWidth size="md">
                Generate Name
              </Button>
            </Grid.Col>
          </Grid>
        </form>
      </Paper>

      <Space h="md" />

      {/* Section 2: Generated Names */}
      <Paper radius="md" shadow="xs" p="lg" withBorder mb="md">
        <Title order={4} mb="md">Generated Names</Title>
        <ResultsDisplay
          formState={formState}
          validationState={validationState}
          tableLayout
        />
      </Paper>

      <Space h="md" />

      {/* Section 3: Recent Names */}
      <Paper radius="md" shadow="xs" p="lg" withBorder>
        <Title order={4} mb="md">Recent Names</Title>
        <NamingHistory />
      </Paper>
    </Container>
  );
};

export default AzureNamingTool; 
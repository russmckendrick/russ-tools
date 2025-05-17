import React from 'react';
import { Container, Paper, Title, Group, Stack, Space, Text, Button, Grid, TextInput, Select, Slider } from '@mantine/core';
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
      </Group>

      {/* Section 1: Resource Naming Form */}
      <Paper radius="md" shadow="xs" p="lg" withBorder mb="md">
        <Title order={4} mb="md">Resource Naming Form</Title>

        <form onSubmit={e => { e.preventDefault(); generateName(); }}>
          <Grid grow gutter="xs">
            {/* Row 1 */}
            <Grid.Col span={12} mb="sm">
              <TextInput
                label={
                  <Group gap={4} align="center">
                    <Text size="sm" fw={500}>
                      Workload/Application Name
                      {validationState.errors.workload && (
                        <Text span c="red" ml={4}>*</Text>
                      )}
                    </Text>
                    <HelpTooltip content="Enter the name of your workload or application. This will be used as the main identifier in the resource name." />
                  </Group>
                }
                name="workload"
                value={formState.workload}
                onChange={(e) => handleInputChange('workload', e.target.value)}
                placeholder="e.g., payments, webapp, database"
                error={validationState.errors.workload}
              />
            </Grid.Col>
            {/* Row 2 */}
            <Grid.Col span={12}>
              <ResourceTypeSelector
                formState={formState}
                updateFormState={updateFormState}
                validationState={validationState}
                showAsterisk={!!validationState.errors.resourceType}
              />
            </Grid.Col>
            {/* Row 3 */}
            <Grid.Col span={6} mb="sm">
              <Select
                label={
                  <Group gap={4} align="center">
                    <Text size="sm" fw={500}>
                      Environment
                      {validationState.errors.environment && (
                        <Text span c="red" ml={4}>*</Text>
                      )}
                    </Text>
                    <HelpTooltip content="Select the environment where this resource will be deployed." />
                  </Group>
                }
                name="environment"
                value={formState.environment}
                onChange={(value) => handleInputChange('environment', value)}
                placeholder="Select an environment"
                data={environmentOptions}
                error={validationState.errors.environment}
              />
            </Grid.Col>
            <Grid.Col span={6} mb="sm">
              <Select
                label={
                  <Group gap={4} align="center">
                    <Text size="sm" fw={500}>
                      Region
                      {validationState.errors.region && (
                        <Text span c="red" ml={4}>*</Text>
                      )}
                    </Text>
                    <HelpTooltip content="Select the Azure region for your resource. Display name is shown, but the abbreviation will be used in the generated name." />
                  </Group>
                }
                name="region"
                value={formState.region}
                onChange={(value) => handleInputChange('region', value)}
                placeholder={isLoading ? 'Loading regions...' : 'Select a region'}
                data={regionDropdownOptions}
                error={validationState.errors.region}
                searchable
              />
            </Grid.Col>
             {/* Optional Row Header */}
            <Grid.Col span={12} mb="xs">
              <Text size="sm" fw={600} c="dimmed">Optional</Text>
            </Grid.Col>
            {/* Row 4 */}
            <Grid.Col span={3} mb="sm">
              <TextInput
                label={
                  <Group gap={4} align="center">
                    <Text size="sm" fw={500}>Instance Number</Text>
                    <HelpTooltip content="Enter a number up to 5 digits (e.g., 001, 12345). Optional field for resources that support multiple instances." />
                  </Group>
                }
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
              />
            </Grid.Col>
            <Grid.Col span={3} mb="sm">
              <TextInput
                label={
                  <Group gap={4} align="center">
                    <Text size="sm" fw={500}>Custom Prefix</Text>
                    <HelpTooltip content="Add a custom prefix to the resource name. This will be added before the resource type prefix." />
                  </Group>
                }
                name="customPrefix"
                value={formState.customPrefix}
                onChange={(e) => handleInputChange('customPrefix', e.target.value)}
                placeholder="e.g., team, project"
              />
            </Grid.Col>
            <Grid.Col span={3} mb="sm">
              <TextInput
                label={
                  <Group gap={4} align="center">
                    <Text size="sm" fw={500}>Custom Suffix</Text>
                    <HelpTooltip content="Add a custom suffix to the resource name. This will be added at the end of the name." />
                  </Group>
                }
                name="customSuffix"
                value={formState.customSuffix}
                onChange={(e) => handleInputChange('customSuffix', e.target.value)}
                placeholder="e.g., backup, archive"
              />
            </Grid.Col>
            <Grid.Col span={3} mb="sm">
              <Group gap={4} align="center" mb="xs">
                <Text size="sm" fw={500}>Random Characters</Text>
                <HelpTooltip content="Select how many random characters to append to the resource name for uniqueness." />
              </Group>
              <Group align="center">
                <Slider
                  label={value => `${value} random characters`}
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
                  style={{ flex: 1 }}
                />
              </Group>
            </Grid.Col>
            {/* Button Row */}
            <Grid.Col span={12}>
              <Button
                fullWidth
                size="md"
                color="blue"
                mt="md"
                onClick={generateName}
                disabled={isLoading}
              >
                Generate Name
              </Button>
            </Grid.Col>
            <Grid.Col span={12} mt="md">
              <ValidationIndicator formState={formState} validationState={validationState} />
            </Grid.Col>
          </Grid>
        </form>
      </Paper>

      {/* Section 2: Generated Names */}
      <Paper radius="md" shadow="xs" p="lg" withBorder mb="md">
        <Title order={4} mb="md">Generated Names</Title>
        <ResultsDisplay
          formState={formState}
          validationState={validationState}
          tableLayout
        />
      </Paper>

      {/* Section 3: Saved Names */}
      <Paper radius="md" shadow="xs" p="lg" withBorder>
        <Title order={4} mb="md">Saved Names</Title>
        <NamingHistory />
      </Paper>
    </Container>
  );
};

export default AzureNamingTool; 
import React from 'react';
import { 
  Paper, 
  Stack, 
  Title, 
  ThemeIcon, 
  Grid, 
  Tabs,
  Group,
  Text,
  Badge,
  Alert,
  Button
} from '@mantine/core';
import { IconBrandAzure, IconEdit, IconHistory, IconInfoCircle } from '@tabler/icons-react';
import { useAzureNaming } from './hooks/useAzureNaming';
import { useAzureNamingContext } from './context/AzureNamingContext';
import ResourceTypeSelector from './ResourceTypeSelector';
import ValidationIndicator from './ValidationIndicator';
import ResultsDisplay from './ResultsDisplay';
import NamingHistory from './NamingHistory';
import NamingForm from './NamingForm';

const AzureNamingTool = () => {
  const {
    formState,
    validationState,
    updateFormState,
    generateName,
    resetForm
  } = useAzureNaming();
  const { environmentOptions, regionDropdownOptions, isLoading } = useAzureNamingContext();

  return (
    <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="cyan" variant="light">
            <IconBrandAzure size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              Azure Resource Naming Tool
            </Title>
            <Text size="sm" c="dimmed">
              Generate consistent, compliant Azure resource names following best practices
            </Text>
          </div>
        </Group>

        <Tabs defaultValue="builder" variant="pills" orientation="horizontal">
          <Tabs.List grow>
            <Tabs.Tab value="builder" leftSection={<IconEdit size={16} />}>
              Name Builder
            </Tabs.Tab>
            <Tabs.Tab value="results" leftSection={<IconBrandAzure size={16} />}>
              Generated Names
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Saved Names
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="builder" pt="lg">
            <Stack gap="lg">
              {/* Resource Type Selection */}
              <Paper p="md" withBorder radius="md">
                <Stack gap="sm">
                  <Group gap="xs" align="center">
                    <Badge variant="light" color="blue" size="sm">Resource Types</Badge>
                    <Text size="xs" c="dimmed">Select Azure resources to name</Text>
                  </Group>
                  <ResourceTypeSelector
                    formState={formState}
                    updateFormState={updateFormState}
                    validationState={validationState}
                    showAsterisk={!!validationState.errors.resourceType}
                  />
                </Stack>
              </Paper>

              {/* Naming Configuration */}
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group gap="xs" align="center">
                      <Badge variant="light" color="green" size="sm">Required</Badge>
                      <Text size="xs" c="dimmed">Essential naming components</Text>
                    </Group>
                    <NamingForm 
                      formState={formState}
                      updateFormState={updateFormState}
                      validationState={validationState}
                      generateName={generateName}
                      column="left"
                    />
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group gap="xs" align="center">
                      <Badge variant="light" color="orange" size="sm">Optional</Badge>
                      <Text size="xs" c="dimmed">Additional naming options</Text>
                    </Group>
                    <NamingForm 
                      formState={formState}
                      updateFormState={updateFormState}
                      validationState={validationState}
                      generateName={generateName}
                      column="right"
                    />
                  </Stack>
                </Grid.Col>
              </Grid>

              {/* Generate Button & Validation */}
              <Paper p="md" withBorder radius="md">
                <Stack gap="md">
                  <Button
                    fullWidth
                    size="lg"
                    color="blue"
                    onClick={generateName}
                    disabled={isLoading}
                    leftSection={<IconBrandAzure size={18} />}
                  >
                    Generate Azure Resource Names
                  </Button>
                  <ValidationIndicator formState={formState} validationState={validationState} />
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="results" pt="lg">
            <Stack gap="lg">
              <Alert icon={<IconInfoCircle size={16} />} title="Generated Names" color="blue" variant="light">
                Review your generated Azure resource names and copy them for use
              </Alert>
              <ResultsDisplay
                formState={formState}
                validationState={validationState}
                tableLayout
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="lg">
            <Stack gap="lg">
              <Alert icon={<IconInfoCircle size={16} />} title="Naming History" color="green" variant="light">
                Access your previously generated and saved resource names
              </Alert>
              <NamingHistory />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
};

export default AzureNamingTool; 
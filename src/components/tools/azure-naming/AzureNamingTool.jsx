import React from 'react';
import { Container, Paper, Title, Group, Stack } from '@mantine/core';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import ResourceTypeSelector from './ResourceTypeSelector';
import NamingForm from './NamingForm';
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

  return (
    <Container size="lg" py="xl">
      <Paper radius="md" shadow="md" p="xl" withBorder>
        <Group align="center" mb="lg">
          <Title order={2} color="blue.8">
            Azure Resource Naming Tool
          </Title>
          <HelpTooltip
            content="Generate compliant Azure resource names following Microsoft's naming conventions and best practices."
            className="ml-2"
          />
        </Group>

        <ValidationIndicator
          formState={formState}
          validationState={validationState}
        />

        <form onSubmit={e => { e.preventDefault(); generateName(); }}>
          <Group align="flex-start" grow>
            <Stack gap="md" style={{ flex: 1 }}>
              <ResourceTypeSelector
                formState={formState}
                updateFormState={updateFormState}
                validationState={validationState}
              />
              <NamingForm
                formState={formState}
                updateFormState={updateFormState}
                validationState={validationState}
                generateName={generateName}
                column="left"
              />
            </Stack>
            <Stack gap="md" style={{ flex: 1 }}>
              <NamingForm
                formState={formState}
                updateFormState={updateFormState}
                validationState={validationState}
                generateName={generateName}
                column="right"
              />
            </Stack>
          </Group>
        </form>

        <ResultsDisplay
          formState={formState}
          validationState={validationState}
          tableLayout
        />

        <NamingHistory />
      </Paper>
    </Container>
  );
};

export default AzureNamingTool; 
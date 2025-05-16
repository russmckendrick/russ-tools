import React from 'react';
import { Container, Paper, Title, Group, Stack } from '@mantine/core';
import { AzureNamingProvider } from '../../../context/AzureNamingContext';
import ResourceTypeSelector from './ResourceTypeSelector';
import NamingForm from './NamingForm';
import ValidationIndicator from './ValidationIndicator';
import ResultsDisplay from './ResultsDisplay';
import NamingHistory from './NamingHistory';
import HelpTooltip from './HelpTooltip';

const AzureNamingTool = () => {
  return (
    <AzureNamingProvider>
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

          <Stack gap="xl">
            <Group align="flex-start" grow>
              <Stack gap="md" style={{ flex: 1 }}>
                <ResourceTypeSelector />
                <NamingForm />
              </Stack>
              <Stack gap="md" style={{ flex: 1 }}>
                <ValidationIndicator />
                <ResultsDisplay />
              </Stack>
            </Group>
            <NamingHistory />
          </Stack>
        </Paper>
      </Container>
    </AzureNamingProvider>
  );
};

export default AzureNamingTool; 
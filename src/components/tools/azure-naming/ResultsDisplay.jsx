import React, { useState } from 'react';
import { Paper, Group, Text, Button, Code, Divider, SimpleGrid, Stack, Title } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';

const ResultsDisplay = ({ formState, validationState }) => {
  const { addToHistory } = useAzureNamingContext();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(validationState.generatedName);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      addToHistory({
        resourceType: formState.resourceType,
        generatedName: validationState.generatedName,
        configuration: { ...formState }
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!validationState.generatedName) {
    return null;
  }

  return (
    <Paper radius="md" p="md" withBorder bg="gray.0">
      <Stack gap="xs">
        <Group justify="space-between" align="center" mb="xs">
          <Title order={4} size="h5">Generated Name</Title>
          <Button
            onClick={handleCopy}
            size="xs"
            leftSection={copySuccess ? <IconCheck size={16} /> : <IconCopy size={16} />}
            color={copySuccess ? 'green' : 'blue'}
            variant={copySuccess ? 'light' : 'filled'}
            radius="md"
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
        </Group>
        <Code block fz="md" py={8} px={12} radius="md" mb="sm" style={{ fontSize: 16 }}>
          {validationState.generatedName}
        </Code>
        <Divider my="xs" />
        <Text size="sm" fw={500} mb={4}>Name Components:</Text>
        <SimpleGrid cols={2} spacing={4} verticalSpacing={2}>
          <Text c="dimmed" size="sm">Resource Type:</Text>
          <Text size="sm">{formState.resourceType}</Text>
          <Text c="dimmed" size="sm">Workload:</Text>
          <Text size="sm">{formState.workload}</Text>
          <Text c="dimmed" size="sm">Environment:</Text>
          <Text size="sm">{formState.environment}</Text>
          <Text c="dimmed" size="sm">Region:</Text>
          <Text size="sm">{formState.region}</Text>
          {formState.instance && <><Text c="dimmed" size="sm">Instance:</Text><Text size="sm">{formState.instance}</Text></>}
          {formState.customPrefix && <><Text c="dimmed" size="sm">Custom Prefix:</Text><Text size="sm">{formState.customPrefix}</Text></>}
          {formState.customSuffix && <><Text c="dimmed" size="sm">Custom Suffix:</Text><Text size="sm">{formState.customSuffix}</Text></>}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
};

export default ResultsDisplay; 
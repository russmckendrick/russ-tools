import React, { useState } from 'react';
import { Paper, Group, Text, Button, Code, Divider, SimpleGrid, Stack, Title, Table } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';

const ResultsDisplay = ({ formState, validationState, tableLayout }) => {
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

  if (!validationState.generatedName || (Array.isArray(validationState.generatedName) && validationState.generatedName.length === 0)) {
    return null;
  }

  // Helper to get label for a resource type value
  const getResourceTypeLabel = (value) => {
    if (!Array.isArray(formState.resourceType)) return value;
    const idx = formState.resourceType.indexOf(value);
    if (idx !== -1 && Array.isArray(formState.resourceType)) {
      return formState.resourceType[idx];
    }
    return value;
  };

  // Table layout for results
  if (tableLayout) {
    const names = Array.isArray(validationState.generatedName)
      ? validationState.generatedName
      : [validationState.generatedName];
    const types = Array.isArray(formState.resourceType)
      ? formState.resourceType
      : [formState.resourceType];
    return (
      <section style={{ marginTop: 40 }}>
        <Title order={4} size="h5" mb="sm">Generated Names</Title>
        <Table stickyHeader striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Resource Type</Table.Th>
              <Table.Th>Generated Name</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {names.map((name, idx) => (
              <Table.Tr key={name}>
                <Table.Td>
                  <Text size="sm">{getResourceTypeLabel(types[idx])}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="md" style={{ fontFamily: 'monospace', fontWeight: 500 }}>{name}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Divider my="xs" />
        <Text size="sm" fw={500} mb={4}>Name Components:</Text>
        <SimpleGrid cols={2} spacing={4} verticalSpacing={2}>
          <Text c="dimmed" size="sm">Resource Type:</Text>
          <Text size="sm">{Array.isArray(formState.resourceType) ? formState.resourceType.join(', ') : formState.resourceType}</Text>
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
      </section>
    );
  }

  return (
    <Paper radius="md" p="md" withBorder bg="gray.0">
      <Stack gap="xs">
        <Group justify="space-between" align="center" mb="xs">
          <Title order={4} size="h5">Generated Name{Array.isArray(validationState.generatedName) && validationState.generatedName.length > 1 ? 's' : ''}</Title>
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
        {/* Show all generated names if array, otherwise single */}
        {Array.isArray(validationState.generatedName) ? (
          validationState.generatedName.map((name, idx) => (
            <Group key={name} gap={8} align="center" mb={2}>
              <Code block fz="md" py={8} px={12} radius="md" mb="sm" style={{ fontSize: 16 }}>
                {name}
              </Code>
              <Text size="xs" c="dimmed">
                {getResourceTypeLabel(formState.resourceType[idx])}
              </Text>
            </Group>
          ))
        ) : (
          <Code block fz="md" py={8} px={12} radius="md" mb="sm" style={{ fontSize: 16 }}>
            {validationState.generatedName}
          </Code>
        )}
        <Divider my="xs" />
        <Text size="sm" fw={500} mb={4}>Name Components:</Text>
        <SimpleGrid cols={2} spacing={4} verticalSpacing={2}>
          <Text c="dimmed" size="sm">Resource Type:</Text>
          <Text size="sm">{Array.isArray(formState.resourceType) ? formState.resourceType.join(', ') : formState.resourceType}</Text>
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
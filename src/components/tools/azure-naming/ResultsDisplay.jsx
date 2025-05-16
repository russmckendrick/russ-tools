import React, { useState } from 'react';
import { Paper, Group, Text, Button, Table } from '@mantine/core';
import { IconCopy, IconCheck, IconDownload, IconDeviceFloppy } from '@tabler/icons-react';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const ResultsDisplay = ({ formState, validationState }) => {
  const { addToHistory, resourceTypes, environmentOptions, regionDropdownOptions } = useAzureNamingContext();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      let textToCopy = '';
      if (Array.isArray(validationState.generatedName)) {
        textToCopy = validationState.generatedName.join('\n');
      } else {
        textToCopy = validationState.generatedName;
      }
      await navigator.clipboard.writeText(textToCopy);
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

  // Helper to get label for a resource type value
  const getResourceTypeLabel = (value) => {
    const found = resourceTypes.find(rt => rt.value === value);
    return found ? found.label.replace(/ \([^)]+\)$/, '') : value;
  };
  // Helper to get environment display name
  const getEnvironmentLabel = (value) => {
    const found = environmentOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  };
  // Helper to get region display name
  const getRegionLabel = (value) => {
    const found = regionDropdownOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  };

  // Export handlers (CSV/Excel) - keep as is for now
  const handleExportCSV = () => {
    const names = Array.isArray(validationState.generatedName)
      ? validationState.generatedName
      : [validationState.generatedName];
    const types = Array.isArray(formState.resourceType)
      ? formState.resourceType
      : [formState.resourceType];
    const rows = names.map((name, idx) => ({
      'Generated Name': name,
      'Resource Type': getResourceTypeLabel(types[idx]),
      'Workload': formState.workload,
      'Environment': getEnvironmentLabel(formState.environment),
      'Region': getRegionLabel(formState.region),
      'Instance': formState.instance
    }));
    const csv = [Object.keys(rows[0]).join(','), ...rows.map(row => Object.values(row).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-resource-names.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const names = Array.isArray(validationState.generatedName)
      ? validationState.generatedName
      : [validationState.generatedName];
    const types = Array.isArray(formState.resourceType)
      ? formState.resourceType
      : [formState.resourceType];
    const rows = names.map((name, idx) => ({
      'Generated Name': name,
      'Resource Type': getResourceTypeLabel(types[idx]),
      'Workload': formState.workload,
      'Environment': getEnvironmentLabel(formState.environment),
      'Region': getRegionLabel(formState.region),
      'Instance': formState.instance
    }));
    const ws = XLSXUtils.json_to_sheet(rows);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, 'Names');
    XLSXWriteFile(wb, 'azure-resource-names.xlsx');
  };

  const handleSave = () => {
    const names = Array.isArray(validationState.generatedName)
      ? validationState.generatedName
      : [validationState.generatedName];
    const types = Array.isArray(formState.resourceType)
      ? formState.resourceType
      : [formState.resourceType];
    const group = names.map((name, idx) => ({
      resourceType: types[idx],
      generatedName: name
    }));
    addToHistory({
      id: uuidv4(),
      group,
      configuration: { ...formState },
      timestamp: Date.now()
    });
  };

  if (!validationState.generatedName || (Array.isArray(validationState.generatedName) && validationState.generatedName.length === 0)) {
    return null;
  }

  // Prepare data for table
  const names = Array.isArray(validationState.generatedName)
    ? validationState.generatedName
    : [validationState.generatedName];
  const types = Array.isArray(formState.resourceType)
    ? formState.resourceType
    : [formState.resourceType];

  return (
    <Paper radius="md" p="md" withBorder bg="gray.0" mt={24}>
      <Group mb="xs" justify="flex-end">
        <Button leftSection={<IconDownload size={16} />} variant="default" size="xs" onClick={handleExportCSV}>
          Export CSV
        </Button>
        <Button leftSection={<IconDownload size={16} />} variant="default" size="xs" onClick={handleExportExcel}>
          Export Excel
        </Button>
        <Button leftSection={<IconDeviceFloppy size={16} />} variant="filled" size="xs" color="blue" onClick={handleSave}>
          Save
        </Button>
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
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Generated Name</Table.Th>
            <Table.Th>Resource Type</Table.Th>
            <Table.Th>Workload</Table.Th>
            <Table.Th>Environment</Table.Th>
            <Table.Th>Region</Table.Th>
            <Table.Th>Instance</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {names.map((name, idx) => (
            <Table.Tr key={name + idx}>
              <Table.Td>
                <Text size="md" style={{ fontFamily: 'monospace', fontWeight: 500 }}>{name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getResourceTypeLabel(types[idx])}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formState.workload}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getEnvironmentLabel(formState.environment)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getRegionLabel(formState.region)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formState.instance}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};

export default ResultsDisplay; 
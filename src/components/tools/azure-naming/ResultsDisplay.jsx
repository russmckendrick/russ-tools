import React, { useState } from 'react';
import { Paper, Text, Button, Table, SimpleGrid } from '@mantine/core';
import { devError } from '../../../utils/devLog';
import { IconCopy, IconCheck, IconDownload, IconDeviceFloppy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAzureNamingContext } from './context/AzureNamingContext';
// ExcelJS is loaded dynamically to reduce bundle size
import { v4 as uuidv4 } from 'uuid';

const ResultsDisplay = ({ formState, validationState }) => {
  // Use a snapshot of the form state at the time of generation (if available)
  // Fallback to current formState if not present
  const generatedFormState = validationState.generatedFormState || formState;
  const { addToHistory, resourceTypes, environmentOptions, regionDropdownOptions } = useAzureNamingContext();
  const [copySuccess, setCopySuccess] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

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
      
      notifications.show({
        title: 'Copied to Clipboard',
        message: Array.isArray(validationState.generatedName) 
          ? `Copied ${validationState.generatedName.length} generated names`
          : 'Generated name copied successfully',
        color: 'green',
        icon: <IconCopy size={16} />
      });
    } catch (err) {
      devError('Failed to copy text: ', err);
      notifications.show({
        title: 'Copy Failed',
        message: 'Failed to copy to clipboard. Please try again.',
        color: 'red'
      });
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

    // Determine which optional columns to include
    const columns = [
      'Generated Name',
      'Resource Type',
      'Workload/Application Name',
      'Environment',
      'Region',
    ];
    if (showInstance) columns.push('Instance');
    if (showCustomPrefix) columns.push('Custom Prefix');
    if (showCustomSuffix) columns.push('Custom Suffix');
    if (showRandom) columns.push('Random Characters');

    const rows = names.map((name, idx) => {
      const row = {
        'Generated Name': name,
        'Resource Type': getResourceTypeLabel(types[idx]),
        'Workload/Application Name': formState.workload,
        'Environment': getEnvironmentLabel(formState.environment),
        'Region': getRegionLabel(formState.region),
      };
      if (showInstance) row['Instance'] = formState.instance;
      if (showCustomPrefix) row['Custom Prefix'] = formState.customPrefix;
      if (showCustomSuffix) row['Custom Suffix'] = formState.customSuffix;
      if (showRandom) row['Random Characters'] = formState.randomLength;
      return row;
    });

    const csv = [columns.join(','), ...rows.map(row => columns.map(col => `"${row[col] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure-resource-names.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    notifications.show({
      title: 'CSV Export Complete',
      message: 'Azure resource names exported successfully',
      color: 'green',
      icon: <IconDownload size={16} />
    });
  };

  const handleExportExcel = async () => {
    setExcelLoading(true);
    try {
      // Show loading notification
      notifications.show({
        id: 'excel-loading',
        title: 'Loading Excel Library',
        message: 'Preparing Excel export...',
        color: 'blue',
        loading: true,
        autoClose: false
      });
      
      // Dynamically import ExcelJS only when needed
      const ExcelJS = (await import('exceljs')).default;
      
      const names = Array.isArray(validationState.generatedName)
        ? validationState.generatedName
        : [validationState.generatedName];
      const types = Array.isArray(formState.resourceType)
        ? formState.resourceType
        : [formState.resourceType];

      // Determine which optional columns to include
      const columns = [
        'Generated Name',
        'Resource Type',
        'Workload/Application Name',
        'Environment',
        'Region',
      ];
      if (showInstance) columns.push('Instance');
      if (showCustomPrefix) columns.push('Custom Prefix');
      if (showCustomSuffix) columns.push('Custom Suffix');
      if (showRandom) columns.push('Random Characters');

      const rows = names.map((name, idx) => {
        const row = {
          'Generated Name': name,
          'Resource Type': getResourceTypeLabel(types[idx]),
          'Workload/Application Name': formState.workload,
          'Environment': getEnvironmentLabel(formState.environment),
          'Region': getRegionLabel(formState.region),
        };
        if (showInstance) row['Instance'] = formState.instance;
        if (showCustomPrefix) row['Custom Prefix'] = formState.customPrefix;
        if (showCustomSuffix) row['Custom Suffix'] = formState.customSuffix;
        if (showRandom) row['Random Characters'] = formState.randomLength;
        return row;
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Names');
      
      // Add headers
      worksheet.columns = columns.map(key => ({
        header: key,
        key: key,
        width: 20
      }));

      // Add rows
      worksheet.addRows(rows);

      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'azure-resource-names.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      
      // Hide loading notification and show success
      notifications.hide('excel-loading');
      notifications.show({
        title: 'Excel Export Complete',
        message: 'Azure resource names exported successfully',
        color: 'green',
        icon: <IconDownload size={16} />
      });
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      notifications.hide('excel-loading');
      notifications.show({
        title: 'Export Error',
        message: 'Failed to export Excel file. Please try again.',
        color: 'red',
        icon: <IconDownload size={16} />
      });
    } finally {
      setExcelLoading(false);
    }
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
    
    notifications.show({
      title: 'Names Saved',
      message: `Saved ${names.length} generated name${names.length > 1 ? 's' : ''} to history`,
      color: 'blue',
      icon: <IconDeviceFloppy size={16} />
    });
  };

  if (!validationState.generatedName || (Array.isArray(validationState.generatedName) && validationState.generatedName.length === 0)) {
    return null;
  }

  // Prepare data for table
  const names = Array.isArray(validationState.generatedName)
    ? validationState.generatedName
    : [validationState.generatedName];
  const types = Array.isArray(generatedFormState.resourceType)
    ? generatedFormState.resourceType
    : [generatedFormState.resourceType];

  // Determine which optional columns to show
  const showInstance = names.some(() => generatedFormState.instance && generatedFormState.instance !== '');
  const showCustomPrefix = names.some(() => generatedFormState.customPrefix && generatedFormState.customPrefix !== '');
  const showCustomSuffix = names.some(() => generatedFormState.customSuffix && generatedFormState.customSuffix !== '');
  const showRandom = names.some(() => generatedFormState.randomLength && Number(generatedFormState.randomLength) > 0);

  return (
    <Paper radius="md" p="md" withBorder mt={24}>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Generated Name</Table.Th>
            <Table.Th>Resource Type</Table.Th>
            <Table.Th>Workload/Application Name</Table.Th>
            <Table.Th>Environment</Table.Th>
            <Table.Th>Region</Table.Th>
            {showInstance && <Table.Th>Instance</Table.Th>}
            {showCustomPrefix && <Table.Th>Custom Prefix</Table.Th>}
            {showCustomSuffix && <Table.Th>Custom Suffix</Table.Th>}
            {showRandom && <Table.Th>Random Characters</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {names.map((name, idx) => (
            <Table.Tr key={name + idx}>
              <Table.Td>
                <Text size="sm" style={{ fontFamily: 'monospace', fontWeight: 500 }}>{name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getResourceTypeLabel(types[idx])}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{generatedFormState.workload}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getEnvironmentLabel(generatedFormState.environment)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getRegionLabel(generatedFormState.region)}</Text>
              </Table.Td>
              {showInstance && <Table.Td><Text size="sm">{generatedFormState.instance}</Text></Table.Td>}
              {showCustomPrefix && <Table.Td><Text size="sm">{generatedFormState.customPrefix}</Text></Table.Td>}
              {showCustomSuffix && <Table.Td><Text size="sm">{generatedFormState.customSuffix}</Text></Table.Td>}
              {showRandom && <Table.Td><Text size="sm">{generatedFormState.randomLength}</Text></Table.Td>}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <SimpleGrid cols={4} spacing="md" mt="md">
        <Button leftSection={<IconDownload size={16} />} variant="default" size="md" radius="md"fullWidth onClick={handleExportCSV}>
          Export CSV
        </Button>
        <Button 
          leftSection={<IconDownload size={16} />} 
          variant="default" 
          size="md" 
          radius="md" 
          fullWidth 
          onClick={handleExportExcel}
          loading={excelLoading}
          disabled={excelLoading}
        >
          {excelLoading ? 'Loading...' : 'Export Excel'}
        </Button>
        <Button leftSection={<IconDeviceFloppy size={16} />} variant="filled" size="md" color="blue" radius="md" fullWidth onClick={handleSave}>
          Save
        </Button>
        <Button
          onClick={handleCopy}
          size="md"
          fullWidth
          leftSection={copySuccess ? <IconCheck size={16} /> : <IconCopy size={16} />}
          color={copySuccess ? 'green' : 'blue'}
          variant={copySuccess ? 'light' : 'filled'}
          radius="md"
        >
          {copySuccess ? 'Copied!' : 'Copy'}
        </Button>
      </SimpleGrid>
    </Paper>
  );
};

export default ResultsDisplay; 
import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Title,
  Text,
  Checkbox,
  Button,
  Group,
  Table,
  Paper,
  Badge,
  ScrollArea,
  Select,
  TextInput,
  Alert,
  Accordion,
  Progress
} from '@mantine/core';
import {
  IconDownload,
  IconFileExport,
  IconPackageExport,
  IconInfoCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const BulkExport = ({ opened, onClose, favorites = [], history = [] }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [exportFormat, setExportFormat] = useState('kql');
  const [fileName, setFileName] = useState('azure-kql-queries');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Combine favorites and history with source identification
  const allQueries = [
    ...favorites.map(fav => ({ ...fav, source: 'favorites', type: 'favorite' })),
    ...history.map(hist => ({ ...hist, source: 'history', type: 'history' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(allQueries.map(q => q.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleExport = async () => {
    if (selectedItems.size === 0) {
      notifications.show({
        title: 'No Selection',
        message: 'Please select at least one query to export',
        color: 'orange'
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const selectedQueries = allQueries.filter(q => selectedItems.has(q.id));
      
      switch (exportFormat) {
        case 'kql':
          await exportAsKQL(selectedQueries);
          break;
        case 'json':
          await exportAsJSON(selectedQueries);
          break;
        case 'csv':
          await exportAsCSV(selectedQueries);
          break;
        case 'zip':
          await exportAsZip(selectedQueries);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      notifications.show({
        title: 'Export Complete',
        message: `Successfully exported ${selectedQueries.length} queries`,
        color: 'green',
        icon: <IconCheck size={16} />
      });

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      notifications.show({
        title: 'Export Failed',
        message: error.message || 'Failed to export queries',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportAsKQL = async (queries) => {
    let content = '';
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      setExportProgress((i / queries.length) * 100);
      
      content += `// Query: ${query.name || 'Untitled'}\n`;
      content += `// Service: ${query.service}\n`;
      content += `// Template: ${query.template}\n`;
      content += `// Created: ${new Date(query.timestamp).toLocaleString()}\n`;
      content += `// Source: ${query.source}\n`;
      
      if (query.description) {
        content += `// Description: ${query.description}\n`;
      }
      
      content += '\n';
      content += query.query;
      content += '\n\n';
      content += '// ' + '='.repeat(80) + '\n\n';
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    downloadFile(content, `${fileName}.kql`, 'text/plain');
  };

  const exportAsJSON = async (queries) => {
    const exportData = {
      exported: new Date().toISOString(),
      tool: 'Azure KQL Query Builder',
      version: '1.0.0',
      queryCount: queries.length,
      queries: []
    };

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      setExportProgress((i / queries.length) * 100);
      
      exportData.queries.push({
        id: query.id,
        name: query.name,
        description: query.description,
        service: query.service,
        template: query.template,
        parameters: query.parameters,
        query: query.query,
        timestamp: query.timestamp,
        source: query.source,
        tags: query.tags || []
      });
      
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    const content = JSON.stringify(exportData, null, 2);
    downloadFile(content, `${fileName}.json`, 'application/json');
  };

  const exportAsCSV = async (queries) => {
    const headers = [
      'Name',
      'Service',
      'Template',
      'Created',
      'Source',
      'Description',
      'Query'
    ];

    let content = headers.join(',') + '\n';

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      setExportProgress((i / queries.length) * 100);
      
      const row = [
        escapeCSV(query.name || 'Untitled'),
        escapeCSV(query.service),
        escapeCSV(query.template),
        escapeCSV(new Date(query.timestamp).toLocaleString()),
        escapeCSV(query.source),
        escapeCSV(query.description || ''),
        escapeCSV(query.query)
      ];

      content += row.join(',') + '\n';
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    downloadFile(content, `${fileName}.csv`, 'text/csv');
  };

  const exportAsZip = async (queries) => {
    // For ZIP export, we'll create individual KQL files
    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    // Create metadata file
    const metadata = {
      exported: new Date().toISOString(),
      tool: 'Azure KQL Query Builder',
      queryCount: queries.length,
      files: []
    };

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      setExportProgress((i / queries.length) * 100);
      
      const sanitizedName = sanitizeFileName(query.name || `query-${i + 1}`);
      const fileName = `${sanitizedName}.kql`;
      
      let fileContent = `// Query: ${query.name || 'Untitled'}\n`;
      fileContent += `// Service: ${query.service}\n`;
      fileContent += `// Template: ${query.template}\n`;
      fileContent += `// Created: ${new Date(query.timestamp).toLocaleString()}\n`;
      fileContent += `// Source: ${query.source}\n`;
      
      if (query.description) {
        fileContent += `// Description: ${query.description}\n`;
      }
      
      fileContent += '\n';
      fileContent += query.query;

      zip.file(fileName, fileContent);
      
      metadata.files.push({
        fileName,
        name: query.name,
        service: query.service,
        template: query.template,
        timestamp: query.timestamp
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Add metadata file
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${fileName}.zip`, 'application/zip');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const escapeCSV = (str) => {
    if (typeof str !== 'string') return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const sanitizeFileName = (name) => {
    return name.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-').toLowerCase();
  };

  const getFormatDescription = () => {
    switch (exportFormat) {
      case 'kql':
        return 'Single KQL file with all queries and metadata comments';
      case 'json':
        return 'Structured JSON format with full query metadata';
      case 'csv':
        return 'Spreadsheet-compatible format for analysis';
      case 'zip':
        return 'Individual KQL files in a ZIP archive with metadata';
      default:
        return '';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Bulk Export Queries"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          Export multiple queries from your favorites and history. Select the queries you want to export and choose your preferred format.
        </Alert>

        {/* Export Configuration */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Title order={4}>Export Settings</Title>
            
            <Group grow>
              <TextInput
                label="File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="azure-kql-queries"
              />
              
              <Select
                label="Export Format"
                value={exportFormat}
                onChange={setExportFormat}
                data={[
                  { value: 'kql', label: 'KQL File (.kql)' },
                  { value: 'json', label: 'JSON (.json)' },
                  { value: 'csv', label: 'CSV (.csv)' },
                  { value: 'zip', label: 'ZIP Archive (.zip)' }
                ]}
              />
            </Group>
            
            <Text size="sm" c="dimmed">
              {getFormatDescription()}
            </Text>
          </Stack>
        </Paper>

        {/* Query Selection */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Select Queries</Title>
              <Group gap="sm">
                <Checkbox
                  label="Select All"
                  checked={selectedItems.size === allQueries.length && allQueries.length > 0}
                  indeterminate={selectedItems.size > 0 && selectedItems.size < allQueries.length}
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                />
                <Badge size="sm">
                  {selectedItems.size} of {allQueries.length} selected
                </Badge>
              </Group>
            </Group>

            {allQueries.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No queries available for export. Create some queries first.
              </Text>
            ) : (
              <ScrollArea.Autosize mah={400}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th width={40}></Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Service</Table.Th>
                      <Table.Th>Template</Table.Th>
                      <Table.Th>Source</Table.Th>
                      <Table.Th>Created</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {allQueries.map((query) => (
                      <Table.Tr key={query.id}>
                        <Table.Td>
                          <Checkbox
                            checked={selectedItems.has(query.id)}
                            onChange={(e) => handleSelectItem(query.id, e.currentTarget.checked)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={4}>
                            <Text size="sm" fw={500}>
                              {query.name || 'Untitled Query'}
                            </Text>
                            {query.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {query.description}
                              </Text>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{query.service}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{query.template}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" color={query.source === 'favorites' ? 'yellow' : 'blue'}>
                            {query.source}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {new Date(query.timestamp).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            )}
          </Stack>
        </Paper>

        {/* Export Progress */}
        {isExporting && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Exporting queries...</Text>
                <Text size="sm">{Math.round(exportProgress)}%</Text>
              </Group>
              <Progress value={exportProgress} />
            </Stack>
          </Paper>
        )}

        {/* Actions */}
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            leftSection={<IconPackageExport size={16} />}
            onClick={handleExport}
            disabled={selectedItems.size === 0 || isExporting}
            loading={isExporting}
          >
            Export {selectedItems.size} Queries
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default BulkExport;
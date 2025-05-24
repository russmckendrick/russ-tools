import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Paper,
  Textarea,
  Button,
  Group,
  Text,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Tabs,
  Card,
  Grid,
  Select,
  NumberInput,
  Switch,
  Stack,
  Code,
  Accordion,
  Divider,
  CopyButton,
  Modal,
  ScrollArea
} from '@mantine/core';
import {
  IconFileText,
  IconCheck,
  IconX,
  IconCopy,
  IconDownload,
  IconUpload,
  IconBraces,
  IconMinusVertical,
  IconAlertCircle,
  IconInfoCircle,
  IconSettings,
  IconHistory,
  IconTrash,
  IconExternalLink
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMantineColorScheme } from '@mantine/core';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import '../../../styles/prism-theme.css';
import CompressIcon from './CompressIcon';

const JSONFormatterTool = () => {
  // State management
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [useSpaces, setUseSpaces] = useState(true);
  const [sortKeys, setSortKeys] = useState(false);
  const [showDataTypes, setShowDataTypes] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('formatter');
  const [analysisData, setAnalysisData] = useState(null);
  const [isMinified, setIsMinified] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  
  // Modal state
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('json-formatter-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newEntry) => {
    const updatedHistory = [newEntry, ...history].slice(0, 10); // Keep last 10 items
    setHistory(updatedHistory);
    localStorage.setItem('json-formatter-history', JSON.stringify(updatedHistory));
  }, [history]);

  // Analyze JSON structure
  const analyzeJSON = (obj, path = '') => {
    const analysis = {
      totalKeys: 0,
      totalValues: 0,
      dataTypes: {},
      depth: 0,
      arrays: [],
      objects: [],
      nullValues: 0,
      structure: []
    };

    const analyze = (value, currentPath, depth = 0) => {
      analysis.depth = Math.max(analysis.depth, depth);
      
      if (value === null) {
        analysis.nullValues++;
        return;
      }

      const type = Array.isArray(value) ? 'array' : typeof value;
      analysis.dataTypes[type] = (analysis.dataTypes[type] || 0) + 1;

      if (type === 'object') {
        analysis.objects.push(currentPath);
        analysis.totalKeys += Object.keys(value).length;
        Object.entries(value).forEach(([key, val]) => {
          analyze(val, currentPath ? `${currentPath}.${key}` : key, depth + 1);
        });
      } else if (type === 'array') {
        analysis.arrays.push({ path: currentPath, length: value.length });
        value.forEach((item, index) => {
          analyze(item, `${currentPath}[${index}]`, depth + 1);
        });
      } else {
        analysis.totalValues++;
      }
    };

    analyze(obj);
    return analysis;
  };

  // Validate and format JSON
  const processJSON = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setIsValid(null);
      setError('');
      setAnalysisData(null);
      setIsMinified(false);
      return;
    }

    // Don't auto-format if we're currently showing minified output
    if (isMinified) return;

    try {
      // Parse JSON
      const parsed = JSON.parse(input);
      setIsValid(true);
      setError('');

      // Analyze structure
      const analysis = analyzeJSON(parsed);
      setAnalysisData(analysis);

      // Sort keys if enabled
      const processedObject = sortKeys ? sortObjectKeys(parsed) : parsed;

      // Format JSON with specified indentation
      const indentString = useSpaces ? ' '.repeat(indentSize) : '\t';
      let formatted = JSON.stringify(processedObject, null, indentString);

      // Add data type annotations if enabled
      if (showDataTypes) {
        formatted = addDataTypeAnnotations(formatted, processedObject);
      }

      setOutput(formatted);

      // Save to history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        formatted: formatted.substring(0, 100) + (formatted.length > 100 ? '...' : ''),
        valid: true
      };
      saveHistory(historyEntry);

    } catch (err) {
      setIsValid(false);
      setError(err.message);
      setOutput('');
      setAnalysisData(null);
      setIsMinified(false);
    }
  }, [input, indentSize, useSpaces, sortKeys, showDataTypes, saveHistory, isMinified]);

  // Sort object keys recursively
  const sortObjectKeys = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }
    if (obj !== null && typeof obj === 'object') {
      const sorted = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObjectKeys(obj[key]);
      });
      return sorted;
    }
    return obj;
  };

  // Add data type annotations (simplified version)
  const addDataTypeAnnotations = (formatted, obj) => {
    // This is a simplified implementation
    // In a production app, you'd want more sophisticated annotation
    return formatted;
  };

  // Minify JSON
  const minifyJSON = () => {
    if (!isValid || !input.trim()) return;
    
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      
      setOutput(minified);
      setIsMinified(true);
      
      notifications.show({
        title: 'JSON Minified',
        message: `Reduced from ${input.length} to ${minified.length} characters`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Cannot minify invalid JSON',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Reformat JSON (undo minification)
  const reformatJSON = () => {
    if (!isValid || !input.trim()) return;
    
    try {
      const parsed = JSON.parse(input);
      
      // Sort keys if enabled
      const processedObject = sortKeys ? sortObjectKeys(parsed) : parsed;
      
      // Format JSON with specified indentation
      const indentString = useSpaces ? ' '.repeat(indentSize) : '\t';
      let formatted = JSON.stringify(processedObject, null, indentString);
      
      // Add data type annotations if enabled
      if (showDataTypes) {
        formatted = addDataTypeAnnotations(formatted, processedObject);
      }
      
      setOutput(formatted);
      setIsMinified(false);
      
      notifications.show({
        title: 'JSON Reformatted',
        message: 'JSON has been reformatted with current settings',
        color: 'blue',
        icon: <IconBraces size={16} />
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Cannot reformat invalid JSON',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Clear all data
  const clearAll = () => {
    setInput('');
    setOutput('');
    setIsValid(null);
    setError('');
    setAnalysisData(null);
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copied!',
      message: `${label} copied to clipboard`,
      color: 'green',
      icon: <IconCopy size={16} />
    });
  };

  // Download as file
  const downloadJSON = (content, filename) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load from file
  const loadFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInput(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Load from history
  const loadFromHistory = (entry) => {
    // This would load the full content, not just the preview
    // In a real implementation, you'd store the full content
    closeHistory();
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('json-formatter-history');
    closeHistory();
  };

  // Render highlighted JSON using Prism
  const renderHighlightedJSON = () => {
    if (!output) return null;
    
    const highlighted = Prism.highlight(output, Prism.languages.json, 'json');
    
    return (
      <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
        <pre style={{ 
          margin: 0, 
          padding: '1rem',
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
          borderRadius: 'var(--mantine-radius-md)',
          fontSize: '14px',
          lineHeight: 1.5,
          overflow: 'auto',
          minHeight: isMinified ? '60px' : '400px',
          maxHeight: '600px',
          border: colorScheme === 'dark' ? '1px solid var(--mantine-color-dark-4)' : '1px solid var(--mantine-color-gray-3)',
          fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}>
          <code 
            dangerouslySetInnerHTML={{ __html: highlighted }}
            className="language-json"
          />
        </pre>
      </div>
    );
  };

  // Auto-format on input change
  useEffect(() => {
    // Reset minified state when input changes
    setIsMinified(false);
    
    const timer = setTimeout(processJSON, 500);
    return () => clearTimeout(timer);
  }, [input]); // Remove processJSON and skipAutoFormat from dependencies

  // Separate effect for when settings change (but not input)
  useEffect(() => {
    if (!isMinified && input.trim()) {
      const timer = setTimeout(processJSON, 100);
      return () => clearTimeout(timer);
    }
  }, [indentSize, useSpaces, sortKeys, showDataTypes]);

  // Sample JSON for demo
  const sampleJSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zipCode": "12345",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "hobbies": ["reading", "coding", "hiking"],
  "isActive": true,
  "lastLogin": null,
  "metadata": {
    "createdAt": "2023-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:22:33Z"
  }
}`;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2" mb="xs">
              JSON Formatter & Validator
            </Title>
            <Text c="dimmed">
              Format, validate, and analyze JSON data with advanced features
            </Text>
          </div>
          
          <Group gap="xs">
            <Tooltip label="Settings">
              <ActionIcon
                variant="light"
                color="gray"
                size="lg"
                onClick={openSettings}
              >
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="History">
              <ActionIcon
                variant="light"
                color="gray"
                size="lg"
                onClick={openHistory}
              >
                <IconHistory size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="formatter" leftSection={<IconBraces size={16} />}>
              Formatter
            </Tabs.Tab>
            <Tabs.Tab value="analysis" leftSection={<IconInfoCircle size={16} />}>
              Analysis
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="formatter" pt="md">
            <Grid gutter="lg">
              {/* Input Panel */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder>
                  <Group justify="space-between" mb="md">
                    <Text fw={500}>Input JSON</Text>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => setInput(sampleJSON)}
                      >
                        Load Sample
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={loadFromFile}
                        id="file-input"
                      />
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconUpload size={14} />}
                        onClick={() => document.getElementById('file-input').click()}
                      >
                        Load File
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        onClick={clearAll}
                      >
                        Clear
                      </Button>
                    </Group>
                  </Group>
                  
                  <Textarea
                    placeholder="Paste your JSON here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    minRows={15}
                    maxRows={25}
                    autosize
                    styles={{
                      input: {
                        fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '14px'
                      }
                    }}
                  />
                  
                  {/* Input Status */}
                  {input && (
                    <Group justify="space-between" mt="xs">
                      <Group gap="xs">
                        {isValid === true && (
                          <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                            Valid JSON
                          </Badge>
                        )}
                        {isValid === false && (
                          <Badge color="red" variant="light" leftSection={<IconX size={12} />}>
                            Invalid JSON
                          </Badge>
                        )}
                        <Text size="xs" c="dimmed">
                          {input.length} characters
                        </Text>
                      </Group>
                    </Group>
                  )}
                  
                  {error && (
                    <Alert color="red" mt="xs" icon={<IconAlertCircle size={16} />}>
                      <Text size="sm" fw={500}>Syntax Error:</Text>
                      <Code color="red">{error}</Code>
                    </Alert>
                  )}
                </Card>
              </Grid.Col>

              {/* Output Panel */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder>
                  <Group justify="space-between" mb="md">
                    <Text fw={500}>Formatted JSON</Text>
                    <Group gap="xs">
                      {!isMinified ? (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<CompressIcon size={14} />}
                          onClick={minifyJSON}
                          disabled={!isValid}
                        >
                          Minify
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconBraces size={14} />}
                          onClick={reformatJSON}
                          disabled={!isValid}
                          color="blue"
                        >
                          Reformat
                        </Button>
                      )}
                      <CopyButton value={output}>
                        {({ copied, copy }) => (
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconCopy size={14} />}
                            onClick={copy}
                            disabled={!output}
                            color={copied ? 'green' : 'blue'}
                          >
                            {copied ? 'Copied' : 'Copy'}
                          </Button>
                        )}
                      </CopyButton>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconDownload size={14} />}
                        onClick={() => downloadJSON(output, 'formatted.json')}
                        disabled={!output}
                      >
                        Download
                      </Button>
                    </Group>
                  </Group>
                  
                  {renderHighlightedJSON()}
                  
                  {output && (
                    <Group justify="space-between" mt="xs">
                      <Text size="xs" c="dimmed">
                        {output.length} characters
                      </Text>
                      {input && output && (
                        <Text size="xs" c="dimmed">
                          {input.length > output.length ? 
                            `${((1 - output.length / input.length) * 100).toFixed(1)}% smaller` :
                            `${((output.length / input.length - 1) * 100).toFixed(1)}% larger`
                          }
                        </Text>
                      )}
                    </Group>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="analysis" pt="md">
            {analysisData ? (
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Title order={4} mb="md">Structure Analysis</Title>
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text>Total Keys:</Text>
                        <Badge>{analysisData.totalKeys}</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text>Total Values:</Text>
                        <Badge>{analysisData.totalValues}</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text>Max Depth:</Text>
                        <Badge>{analysisData.depth}</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text>Null Values:</Text>
                        <Badge color={analysisData.nullValues > 0 ? 'yellow' : 'green'}>
                          {analysisData.nullValues}
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder>
                    <Title order={4} mb="md">Data Types</Title>
                    <Stack gap="sm">
                      {Object.entries(analysisData.dataTypes).map(([type, count]) => (
                        <Group key={type} justify="space-between">
                          <Text tt="capitalize">{type}:</Text>
                          <Badge variant="light">{count}</Badge>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                </Grid.Col>
                
                {analysisData.arrays.length > 0 && (
                  <Grid.Col span={12}>
                    <Card withBorder>
                      <Title order={4} mb="md">Arrays</Title>
                      <Stack gap="xs">
                        {analysisData.arrays.map((arr, index) => (
                          <Group key={index} justify="space-between">
                            <Code>{arr.path || 'root'}</Code>
                            <Badge variant="light">{arr.length} items</Badge>
                          </Group>
                        ))}
                      </Stack>
                    </Card>
                  </Grid.Col>
                )}
              </Grid>
            ) : (
              <Paper p="xl" ta="center">
                <Text c="dimmed">Enter valid JSON to see analysis</Text>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>

        {/* Settings Modal */}
        <Modal
          opened={settingsOpened}
          onClose={closeSettings}
          title="Formatter Settings"
          size="md"
        >
          <Stack gap="lg">
            <NumberInput
              label="Indentation Size"
              description="Number of spaces for indentation"
              value={indentSize}
              onChange={setIndentSize}
              min={1}
              max={8}
              disabled={!useSpaces}
            />
            
            <Switch
              label="Use Spaces Instead of Tabs"
              description="Use spaces for indentation instead of tabs"
              checked={useSpaces}
              onChange={(e) => setUseSpaces(e.currentTarget.checked)}
            />
            
            <Switch
              label="Sort Keys Alphabetically"
              description="Sort object keys in alphabetical order"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.currentTarget.checked)}
            />
            
            <Switch
              label="Show Data Type Annotations"
              description="Add comments showing data types (experimental)"
              checked={showDataTypes}
              onChange={(e) => setShowDataTypes(e.currentTarget.checked)}
            />
          </Stack>
        </Modal>

        {/* History Modal */}
        <Modal
          opened={historyOpened}
          onClose={closeHistory}
          title="Formatting History"
          size="lg"
        >
          <ScrollArea h={400}>
            {history.length > 0 ? (
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Last {history.length} operations</Text>
                  <Button size="xs" variant="light" color="red" onClick={clearHistory}>
                    Clear History
                  </Button>
                </Group>
                
                {history.map((entry) => (
                  <Card key={entry.id} withBorder p="md">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={500}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </Text>
                      <Badge color={entry.valid ? 'green' : 'red'} size="sm">
                        {entry.valid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mb="xs">Input:</Text>
                    <Code block>{entry.input}</Code>
                    {entry.formatted && (
                      <>
                        <Text size="xs" c="dimmed" mt="xs" mb="xs">Output:</Text>
                        <Code block>{entry.formatted}</Code>
                      </>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      mt="xs"
                      onClick={() => loadFromHistory(entry)}
                    >
                      Load This JSON
                    </Button>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Paper p="xl" ta="center">
                <Text c="dimmed">No history available</Text>
              </Paper>
            )}
          </ScrollArea>
        </Modal>
      </Stack>
    </Container>
  );
};

export default JSONFormatterTool; 
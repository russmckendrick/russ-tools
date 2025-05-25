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
  Divider,
  CopyButton,
  Modal,
  ScrollArea,
  SegmentedControl
} from '@mantine/core';
import {
  IconFileText,
  IconCheck,
  IconX,
  IconCopy,
  IconDownload,
  IconUpload,
  IconBraces,
  IconAlertCircle,
  IconInfoCircle,
  IconSettings,
  IconHistory,
  IconTrash,
  IconArrowRight,
  IconRefresh,
  IconCode
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMantineColorScheme } from '@mantine/core';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import '../../../styles/prism-theme.css';
import yaml from 'js-yaml';
import TOML from '@iarna/toml';
import CompressIcon from './CompressIcon';

const DataConverterTool = () => {
  // State management
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [inputFormat, setInputFormat] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('json');
  const [detectedFormat, setDetectedFormat] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [useSpaces, setUseSpaces] = useState(true);
  const [sortKeys, setSortKeys] = useState(false);
  const [yamlFlowStyle, setYamlFlowStyle] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('converter');
  const [analysisData, setAnalysisData] = useState(null);
  const [isMinified, setIsMinified] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  
  // Modal state
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  // Format options
  const formatOptions = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'toml', label: 'TOML' }
  ];

  const outputFormatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'toml', label: 'TOML' }
  ];

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('data-converter-history');
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
    localStorage.setItem('data-converter-history', JSON.stringify(updatedHistory));
  }, [history]);

  // Auto-detect format
  const detectFormat = (text) => {
    if (!text.trim()) return null;
    
    // Try JSON first
    try {
      JSON.parse(text);
      return 'json';
    } catch (e) {
      // Not JSON, continue
    }
    
    // Try YAML
    try {
      yaml.load(text);
      // Additional check: if it looks like TOML, prefer TOML
      if (text.includes('[') && text.includes(']') && text.includes('=')) {
        try {
          TOML.parse(text);
          return 'toml';
        } catch (e) {
          return 'yaml';
        }
      }
      return 'yaml';
    } catch (e) {
      // Not YAML, try TOML
    }
    
    // Try TOML
    try {
      TOML.parse(text);
      return 'toml';
    } catch (e) {
      // Not any recognized format
    }
    
    return null;
  };

  // Parse input based on format
  const parseInput = (text, format) => {
    if (!text.trim()) return null;
    
    const actualFormat = format === 'auto' ? detectFormat(text) : format;
    
    switch (actualFormat) {
      case 'json':
        return JSON.parse(text);
      case 'yaml':
        return yaml.load(text);
      case 'toml':
        return TOML.parse(text);
      default:
        throw new Error('Unknown or unsupported format');
    }
  };

  // Convert data to output format
  const convertToFormat = (data, format) => {
    switch (format) {
      case 'json':
        const indentString = useSpaces ? ' '.repeat(indentSize) : '\t';
        const processedData = sortKeys ? sortObjectKeys(data) : data;
        return JSON.stringify(processedData, null, indentString);
      
      case 'yaml':
        const yamlOptions = {
          indent: indentSize,
          flowLevel: yamlFlowStyle ? 0 : -1,
          sortKeys: sortKeys
        };
        return yaml.dump(data, yamlOptions);
      
      case 'toml':
        // TOML doesn't support all JSON structures (like nested arrays of objects)
        try {
          return TOML.stringify(data);
        } catch (e) {
          throw new Error(`Cannot convert to TOML: ${e.message}`);
        }
      
      default:
        throw new Error('Unsupported output format');
    }
  };

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

  // Analyze data structure
  const analyzeData = (obj, path = '') => {
    const analysis = {
      totalKeys: 0,
      totalValues: 0,
      dataTypes: {},
      depth: 0,
      arrays: [],
      objects: [],
      nullValues: 0
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

  // Process and convert data
  const processData = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setIsValid(null);
      setError('');
      setAnalysisData(null);
      setDetectedFormat(null);
      setIsMinified(false);
      return;
    }

    try {
      // Parse input
      const actualInputFormat = inputFormat === 'auto' ? detectFormat(input) : inputFormat;
      setDetectedFormat(actualInputFormat);
      
      if (!actualInputFormat) {
        throw new Error('Could not detect format. Please specify the input format manually.');
      }

      const parsedData = parseInput(input, inputFormat);
      setIsValid(true);
      setError('');

      // Analyze structure
      const analysis = analyzeData(parsedData);
      setAnalysisData(analysis);

      // Convert to output format
      const converted = convertToFormat(parsedData, outputFormat);
      setOutput(converted);

      // Save to history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        inputFormat: actualInputFormat,
        outputFormat,
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        output: converted.substring(0, 100) + (converted.length > 100 ? '...' : ''),
        valid: true
      };
      saveHistory(historyEntry);

    } catch (err) {
      setIsValid(false);
      setError(err.message);
      setOutput('');
      setAnalysisData(null);
      setDetectedFormat(null);
      setIsMinified(false);
    }
  }, [input, inputFormat, outputFormat, indentSize, useSpaces, sortKeys, yamlFlowStyle, saveHistory]);

  // Minify output (for all formats)
  const minifyOutput = () => {
    if (!isValid || !input.trim()) return;
    
    try {
      const actualInputFormat = inputFormat === 'auto' ? detectFormat(input) : inputFormat;
      const parsedData = parseInput(input, inputFormat);
      
      let minified;
      switch (outputFormat) {
        case 'json':
          minified = JSON.stringify(parsedData);
          break;
        case 'yaml':
          minified = yaml.dump(parsedData, { flowLevel: 0, indent: 0 });
          break;
        case 'toml':
          minified = TOML.stringify(parsedData).replace(/\n\s*\n/g, '\n');
          break;
        default:
          return;
      }
      
      setOutput(minified);
      setIsMinified(true);
      
      notifications.show({
        title: `${outputFormat.toUpperCase()} Minified`,
        message: `Reduced from ${output.length} to ${minified.length} characters`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Cannot minify invalid data',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Reformat output
  const reformatOutput = () => {
    if (!isValid || !input.trim()) return;
    
    try {
      const actualInputFormat = inputFormat === 'auto' ? detectFormat(input) : inputFormat;
      const parsedData = parseInput(input, inputFormat);
      const reformatted = convertToFormat(parsedData, outputFormat);
      
      setOutput(reformatted);
      setIsMinified(false);
      
      notifications.show({
        title: 'Data Reformatted',
        message: 'Data has been reformatted with current settings',
        color: 'blue',
        icon: <IconRefresh size={16} />
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Cannot reformat invalid data',
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
    setDetectedFormat(null);
    setIsMinified(false);
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
  const downloadFile = (content, format) => {
    const extensions = { json: 'json', yaml: 'yml', toml: 'toml' };
    const mimeTypes = { 
      json: 'application/json', 
      yaml: 'text/yaml', 
      toml: 'text/plain' 
    };
    
    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${extensions[format]}`;
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
        
        // Try to detect format from file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (['json', 'yaml', 'yml', 'toml'].includes(extension)) {
          const formatMap = { json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml' };
          setInputFormat(formatMap[extension]);
        }
      };
      reader.readAsText(file);
    }
  };

  // Load from history
  const loadFromHistory = (entry) => {
    // This would load the full content in a real implementation
    closeHistory();
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('data-converter-history');
    closeHistory();
  };

  // Get syntax highlighting language
  const getSyntaxLanguage = (format) => {
    switch (format) {
      case 'json': return 'json';
      case 'yaml': return 'yaml';
      case 'toml': return 'toml';
      default: return 'text';
    }
  };

  // Render highlighted code using Prism
  const renderHighlightedCode = (code, format) => {
    if (!code) return null;
    
    const language = getSyntaxLanguage(format);
    const highlighted = Prism.highlight(code, Prism.languages[language] || Prism.languages.text, language);
    
    return (
      <div className={colorScheme === 'dark' ? 'prism-dark' : ''}>
        <pre style={{ 
          margin: 0, 
          padding: '1.25rem',
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: 1.6,
          overflow: 'auto',
          minHeight: isMinified ? '80px' : '420px',
          maxHeight: '650px',
          border: `2px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
          fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}>
          <code 
            dangerouslySetInnerHTML={{ __html: highlighted }}
            className={`language-${language}`}
            style={{ display: 'block' }}
          />
          {/* Format indicator */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            backgroundColor: 'var(--mantine-color-blue-6)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            {format}
          </div>
        </pre>
      </div>
    );
  };

  // Auto-process on input change
  useEffect(() => {
    setIsMinified(false);
    const timer = setTimeout(processData, 500);
    return () => clearTimeout(timer);
  }, [input, inputFormat]);

  // Process when settings change
  useEffect(() => {
    if (!isMinified && input.trim()) {
      const timer = setTimeout(processData, 100);
      return () => clearTimeout(timer);
    }
  }, [outputFormat, indentSize, useSpaces, sortKeys, yamlFlowStyle]);

  // Sample data for different formats
  const sampleData = {
    json: `{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zipCode": "12345"
  },
  "hobbies": ["reading", "coding", "hiking"],
  "isActive": true,
  "lastLogin": null
}`,
    yaml: `name: John Doe
age: 30
email: john.doe@example.com
address:
  street: 123 Main St
  city: Anytown
  zipCode: "12345"
hobbies:
  - reading
  - coding
  - hiking
isActive: true
lastLogin: null`,
    toml: `name = "John Doe"
age = 30
email = "john.doe@example.com"
isActive = true
lastLogin = ""
hobbies = ["reading", "coding", "hiking"]

[address]
street = "123 Main St"
city = "Anytown"
zipCode = "12345"`
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2" mb="xs">
              Data Format Converter
            </Title>
            <Text c="dimmed">
              Convert between JSON, YAML, and TOML formats with validation and formatting
            </Text>
          </div>
          
          <Group gap="xs">
            <Tooltip label="Clear All">
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                onClick={clearAll}
              >
                <IconTrash size={20} />
              </ActionIcon>
            </Tooltip>
            
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

        {/* Format Selection */}
        <Card withBorder p="xl" radius="lg" style={{ background: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)' }}>
          <Stack gap="lg">
            <Group justify="center">
              <Text size="lg" fw={600} c={colorScheme === 'dark' ? 'white' : 'dark'}>
                Format Converter
              </Text>
            </Group>
            
            <Grid gutter="xl" align="center">
              <Grid.Col span={{ base: 12, sm: 5 }}>
                <Stack gap="sm">
                  <Select
                    label="Input Format"
                    value={inputFormat}
                    onChange={setInputFormat}
                    data={formatOptions}
                    size="md"
                    styles={{
                      label: { fontWeight: 600, marginBottom: 8 },
                      input: { fontSize: '16px' }
                    }}
                  />
                  {detectedFormat && inputFormat === 'auto' && (
                    <Group gap="xs" justify="center">
                      <Badge 
                        color="green" 
                        variant="light" 
                        leftSection={<IconCheck size={12} />}
                        size="sm"
                      >
                        Detected: {detectedFormat.toUpperCase()}
                      </Badge>
                    </Group>
                  )}
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <Stack align="center" gap="xs">
                  <ActionIcon
                    size="xl"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                    onClick={processData}
                    disabled={!input.trim()}
                    style={{ 
                      transition: 'all 0.2s ease',
                      transform: !input.trim() ? 'scale(0.9)' : 'scale(1)',
                    }}
                  >
                    <IconArrowRight size={24} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    Convert
                  </Text>
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 5 }}>
                <Select
                  label="Output Format"
                  value={outputFormat}
                  onChange={setOutputFormat}
                  data={outputFormatOptions}
                  size="md"
                  styles={{
                    label: { fontWeight: 600, marginBottom: 8 },
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>
            </Grid>
            

          </Stack>
        </Card>

        {/* Sample Data Pills */}
        <Group justify="center" gap="md">
          <Text size="sm" c="dimmed" fw={500}>Quick Start:</Text>
          {Object.entries(sampleData).map(([format, data]) => (
            <Button
              key={format}
              size="xs"
              variant={input === data ? "filled" : "light"}
              onClick={() => setInput(data)}
              style={{ textTransform: 'uppercase' }}
              radius="xl"
            >
              {format} Sample
            </Button>
          ))}
        </Group>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="converter" leftSection={<IconCode size={16} />}>
              Converter
            </Tabs.Tab>
            <Tabs.Tab value="analysis" leftSection={<IconInfoCircle size={16} />}>
              Analysis
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="converter" pt="md">
            <Grid gutter="lg">
              {/* Input Panel */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="lg" style={{ height: '100%' }}>
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={600} size="lg">
                          Input Data
                        </Text>
                        {detectedFormat && (
                          <Badge color="blue" variant="light" size="sm" mt={4}>
                            {detectedFormat.toUpperCase()} Format
                          </Badge>
                        )}
                      </div>
                      <Group gap="xs">
                        <input
                          type="file"
                          accept=".json,.yaml,.yml,.toml"
                          style={{ display: 'none' }}
                          onChange={loadFromFile}
                          id="file-input"
                        />
                        <Tooltip label="Load from file">
                          <ActionIcon
                            variant="light"
                            size="lg"
                            onClick={() => document.getElementById('file-input').click()}
                          >
                            <IconUpload size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>


                  </Stack>
                  
                  <Textarea
                    placeholder="Paste your data here or use the sample data buttons above..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    minRows={16}
                    maxRows={28}
                    autosize
                    styles={{
                      input: {
                        fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        border: '2px solid var(--mantine-color-gray-3)',
                        borderRadius: '8px',
                        backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
                        '&:focus': {
                          borderColor: 'var(--mantine-color-blue-5)',
                          boxShadow: '0 0 0 2px var(--mantine-color-blue-1)'
                        }
                      }
                    }}
                  />
                  
                  {/* Input Status */}
                  {input && (
                    <Card withBorder p="sm" radius="md" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' }}>
                      <Group justify="space-between" align="center">
                        <Group gap="md">
                          {isValid === true && (
                            <Badge 
                              color="green" 
                              variant="filled" 
                              leftSection={<IconCheck size={14} />}
                              size="md"
                            >
                              Valid {detectedFormat?.toUpperCase() || 'Data'}
                            </Badge>
                          )}
                          {isValid === false && (
                            <Badge 
                              color="red" 
                              variant="filled" 
                              leftSection={<IconX size={14} />}
                              size="md"
                            >
                              Invalid Data
                            </Badge>
                          )}
                          {isValid === null && input.trim() && (
                            <Badge 
                              color="yellow" 
                              variant="filled" 
                              size="md"
                            >
                              Processing...
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed" fw={500}>
                          {input.length.toLocaleString()} characters
                        </Text>
                      </Group>
                    </Card>
                  )}
                  
                  {error && (
                    <Alert 
                      color="red" 
                      icon={<IconAlertCircle size={20} />}
                      title="Parsing Error"
                      radius="md"
                      styles={{
                        root: { border: '2px solid var(--mantine-color-red-3)' },
                        title: { fontSize: '16px', fontWeight: 600 }
                      }}
                    >
                      <Stack gap="xs">
                        <Text size="sm">
                          There's an issue with your input data. Please check the format and try again.
                        </Text>
                        <Code 
                          block 
                          color="red"
                          style={{ 
                            backgroundColor: 'var(--mantine-color-red-0)',
                            border: '1px solid var(--mantine-color-red-2)',
                            padding: '8px',
                            borderRadius: '4px'
                          }}
                        >
                          {error}
                        </Code>
                      </Stack>
                    </Alert>
                  )}
                </Card>
              </Grid.Col>

              {/* Output Panel */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="lg" style={{ height: '100%' }}>
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={600} size="lg">
                          Output Data
                        </Text>
                        <Badge color="green" variant="light" size="sm" mt={4}>
                          {outputFormat.toUpperCase()} Format
                        </Badge>
                      </div>
                      <Group gap="xs">
                        {!isMinified && (
                          <Tooltip label={`Minify ${outputFormat.toUpperCase()}`}>
                            <ActionIcon
                              variant="light"
                              size="lg"
                              onClick={minifyOutput}
                              disabled={!isValid}
                            >
                              <CompressIcon size={18} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {isMinified && (
                          <Tooltip label="Reformat">
                            <ActionIcon
                              variant="light"
                              size="lg"
                              onClick={reformatOutput}
                              disabled={!isValid}
                              color="blue"
                            >
                              <IconBraces size={18} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <CopyButton value={output}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? "Copied!" : "Copy to clipboard"}>
                              <ActionIcon
                                variant="light"
                                size="lg"
                                onClick={copy}
                                disabled={!output}
                                color={copied ? 'green' : 'blue'}
                              >
                                <IconCopy size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                        <Tooltip label="Download file">
                          <ActionIcon
                            variant="light"
                            size="lg"
                            onClick={() => downloadFile(output, outputFormat)}
                            disabled={!output}
                          >
                            <IconDownload size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>


                  </Stack>
                  
                  {renderHighlightedCode(output, outputFormat)}
                  
                  {output && (
                    <Card withBorder p="sm" radius="md" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' }}>
                      <Group justify="space-between" align="center">
                        <Group gap="md">
                          <Badge color="blue" variant="filled" size="md">
                            Converted Successfully
                          </Badge>
                          {isMinified && (
                            <Badge color="orange" variant="light" size="sm">
                              Minified
                            </Badge>
                          )}
                        </Group>
                        <Group gap="md">
                          <Text size="sm" c="dimmed" fw={500}>
                            {output.length.toLocaleString()} characters
                          </Text>
                          {input && output && (
                            <Badge 
                              color={input.length > output.length ? 'green' : 'blue'} 
                              variant="light" 
                              size="sm"
                            >
                              {input.length > output.length ? 
                                `${((1 - output.length / input.length) * 100).toFixed(1)}% smaller` :
                                `${((output.length / input.length - 1) * 100).toFixed(1)}% larger`
                              }
                            </Badge>
                          )}
                        </Group>
                      </Group>
                    </Card>
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
                <Text c="dimmed">Enter valid data to see analysis</Text>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>

        {/* Settings Modal */}
        <Modal
          opened={settingsOpened}
          onClose={closeSettings}
          title="Converter Settings"
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
            
            <Divider label="YAML Options" />
            
            <Switch
              label="Use Flow Style"
              description="Use compact flow style for YAML output"
              checked={yamlFlowStyle}
              onChange={(e) => setYamlFlowStyle(e.currentTarget.checked)}
              disabled={outputFormat !== 'yaml'}
            />
          </Stack>
        </Modal>

        {/* History Modal */}
        <Modal
          opened={historyOpened}
          onClose={closeHistory}
          title="Conversion History"
          size="lg"
        >
          <ScrollArea h={400}>
            {history.length > 0 ? (
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Last {history.length} conversions</Text>
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
                      <Group gap="xs">
                        <Badge size="sm">{entry.inputFormat?.toUpperCase()}</Badge>
                        <IconArrowRight size={12} />
                        <Badge size="sm">{entry.outputFormat?.toUpperCase()}</Badge>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed" mb="xs">Input:</Text>
                    <Code block>{entry.input}</Code>
                    {entry.output && (
                      <>
                        <Text size="xs" c="dimmed" mt="xs" mb="xs">Output:</Text>
                        <Code block>{entry.output}</Code>
                      </>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      mt="xs"
                      onClick={() => loadFromHistory(entry)}
                    >
                      Load This Data
                    </Button>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Paper p="xl" ta="center">
                <Text c="dimmed">No conversion history available</Text>
              </Paper>
            )}
          </ScrollArea>
        </Modal>
      </Stack>
    </Container>
  );
};

export default DataConverterTool; 
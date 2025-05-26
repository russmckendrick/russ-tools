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
  SegmentedControl,
  ThemeIcon
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
import JSONIcon from './JSONIcon';
import { 
  validateJSON, 
  validateYAML, 
  validateTOML, 
  validateWithDetection, 
  validateWithSchema,
  formatErrorForDisplay,
  commonSchemas,
  ValidationError
} from './validation';
import { loadSampleData } from './samples';

const DataConverterTool = () => {
  // Format color scheme
  const formatColors = {
    json: 'blue',
    yaml: 'cyan', 
    toml: 'violet'
  };

  // State management
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [inputFormat, setInputFormat] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('json');
  const [detectedFormat, setDetectedFormat] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [schemaValidation, setSchemaValidation] = useState({
    enabled: false,
    schema: commonSchemas.user, // Initialize with default schema
    customSchema: '',
    selectedSchema: 'user',
    results: null
  });
  const [indentSize, setIndentSize] = useState(2);
  const [useSpaces, setUseSpaces] = useState(true);
  const [sortKeys, setSortKeys] = useState(false);

  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('converter');
  const [analysisData, setAnalysisData] = useState(null);
  const [isMinified, setIsMinified] = useState(false);
  const [sampleData, setSampleData] = useState({
    json: '{"loading": true}',
    yaml: 'loading: true',
    toml: 'loading = true'
  });
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

  // Load history from localStorage and sample data on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('data-converter-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }

    // Load sample data from external files
    try {
      const samples = loadSampleData();
      setSampleData(samples);
    } catch (error) {
      console.error('Failed to load sample data:', error);
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
    
    // Check for TOML patterns before YAML (since YAML is more permissive)
    const tomlPatterns = [
      /^\s*\[.*\]\s*$/m,           // Section headers like [server]
      /^\s*\w+\s*=\s*.+$/m,        // Key-value pairs like key = "value"
      /^\s*#.*$/m,                 // Comments starting with #
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime format
      /^\s*\[\[.*\]\]\s*$/m        // Array of tables like [[products]]
    ];
    
    const hasTomlPatterns = tomlPatterns.some(pattern => pattern.test(text));
    
    if (hasTomlPatterns) {
      try {
        TOML.parse(text);
        return 'toml';
      } catch (e) {
        // Might look like TOML but isn't valid, continue to YAML
      }
    }
    
    // Try YAML
    try {
      yaml.load(text);
      return 'yaml';
    } catch (e) {
      // Not YAML, try TOML as fallback
    }
    
    // Try TOML as final fallback
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
          sortKeys: sortKeys
        };
        return yaml.dump(data, yamlOptions);
      
      case 'toml':
        // TOML doesn't support all JSON structures (like nested arrays of objects)
        try {
          return TOML.stringify(data);
        } catch (e) {
          // Provide more helpful error messages for TOML conversion limitations
          let errorMessage = e.message;
          let suggestions = [];
          
          if (errorMessage.includes('stringify objects') || errorMessage.includes('Can only stringify')) {
            errorMessage = "TOML can only convert simple objects, not arrays or primitive values at the root level";
            suggestions.push("Wrap your data in an object: { data: [your array] }");
            suggestions.push("TOML requires a top-level object structure");
            suggestions.push("Consider using JSON or YAML for complex nested structures");
          } else if (errorMessage.includes('nested') || errorMessage.includes('array')) {
            errorMessage = "TOML doesn't support complex nested arrays of objects";
            suggestions.push("Flatten your data structure or use simpler arrays");
            suggestions.push("TOML works best with simple key-value pairs and basic arrays");
            suggestions.push("Consider using JSON or YAML for complex nested data");
          } else if (errorMessage.includes('circular') || errorMessage.includes('reference')) {
            errorMessage = "TOML cannot handle circular references in objects";
            suggestions.push("Remove circular references from your data");
            suggestions.push("Ensure objects don't reference themselves");
          } else if (errorMessage.includes('function') || errorMessage.includes('undefined')) {
            errorMessage = "TOML cannot serialize functions or undefined values";
            suggestions.push("Remove functions and undefined values from your data");
            suggestions.push("TOML only supports basic data types: strings, numbers, booleans, arrays, and objects");
          } else {
            // Generic TOML conversion error
            errorMessage = `TOML conversion failed: ${errorMessage}`;
            suggestions.push("TOML has limitations - it works best with simple, flat data structures");
            suggestions.push("Try converting to JSON or YAML instead for complex data");
            suggestions.push("Ensure your data contains only basic types: strings, numbers, booleans, arrays, and simple objects");
          }
          
          // Create a more detailed error with suggestions
          const detailedError = new Error(errorMessage);
          detailedError.suggestions = suggestions;
          detailedError.format = 'TOML';
          throw detailedError;
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

  // Process and convert data with enhanced validation
  const processData = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setIsValid(null);
      setError('');
      setValidationErrors([]);
      setAnalysisData(null);
      setDetectedFormat(null);
      setIsMinified(false);
      return;
    }

    // Use enhanced validation
    let validationResult;
    
    if (inputFormat === 'auto') {
      validationResult = validateWithDetection(input);
    } else {
      switch (inputFormat) {
        case 'json':
          validationResult = validateJSON(input);
          break;
        case 'yaml':
          validationResult = validateYAML(input);
          break;
        case 'toml':
          validationResult = validateTOML(input);
          break;
        default:
          validationResult = validateWithDetection(input);
      }
    }

    if (validationResult.success) {
      // Validation successful
      setIsValid(true);
      setError('');
      setValidationErrors([]);
      setDetectedFormat(validationResult.detectedFormat || inputFormat);

      try {
        // Analyze structure
        const analysis = analyzeData(validationResult.data);
        setAnalysisData(analysis);

        // Convert to output format
        const converted = convertToFormat(validationResult.data, outputFormat);
        setOutput(converted);

        // Perform schema validation if enabled
        if (schemaValidation.enabled && schemaValidation.schema) {
          try {
            const schemaResult = validateWithSchema(
              validationResult.data, 
              schemaValidation.schema,
              input,
              validationResult.detectedFormat || inputFormat
            );
            setSchemaValidation(prev => ({ ...prev, results: schemaResult }));
          } catch (schemaError) {
            console.error('Schema validation error:', schemaError);
            setSchemaValidation(prev => ({ 
              ...prev, 
              results: {
                success: false,
                data: null,
                errors: [{ message: `Schema validation failed: ${schemaError.message}` }]
              }
            }));
          }
        } else {
          setSchemaValidation(prev => ({ ...prev, results: null }));
        }

        // Save to history
        const historyEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          inputFormat: validationResult.detectedFormat || inputFormat,
          outputFormat,
          input: input.substring(0, 100) + (input.length > 100 ? '...' : ''), // Display preview
          output: converted.substring(0, 100) + (converted.length > 100 ? '...' : ''), // Display preview
          fullInput: input, // Store full input for loading
          fullOutput: converted, // Store full output for reference
          valid: true
        };
        saveHistory(historyEntry);

      } catch (conversionErr) {
        // Conversion error (e.g., TOML conversion limitations)
        setIsValid(false);
        
        // Check if this is an enhanced error with suggestions
        if (conversionErr.suggestions && conversionErr.suggestions.length > 0) {
          // Create a validation error object for better display
          const enhancedError = {
            message: conversionErr.message,
            suggestions: conversionErr.suggestions,
            format: conversionErr.format || outputFormat.toUpperCase()
          };
          setValidationErrors([enhancedError]);
          setError('');
        } else {
          // Fallback to simple error message
          setError(`Conversion Error: ${conversionErr.message}`);
          setValidationErrors([]);
        }
        
        setOutput('');
        setAnalysisData(null);
        setIsMinified(false);
      }
    } else {
      // Validation failed
      setIsValid(false);
      setValidationErrors(validationResult.errors || []);
      setError('');
      setOutput('');
      setAnalysisData(null);
      setDetectedFormat(null);
      setIsMinified(false);
    }
  }, [input, inputFormat, outputFormat, indentSize, useSpaces, sortKeys, saveHistory]);

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
    setValidationErrors([]);
    setAnalysisData(null);
    setDetectedFormat(null);
    setIsMinified(false);
    setSchemaValidation(prev => ({ ...prev, results: null }));
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
    // Load the full input data from history entry
    // Note: We only store truncated versions in history, so we'll need to store full content
    // For now, we'll use what we have and show a notification about truncation
    if (entry.fullInput) {
      setInput(entry.fullInput);
    } else {
      // Fallback to truncated input with notification
      setInput(entry.input);
      if (entry.input.endsWith('...')) {
        notifications.show({
          title: 'Partial Data Loaded',
          message: 'Only a preview of the original data was stored in history',
          color: 'yellow',
          icon: <IconInfoCircle size={16} />
        });
      }
    }
    
    // Set the input format if available
    if (entry.inputFormat && entry.inputFormat !== 'auto') {
      setInputFormat(entry.inputFormat);
    }
    
    // Set the output format
    if (entry.outputFormat) {
      setOutputFormat(entry.outputFormat);
    }
    
    closeHistory();
    
    notifications.show({
      title: 'Data Loaded',
      message: 'Historical conversion data has been loaded',
      color: 'green',
      icon: <IconCheck size={16} />
    });
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
      <div className={colorScheme === 'dark' ? 'prism-dark' : ''} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <pre style={{ 
          margin: 0, 
          padding: '1.25rem',
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: 1.6,
          overflow: 'auto',
          flex: 1,
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
  }, [outputFormat, indentSize, useSpaces, sortKeys]);



  return (
    <Paper p="xl" radius="lg" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <ThemeIcon size={48} radius="md" color="yellow" variant="light">
              <JSONIcon size={28} />
            </ThemeIcon>
            <div>
              <Title order={2} fw={600}>
                Data Converter
              </Title>
              <Text size="sm" c="dimmed">
                Convert between JSON, YAML, and TOML formats with validation and formatting
              </Text>
            </div>
          </Group>
          
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
            
            <Grid gutter="xl" align="flex-start">
              <Grid.Col span={{ base: 12, sm: 5 }}>
                <Select
                  label={
                    <Group gap="xs" align="center">
                      <Text fw={600}>Input Format</Text>
                                             {detectedFormat && inputFormat === 'auto' && (
                        <Badge 
                          color={formatColors[detectedFormat] || 'green'} 
                          variant="light" 
                          size="xs"
                          leftSection={<IconCheck size={10} />}
                          style={{ 
                            textTransform: 'uppercase',
                            fontSize: '9px',
                            fontWeight: 600
                          }}
                        >
                          {detectedFormat} detected
                        </Badge>
                      )}
                    </Group>
                  }
                  value={inputFormat}
                  onChange={setInputFormat}
                  data={formatOptions}
                  size="md"
                  styles={{
                    label: { marginBottom: 8 },
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <Stack align="center" justify="center" style={{ height: '56px', marginTop: '32px' }}>
                  <ActionIcon
                    size="lg"
                    radius="md"
                    variant="light"
                    color="blue"
                    onClick={processData}
                    disabled={!input.trim()}
                    style={{ 
                      transition: 'all 0.2s ease'
                    }}
                    styles={{
                      root: {
                        '&:hover:not(:disabled)': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }}
                  >
                    <IconArrowRight size={20} />
                  </ActionIcon>
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
        <Group justify="center" gap="xs">
          <Text size="xs" c="dimmed" fw={500}>Quick Start:</Text>
          {Object.entries(sampleData).map(([format, data]) => (
            <Button
              key={format}
              size="xs"
              variant={input === data ? "filled" : "light"}
              color={formatColors[format] || 'blue'}
              onClick={() => setInput(data)}
              style={{ textTransform: 'uppercase', fontSize: '10px', height: '24px', padding: '0 8px' }}
              radius="xl"
            >
              {format}
            </Button>
          ))}
          <Button
            size="xs"
            variant="light"
            color="blue"
            onClick={() => {
              // Use a simple user profile for schema demo
              const userSample = `{
  "name": "Alex Johnson",
  "email": "alex.johnson@example.com",
  "age": 28,
  "website": "https://alexjohnson.dev",
  "phone": "+1-555-123-4567",
  "birthDate": "1995-08-22",
  "isActive": true
}`;
              setInput(userSample);
              setSchemaValidation(prev => ({ 
                ...prev, 
                enabled: true, 
                selectedSchema: 'user',
                schema: commonSchemas.user
              }));
              setActiveTab('schema');
            }}
            style={{ fontSize: '10px', height: '24px', padding: '0 8px' }}
            radius="xl"
          >
            SCHEMA DEMO
          </Button>
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
            <Tabs.Tab value="schema" leftSection={<IconCheck size={16} />}>
              Schema Validation
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="converter" pt="md">
            <Grid gutter="lg" align="stretch">
              {/* Input Panel */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="lg" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                      <Text fw={600} size="lg">
                        Input Data
                      </Text>
                      {detectedFormat && (
                        <Badge color={formatColors[detectedFormat] || 'blue'} variant="light" size="sm" mt={4}>
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
                  
                  <Textarea
                    placeholder="Paste your data here or use the sample data buttons above..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    autosize
                    minRows={1}
                    styles={{
                      wrapper: {
                        flex: 1
                      },
                      input: {
                        fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        border: '2px solid var(--mantine-color-gray-3)',
                        borderRadius: '8px',
                        backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
                        resize: 'none',
                        overflowX: 'auto',
                        whiteSpace: 'pre',
                        '&:focus': {
                          borderColor: 'var(--mantine-color-blue-5)',
                          boxShadow: '0 0 0 2px var(--mantine-color-blue-1)'
                        }
                      }
                    }}
                  />
                  
                  {/* Input Status */}
                  <div style={{ marginTop: '12px' }}>
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
                    

                  </div>
                </Card>
              </Grid.Col>

              {/* Output Panel */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder radius="lg" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                      <Text fw={600} size="lg">
                        Output Data
                      </Text>
                      <Badge color={formatColors[outputFormat] || 'green'} variant="light" size="sm" mt={4}>
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
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {(error || validationErrors.length > 0) ? (
                      <div style={{ 
                        flex: 1, 
                        padding: '1.25rem',
                        backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
                        borderRadius: '8px',
                        border: `2px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
                        overflow: 'auto'
                      }}>
                        <Stack gap="lg">
                          <Group gap="xs" align="center">
                            <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
                            <Text fw={600} size="lg" c="red">
                              {validationErrors.length > 0 ? "Validation Errors" : "Parsing Error"}
                            </Text>
                          </Group>
                          
                          {error && (
                            <div>
                              <Text size="sm" mb="md" c="dimmed">
                                There's an issue with your input data. Please check the format and try again.
                              </Text>
                              <Code 
                                block 
                                color="red"
                                style={{ 
                                  backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-red-0)',
                                  border: '1px solid var(--mantine-color-red-3)',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  lineHeight: 1.5
                                }}
                              >
                                {error}
                              </Code>
                            </div>
                          )}
                          
                          {validationErrors.map((validationError, index) => {
                            const formattedError = formatErrorForDisplay(validationError, input);
                            return (
                              <div key={index}>
                                <Group gap="xs" mb="sm">
                                  {validationError.format && (
                                    <Badge color={formatColors[validationError.format] || 'red'} size="sm" variant="light">
                                      {validationError.format.toUpperCase()}
                                    </Badge>
                                  )}
                                  {formattedError.line && (
                                    <Badge color="orange" size="sm" variant="light">
                                      Line {formattedError.line}
                                      {formattedError.column && `:${formattedError.column}`}
                                    </Badge>
                                  )}
                                </Group>
                                
                                <Text size="sm" mb="sm" fw={500}>
                                  {formattedError.message}
                                </Text>
                                
                                {formattedError.context && (
                                  <Code 
                                    block 
                                    style={{ 
                                      backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-red-0)',
                                      border: '1px solid var(--mantine-color-red-3)',
                                      padding: '12px',
                                      borderRadius: '6px',
                                      fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                      fontSize: '12px',
                                      lineHeight: 1.4,
                                      whiteSpace: 'pre',
                                      marginBottom: '12px'
                                    }}
                                  >
                                    {formattedError.context}
                                  </Code>
                                )}
                                
                                {formattedError.suggestions && formattedError.suggestions.length > 0 && (
                                  <div style={{ marginBottom: '16px' }}>
                                    <Text size="sm" fw={600} c="blue" mb="xs">
                                      💡 Suggestions:
                                    </Text>
                                    <Stack gap="xs">
                                      {formattedError.suggestions.map((suggestion, suggestionIndex) => (
                                        <Text 
                                          key={suggestionIndex} 
                                          size="sm" 
                                          c="dimmed"
                                          style={{ 
                                            paddingLeft: '12px',
                                            borderLeft: '3px solid var(--mantine-color-blue-4)',
                                            lineHeight: 1.5
                                          }}
                                        >
                                          • {suggestion}
                                        </Text>
                                      ))}
                                    </Stack>
                                  </div>
                                )}
                                
                                {index < validationErrors.length - 1 && (
                                  <Divider my="lg" />
                                )}
                              </div>
                            );
                          })}
                        </Stack>
                      </div>
                    ) : (
                      renderHighlightedCode(output, outputFormat)
                    )}
                  </div>
                  
                  {/* Output Status */}
                  <div style={{ marginTop: '12px' }}>
                    {(error || validationErrors.length > 0) ? (
                      <Card withBorder p="sm" radius="md" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' }}>
                        <Group justify="space-between" align="center">
                          <Group gap="md">
                            <Badge color="red" variant="filled" size="md" leftSection={<IconX size={14} />}>
                              {validationErrors.length > 0 ? `${validationErrors.length} Validation Error${validationErrors.length > 1 ? 's' : ''}` : 'Parsing Error'}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed" fw={500}>
                            See details above
                          </Text>
                        </Group>
                      </Card>
                    ) : output && (
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
                  </div>
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

          <Tabs.Panel value="schema" pt="md">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder>
                  <Title order={4} mb="md">Schema Configuration</Title>
                  <Stack gap="md">
                                         <Switch
                       label="Enable Schema Validation"
                       description="Validate data against a JSON schema"
                       checked={schemaValidation.enabled}
                       onChange={(event) => {
                         const checked = event.currentTarget.checked;
                         setSchemaValidation(prev => ({ 
                           ...prev, 
                           enabled: checked 
                         }));
                       }}
                     />
                    
                    {schemaValidation.enabled && (
                      <>
                        <Select
                          label="Common Schemas"
                          description="Choose from predefined schemas or use custom"
                          value={schemaValidation.selectedSchema}
                          onChange={(value) => {
                            setSchemaValidation(prev => ({ 
                              ...prev, 
                              selectedSchema: value,
                              schema: value === 'custom' ? null : commonSchemas[value]
                            }));
                          }}
                          data={[
                            { value: 'user', label: 'User Profile' },
                            { value: 'product', label: 'Product Data' },
                            { value: 'config', label: 'Configuration' },
                            { value: 'custom', label: 'Custom Schema' }
                          ]}
                        />
                        
                        {schemaValidation.selectedSchema === 'custom' && (
                          <Textarea
                            label="Custom JSON Schema"
                            description="Enter your JSON schema definition"
                            placeholder={`{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["name", "email"]
}`}
                            value={schemaValidation.customSchema}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSchemaValidation(prev => ({ 
                                ...prev, 
                                customSchema: value
                              }));
                              
                              // Try to parse custom schema
                              try {
                                const parsed = JSON.parse(value);
                                setSchemaValidation(prev => ({ 
                                  ...prev, 
                                  schema: parsed
                                }));
                              } catch (err) {
                                setSchemaValidation(prev => ({ 
                                  ...prev, 
                                  schema: null
                                }));
                              }
                            }}
                            autosize
                            minRows={8}
                            styles={{
                              input: {
                                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                fontSize: '14px'
                              }
                            }}
                          />
                        )}
                        
                        {schemaValidation.selectedSchema !== 'custom' && (
                          <Card withBorder p="sm" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)' }}>
                            <Text size="sm" fw={600} mb="xs">Schema Preview:</Text>
                            <Code block style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                              {JSON.stringify(commonSchemas[schemaValidation.selectedSchema], null, 2)}
                            </Code>
                          </Card>
                        )}
                      </>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder>
                  <Title order={4} mb="md">Validation Results</Title>
                  {!schemaValidation.enabled ? (
                    <Paper p="xl" ta="center">
                      <Text c="dimmed">Enable schema validation to see results</Text>
                    </Paper>
                  ) : !schemaValidation.schema ? (
                    <Paper p="xl" ta="center">
                      <Text c="dimmed">Configure a schema to validate against</Text>
                    </Paper>
                  ) : !input.trim() ? (
                    <Paper p="xl" ta="center">
                      <Text c="dimmed">Enter data to validate</Text>
                    </Paper>
                  ) : schemaValidation.results ? (
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Badge 
                          color={schemaValidation.results.success ? 'green' : 'red'} 
                          size="lg"
                          leftSection={schemaValidation.results.success ? <IconCheck size={14} /> : <IconX size={14} />}
                        >
                          {schemaValidation.results.success ? 'Valid' : 'Invalid'}
                        </Badge>
                        {schemaValidation.results.errors && (
                          <Text size="sm" c="dimmed">
                            {schemaValidation.results.errors.length} error(s)
                          </Text>
                        )}
                      </Group>
                      
                      {schemaValidation.results.validatedFields && (
                        <div>
                          <Text size="sm" fw={600} mb="xs">Field Validation:</Text>
                          <Stack gap="xs">
                            {schemaValidation.results.validatedFields.map((field, index) => (
                              <Group key={index} justify="space-between">
                                <Group gap="xs">
                                  <Text size="sm">{field.name}</Text>
                                  <Badge size="xs" variant="light">
                                    {field.type}
                                    {field.format && `:${field.format}`}
                                  </Badge>
                                  {field.required && (
                                    <Badge size="xs" color="orange" variant="light">
                                      required
                                    </Badge>
                                  )}
                                </Group>
                                <Badge 
                                  size="xs" 
                                  color={field.valid ? 'green' : 'red'}
                                  variant={field.valid ? 'light' : 'filled'}
                                >
                                  {field.present ? (field.valid ? 'valid' : 'invalid') : 'missing'}
                                </Badge>
                              </Group>
                            ))}
                          </Stack>
                        </div>
                      )}
                      
                      {schemaValidation.results.errors && schemaValidation.results.errors.length > 0 && (
                        <div>
                          <Text size="sm" fw={600} mb="xs" c="red">Validation Errors:</Text>
                          <Stack gap="sm">
                            {schemaValidation.results.errors.map((error, index) => (
                              <Alert key={index} color="red" variant="light">
                                <Text size="sm" mb="xs">{error.message}</Text>
                                {error.suggestions && error.suggestions.length > 0 && (
                                  <Stack gap="xs">
                                    <Text size="xs" fw={600} c="blue">Suggestions:</Text>
                                    {error.suggestions.map((suggestion, suggestionIndex) => (
                                      <Text 
                                        key={suggestionIndex} 
                                        size="xs" 
                                        c="dimmed"
                                        style={{ 
                                          paddingLeft: '12px',
                                          borderLeft: '2px solid var(--mantine-color-blue-3)'
                                        }}
                                      >
                                        • {suggestion}
                                      </Text>
                                    ))}
                                  </Stack>
                                )}
                              </Alert>
                            ))}
                          </Stack>
                        </div>
                      )}
                    </Stack>
                  ) : (
                    <Paper p="xl" ta="center">
                      <Text c="dimmed">Processing validation...</Text>
                    </Paper>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
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
                        <Badge size="sm" color={formatColors[entry.inputFormat] || 'gray'}>{entry.inputFormat?.toUpperCase()}</Badge>
                        <IconArrowRight size={12} />
                        <Badge size="sm" color={formatColors[entry.outputFormat] || 'gray'}>{entry.outputFormat?.toUpperCase()}</Badge>
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
    </Paper>
  );
};

export default DataConverterTool; 
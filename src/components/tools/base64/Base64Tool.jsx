import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Stack,
  Title,
  ThemeIcon,
  Group,
  Text,
  Tabs,
  Alert,
  Badge,
  Button,
  Select,
  Textarea,
  Grid,
  Card,
  Code,
  Timeline,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Divider,
  FileInput,
  Switch,
  Progress,
  ScrollArea,
  Center
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useLocalStorage } from '@mantine/hooks';
import { useParams } from 'react-router-dom';
import {
  IconUpload,
  IconDownload,
  IconCopy,
  IconClipboard,
  IconRefresh,
  IconTrash,
  IconHistory,
  IconFileText,
  IconPhoto,
  IconFile,
  IconCheck,
  IconX,
  IconArrowsExchange,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Base64Icon from './Base64Icon';

const ENCODING_MODES = [
  { value: 'standard', label: 'Standard Base64', description: 'RFC 4648 standard encoding' },
  { value: 'urlsafe', label: 'URL-Safe Base64', description: 'URL and filename safe encoding' },
  { value: 'mime', label: 'MIME Base64', description: 'MIME encoding with line breaks' }
];

const FILE_TYPES = {
  text: { icon: IconFileText, color: 'blue', extensions: ['.txt', '.json', '.xml', '.csv', '.log'] },
  image: { icon: IconPhoto, color: 'green', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'] },
  document: { icon: IconFile, color: 'orange', extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'] },
  other: { icon: IconFile, color: 'gray', extensions: [] }
};

const Base64Tool = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('encode');
  const [encodingType, setEncodingType] = useState('standard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidBase64, setIsValidBase64] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Get input from URL parameters
  const { input: urlInput } = useParams();

  // History and caching
  const [operationHistory, setOperationHistory] = useLocalStorage({
    key: 'base64-operation-history',
    defaultValue: []
  });

  const fileInputRef = useRef();

  // Effect to handle URL input parameter
  useEffect(() => {
    if (urlInput && urlInput.trim()) {
      const decodedInput = decodeURIComponent(urlInput);
      setInputText(decodedInput);
      processBase64Operation(decodedInput, mode, encodingType);
    }
  }, [urlInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to auto-detect Base64 content
  useEffect(() => {
    if (inputText.trim()) {
      const detected = detectBase64(inputText.trim());
      setIsValidBase64(detected);
      if (detected && mode === 'encode') {
        setMode('decode');
      }
    } else {
      setIsValidBase64(null);
    }
  }, [inputText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to detect if text is Base64
  const detectBase64 = (text) => {
    if (!text || text.length < 4) return false;
    
    // Remove whitespace and line breaks for detection
    const cleanText = text.replace(/\s/g, '');
    
    // Check for Base64 pattern
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const urlSafeBase64Regex = /^[A-Za-z0-9_-]*={0,2}$/;
    
    // Must be divisible by 4 (with padding)
    const hasValidLength = cleanText.length % 4 === 0;
    
    return hasValidLength && (base64Regex.test(cleanText) || urlSafeBase64Regex.test(cleanText));
  };

  // Helper function to get file type
  const getFileType = (filename) => {
    if (!filename) return 'other';
    const ext = '.' + filename.split('.').pop().toLowerCase();
    
    for (const [type, config] of Object.entries(FILE_TYPES)) {
      if (config.extensions.includes(ext)) {
        return type;
      }
    }
    return 'other';
  };

  // Helper function to add operation to history
  const addToHistory = (operation, input, output, type, fileInfo = null) => {
    const historyItem = {
      operation,
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      output: output.substring(0, 100) + (output.length > 100 ? '...' : ''),
      type,
      fileInfo,
      timestamp: Date.now(),
      inputLength: input.length,
      outputLength: output.length
    };

    const newHistory = [historyItem, ...operationHistory].slice(0, 50);
    setOperationHistory(newHistory);
  };

  // Base64 encoding functions
  const encodeBase64 = (text, type) => {
    try {
      let encoded;
      
      switch (type) {
        case 'standard':
          encoded = btoa(unescape(encodeURIComponent(text)));
          break;
        case 'urlsafe':
          encoded = btoa(unescape(encodeURIComponent(text)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
          break;
        case 'mime':
          encoded = btoa(unescape(encodeURIComponent(text)));
          // Add line breaks every 76 characters for MIME
          encoded = encoded.match(/.{1,76}/g)?.join('\n') || encoded;
          break;
        default:
          encoded = btoa(unescape(encodeURIComponent(text)));
      }
      
      return encoded;
    } catch (error) {
      throw new Error(`Encoding failed: ${error.message}`);
    }
  };

  // Base64 decoding functions
  const decodeBase64 = (text, type) => {
    try {
      let cleanText = text.replace(/\s/g, ''); // Remove all whitespace
      
      switch (type) {
        case 'urlsafe':
          // Convert URL-safe back to standard
          cleanText = cleanText
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          // Add padding if needed
          while (cleanText.length % 4) {
            cleanText += '=';
          }
          break;
        case 'mime':
          // MIME format already cleaned of whitespace above
          break;
      }
      
      const decoded = atob(cleanText);
      return decodeURIComponent(escape(decoded));
    } catch (error) {
      throw new Error(`Decoding failed: ${error.message}`);
    }
  };

  // File processing functions
  const handleFileSelect = async (file) => {
    if (!file) return;
    
    setSelectedFile(file);
    setLoading(true);
    setError(null);
    
    try {
      const fileType = getFileType(file.name);
      
      if (fileType === 'text' || file.size < 1024 * 1024) { // Show preview for text files or files < 1MB
        const text = await file.text();
        setFileContent(text);
        setInputText(text);
      } else {
        // For binary files, read as base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
          setFileContent(base64);
          setInputText(base64);
          setMode('decode'); // Assume we want to decode file content
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setError(`Failed to read file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Main processing function
  const processBase64Operation = async (input, operation, type) => {
    if (!input.trim()) {
      setError('Please provide input text or select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setOutputText('');

    try {
      let result;
      
      if (operation === 'encode') {
        result = encodeBase64(input, type);
      } else {
        result = decodeBase64(input, type);
      }
      
      setOutputText(result);
      addToHistory(operation, input, result, type, selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: getFileType(selectedFile.name)
      } : null);
      
      notifications.show({
        title: 'Success',
        message: `${operation === 'encode' ? 'Encoded' : 'Decoded'} successfully`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
    } catch (error) {
      setError(error.message);
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Batch processing function
  const processBatch = async (inputs) => {
    setBatchResults([]);
    setProcessingProgress(0);
    
    const results = [];
    
    for (let i = 0; i < inputs.length; i++) {
      try {
        const input = inputs[i].trim();
        if (!input) continue;
        
        let result;
        if (mode === 'encode') {
          result = encodeBase64(input, encodingType);
        } else {
          result = decodeBase64(input, encodingType);
        }
        
        results.push({
          input: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
          output: result.substring(0, 50) + (result.length > 50 ? '...' : ''),
          fullOutput: result,
          success: true
        });
      } catch (error) {
        results.push({
          input: inputs[i].substring(0, 50) + (inputs[i].length > 50 ? '...' : ''),
          output: '',
          fullOutput: '',
          error: error.message,
          success: false
        });
      }
      
      setProcessingProgress(((i + 1) / inputs.length) * 100);
    }
    
    setBatchResults(results);
  };

  // Event handlers
  const handleProcess = () => {
    if (batchMode) {
      const inputs = inputText.split('\n').filter(line => line.trim());
      if (inputs.length === 0) {
        setError('Please provide input lines for batch processing');
        return;
      }
      processBatch(inputs);
    } else {
      processBase64Operation(inputText, mode, encodingType);
    }
  };

  const handleSwapMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    if (outputText) {
      setInputText(outputText);
      setOutputText('');
    }
  };

  const handleHistoryItemClick = (historyItem) => {
    setInputText(historyItem.input);
    setMode(historyItem.operation);
    setEncodingType(historyItem.type);
    processBase64Operation(historyItem.input, historyItem.operation, historyItem.type);
  };

  const clearHistory = () => {
    setOperationHistory([]);
    notifications.show({
      title: 'History Cleared',
      message: 'Operation history has been cleared',
      color: 'blue'
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notifications.show({
        title: 'Copied',
        message: 'Text copied to clipboard',
        color: 'green',
        icon: <IconCopy size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Copy Failed',
        message: 'Failed to copy to clipboard',
        color: 'red'
      });
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (error) {
      notifications.show({
        title: 'Paste Failed',
        message: 'Failed to paste from clipboard',
        color: 'red'
      });
    }
  };

  const downloadResult = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base64-${mode}-result.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setSelectedFile(null);
    setFileContent('');
    setError(null);
    setBatchResults([]);
    setProcessingProgress(0);
  };

  return (
    <Paper shadow="sm" radius="md" p="xl" withBorder>
      <LoadingOverlay visible={loading} />
      
      {/* Header */}
      <Group mb="lg">
        <ThemeIcon size="xl" radius="md" variant="light">
          <Base64Icon size={28} />
        </ThemeIcon>
        <div>
          <Title order={2}>Base64 Encoder/Decoder</Title>
          <Text size="sm" color="dimmed">
            Encode and decode text and files using Base64 encoding with multiple variants
          </Text>
        </div>
      </Group>

      {/* Controls */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
        <Grid>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              label="Operation"
              value={mode}
              onChange={setMode}
              data={[
                { value: 'encode', label: 'Encode to Base64' },
                { value: 'decode', label: 'Decode from Base64' }
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Encoding Type"
              value={encodingType}
              onChange={setEncodingType}
              data={ENCODING_MODES}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Switch
              label="Batch Mode"
              description="Process multiple lines"
              checked={batchMode}
              onChange={(event) => setBatchMode(event.currentTarget.checked)}
              mt="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button
              fullWidth
              leftSection={<IconArrowsExchange size={16} />}
              onClick={handleSwapMode}
              variant="light"
              style={{ marginTop: 25 }}
            >
              Swap
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {/* File Input with Drag & Drop */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={500}>File Upload</Text>
          {selectedFile && (
            <Badge color={FILE_TYPES[getFileType(selectedFile.name)].color}>
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </Badge>
          )}
        </Group>
        
        <Dropzone
          onDrop={(files) => handleFileSelect(files[0])}
          onReject={(files) => {
            setError(`File rejected: ${files[0]?.errors?.[0]?.message || 'Invalid file'}`);
          }}
          maxSize={50 * 1024 * 1024} // 50MB limit
          accept={{
            'text/*': ['.txt', '.json', '.xml', '.csv', '.log', '.md'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
            'application/*': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip']
          }}
          multiple={false}
          loading={loading}
        >
          <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload
                size={52}
                color="var(--mantine-color-blue-6)"
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size={52}
                color="var(--mantine-color-red-6)"
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFile
                size={52}
                color="var(--mantine-color-dimmed)"
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                Drag files here or click to select
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Supports text, images, and documents up to 50MB
              </Text>
            </div>
          </Group>
        </Dropzone>
        
        {/* Alternative file input for better accessibility */}
        <Group justify="center" mt="md">
          <FileInput
            ref={fileInputRef}
            placeholder="Or browse files manually"
            value={selectedFile}
            onChange={handleFileSelect}
            leftSection={<IconUpload size={16} />}
            clearable
            style={{ maxWidth: 300 }}
          />
        </Group>
      </Card>

      {/* Input/Output */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500}>
                Input {batchMode && '(One per line)'}
              </Text>
              <Group>
                {isValidBase64 !== null && (
                  <Badge color={isValidBase64 ? 'green' : 'orange'} size="sm">
                    {isValidBase64 ? 'Valid Base64' : 'Not Base64'}
                  </Badge>
                )}
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={pasteFromClipboard}
                  title="Paste from clipboard"
                >
                  <IconClipboard size={14} />
                </ActionIcon>
              </Group>
            </Group>
            
            <Textarea
              placeholder={batchMode ? 
                "Enter multiple lines to process in batch...\nLine 1\nLine 2\nLine 3" :
                mode === 'encode' ? 
                  "Enter text to encode..." : 
                  "Enter Base64 text to decode..."
              }
              value={inputText}
              onChange={(event) => setInputText(event.currentTarget.value)}
              minRows={8}
              maxRows={12}
              autosize
            />
            
            {inputText && (
              <Text size="xs" color="dimmed" mt="xs">
                {inputText.length} characters
              </Text>
            )}
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500}>Output</Text>
              <Group>
                {outputText && (
                  <>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={() => copyToClipboard(outputText)}
                      title="Copy to clipboard"
                    >
                      <IconCopy size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={downloadResult}
                      title="Download result"
                    >
                      <IconDownload size={14} />
                    </ActionIcon>
                  </>
                )}
              </Group>
            </Group>
            
            {batchMode && batchResults.length > 0 ? (
              <ScrollArea h={200}>
                <Stack spacing="xs">
                  {batchResults.map((result, index) => (
                    <Group key={index} justify="space-between" p="xs" style={{
                      backgroundColor: result.success ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-red-0)',
                      borderRadius: 'var(--mantine-radius-sm)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <Text size="xs" color="dimmed">Input: {result.input}</Text>
                        <Text size="xs">{result.success ? result.output : result.error}</Text>
                      </div>
                      {result.success && (
                        <ActionIcon
                          size="xs"
                          variant="light"
                          onClick={() => copyToClipboard(result.fullOutput)}
                        >
                          <IconCopy size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
            ) : (
              <Textarea
                placeholder="Output will appear here..."
                value={outputText}
                readOnly
                minRows={8}
                maxRows={12}
                autosize
              />
            )}
            
            {outputText && (
              <Text size="xs" color="dimmed" mt="xs">
                {outputText.length} characters
              </Text>
            )}
            
            {batchMode && processingProgress > 0 && processingProgress < 100 && (
              <Progress value={processingProgress} mt="xs" />
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Action Buttons */}
      <Group justify="center" mb="lg">
        <Button
          leftSection={mode === 'encode' ? <IconUpload size={16} /> : <IconDownload size={16} />}
          onClick={handleProcess}
          disabled={loading || (!inputText.trim() && !selectedFile)}
          size="lg"
        >
          {mode === 'encode' ? 'Encode' : 'Decode'} {batchMode && 'Batch'}
        </Button>
        
        <Button
          variant="light"
          leftSection={<IconTrash size={16} />}
          onClick={clearAll}
        >
          Clear All
        </Button>
      </Group>

      {/* Error Display */}
      {error && (
        <Alert
          icon={<IconX size={16} />}
          title="Processing Error"
          color="red"
          variant="filled"
          mb="lg"
        >
          {error}
        </Alert>
      )}

      {/* History */}
      {operationHistory.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>
              <IconHistory size={18} style={{ marginRight: 8 }} />
              Recent Operations
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={clearHistory}
            >
              Clear History
            </Button>
          </Group>
          
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {operationHistory.slice(0, 10).map((item, index) => (
              <Timeline.Item
                key={index}
                title={
                  <Group>
                    <Text fw={500}>{item.operation}</Text>
                    <Badge size="xs" color="blue">{item.type}</Badge>
                    {item.fileInfo && (
                      <Badge size="xs" color={FILE_TYPES[item.fileInfo.type].color}>
                        {item.fileInfo.name}
                      </Badge>
                    )}
                  </Group>
                }
                bullet={<Base64Icon size={12} />}
              >
                <Text size="xs" color="dimmed">
                  {new Date(item.timestamp).toLocaleString()} • 
                  {item.inputLength} → {item.outputLength} chars
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  mt="xs"
                  leftSection={<IconRefresh size={14} />}
                  onClick={() => handleHistoryItemClick(item)}
                >
                  Repeat Operation
                </Button>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}
    </Paper>
  );
};

export default Base64Tool; 
import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Stack,
  Title,
  ThemeIcon,
  Group,
  Text,
  Alert,
  Badge,
  Button,
  Select,
  Textarea,
  Grid,
  Card,
  ActionIcon,
  LoadingOverlay,
  FileInput,
  Switch,
  Progress,
  ScrollArea,
  Image,
  Box
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useParams } from 'react-router-dom';
import {
  IconUpload,
  IconDownload,
  IconCopy,
  IconClipboard,
  IconTrash,
  IconFileText,
  IconPhoto,
  IconFile,
  IconCheck,
  IconX
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
  // Batch mode removed - not needed for image processing
  const [inputImagePreview, setInputImagePreview] = useState(null);
  const [outputImagePreview, setOutputImagePreview] = useState(null);

  // Get input from URL parameters
  const { input: urlInput } = useParams();

  // Removed history functionality for performance with large files

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
    if (inputText.trim() && !selectedFile) { // Only auto-detect if no file is selected
      const detected = detectBase64(inputText.trim());
      setIsValidBase64(detected);
      if (detected && mode === 'encode') {
        setMode('decode');
      }
      
      // Also check if it's a Base64 image and show preview (only if no file is selected)
      if (detected && isBase64Image(inputText.trim())) {
        const imageUrl = createImagePreviewUrl(inputText.trim());
        if (imageUrl) {
          setInputImagePreview(imageUrl);
        }
      } else {
        // Only clear preview if no file is selected
        setInputImagePreview(null);
      }
    } else if (inputText.trim() && selectedFile) {
      // If we have a file, just check if it's valid base64 but DON'T modify the image preview
      const detected = detectBase64(inputText.trim());
      setIsValidBase64(detected);
      // Don't touch inputImagePreview when we have a selected file
    } else if (!selectedFile) {
      // Only clear state if no file is selected
      setIsValidBase64(null);
      setInputImagePreview(null);
    }
  }, [inputText, selectedFile, mode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Helper function to check if a string is a valid Base64 image
  const isBase64Image = (base64String) => {
    if (!base64String) return false;
    
    // Check if it starts with data URL prefix
    if (base64String.startsWith('data:image/')) {
      return true;
    }
    
    // Check if it's a raw base64 that could be an image
    try {
      // Clean the base64 string - remove whitespace and line breaks
      const cleanBase64 = base64String.replace(/\s/g, '');
      
      // Must be valid base64 format and reasonably long for an image
      if (cleanBase64.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        // Check if it starts with common image file signatures in base64
        const imageSignatures = [
          '/9j/', // JPEG (starts with 0xFFD8FF)
          '/9k/', // JPEG variant
          '/+0/', // JPEG variant  
          'iVBORw0KGgo', // PNG (starts with PNG signature)
          'R0lGODlh', // GIF87a
          'R0lGODdh', // GIF89a  
          'UklGR', // WebP (starts with RIFF)
          'PHN2Zw', // SVG (starts with <svg)
          'PD94bWw', // SVG (starts with <?xml)
          'Qk0', // BMP (starts with BM)
          'SUkq', // TIFF (little endian)
          'TU0A', // TIFF (big endian)
        ];
        
        const isImageSignature = imageSignatures.some(sig => cleanBase64.startsWith(sig));
        
        // Additional check for SVG: try to decode and see if it contains SVG content
        let isSvgContent = false;
        try {
          const decoded = atob(cleanBase64);
          isSvgContent = decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"');
        } catch (e) {
          // Ignore decode errors
        }
        
        // Additional check: if it's very long and looks like base64, it might be an image
        const isLikelyImage = cleanBase64.length > 1000 && cleanBase64.length % 4 === 0;
        
        return isImageSignature || isSvgContent || isLikelyImage;
      }
    } catch (error) {
      console.log('Base64 image detection error:', error);
      return false;
    }
    
    return false;
  };

  // Helper function to create image preview URL
  const createImagePreviewUrl = (base64String, mimeType = null) => {
    try {
      if (base64String.startsWith('data:')) {
        return base64String;
      }
      
      const cleanBase64 = base64String.replace(/\s/g, '');
      
      // Validate Base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        console.log('Invalid Base64 format for image');
        return null;
      }
      
      // Try to decode to validate it's actually valid Base64
      try {
        atob(cleanBase64);
      } catch (e) {
        console.log('Invalid Base64 data');
        return null;
      }
      
      // If no mime type provided, try to detect from base64 signature
      let detectedMimeType = mimeType;
      if (!detectedMimeType) {
        if (cleanBase64.startsWith('/9j/') || cleanBase64.startsWith('/9k/') || cleanBase64.startsWith('/+0/')) detectedMimeType = 'image/jpeg';
        else if (cleanBase64.startsWith('iVBORw0KGgo')) detectedMimeType = 'image/png';
        else if (cleanBase64.startsWith('R0lGODlh') || cleanBase64.startsWith('R0lGODdh')) detectedMimeType = 'image/gif';
        else if (cleanBase64.startsWith('UklGR')) detectedMimeType = 'image/webp';
        else if (cleanBase64.startsWith('PHN2Zw') || cleanBase64.startsWith('PD94bWw')) detectedMimeType = 'image/svg+xml';
        else if (cleanBase64.startsWith('Qk0')) detectedMimeType = 'image/bmp';
        else {
          // Try to decode and check if it's SVG content
          try {
            const decoded = atob(cleanBase64);
            if (decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"')) {
              detectedMimeType = 'image/svg+xml';
            } else {
              return null; // Unknown format
            }
          } catch (e) {
            return null; // Invalid Base64
          }
        }
      }
      
      return `data:${detectedMimeType};base64,${cleanBase64}`;
      
    } catch (error) {
      console.log('Error creating image preview URL:', error);
      return null;
    }
  };

  // History functionality removed for performance with large files

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
      
      // Check if the decoded result is still Base64 (double-encoded)
      if (isBase64Image(decoded)) {
        console.log('Detected double-encoded Base64, decoding again...');
        return decodeURIComponent(escape(atob(decoded)));
      }
      
      return decodeURIComponent(escape(decoded));
    } catch (error) {
      throw new Error(`Decoding failed: ${error.message}`);
    }
  };

  // File processing functions
  const handleFileSelect = async (file) => {
    if (!file) {
      setInputImagePreview(null);
      return;
    }
    
    setSelectedFile(file);
    setLoading(true);
    setError(null);
    setInputImagePreview(null);
    
    // Clear any existing output when uploading a new file
    setOutputText('');
    setOutputImagePreview(null);
    
    try {
      const fileType = getFileType(file.name);
      
      if (fileType === 'image') {
        // For images, create preview and read as base64
        const imageUrl = URL.createObjectURL(file);
        setInputImagePreview(imageUrl);
        
        // Switch to encode mode for actual image files
        setMode('encode');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
          setFileContent(base64);
          setInputText(base64);
        };
        reader.readAsDataURL(file);
      } else if (fileType === 'text' || file.size < 1024 * 1024) { // Show preview for text files or files < 1MB
        const text = await file.text();
        setFileContent(text);
        setInputText(text);
        
        // Check if the text file contains Base64 data
        const trimmedText = text.trim();
        const isBase64Content = detectBase64(trimmedText);
        
        if (isBase64Content) {
          // Switch to decode mode for Base64 content
          setMode('decode');
          
          // Check if it's a Base64 image and show preview
          if (isBase64Image(trimmedText)) {
            const imageUrl = createImagePreviewUrl(trimmedText);
            if (imageUrl) {
              setInputImagePreview(imageUrl);
            }
          }
        } else {
          // For regular text files, switch to encode mode
          setMode('encode');
        }
      } else {
        // For other binary files, read as base64 and switch to encode mode
        setMode('encode');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
          setFileContent(base64);
          setInputText(base64);
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

    // Refined validation for decode operation
    if (operation === 'decode') {
      if (selectedFile && getFileType(selectedFile.name) === 'image') {
        setError('Cannot decode an image file. Please switch to Encode mode to encode this image, or upload a Base64 encoded text file to decode.');
        setLoading(false);
        return;
      }
      // For text files or direct input, ensure it is valid Base64
      if (!detectBase64(input.trim())) {
        setError(
          selectedFile
            ? 'The selected text file does not contain valid Base64. Please upload a valid Base64 encoded text file.'
            : 'The input text is not valid Base64. Please provide valid Base64 text for decoding.'
        );
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setOutputText('');
    setOutputImagePreview(null);

    try {
      let result;
      
      if (operation === 'encode') {
        // Check if we have a selected file and it's an image
        if (selectedFile && getFileType(selectedFile.name) === 'image') {
          // For image files, the input is already Base64 - just use it directly
          result = input;
          // Show the image preview in output
          if (inputImagePreview) {
            setOutputImagePreview(inputImagePreview);
          }
        } else {
          // For text input, encode it to Base64
          result = encodeBase64(input, type);
        }
      } else {
        // Check if the input Base64 is an image
        const isImage = isBase64Image(input);
        
        if (isImage) {
          // Check if this is double-encoded Base64
          let finalBase64 = input;
          let imageUrl = null;
          
          try {
            const firstDecode = atob(input.replace(/\s/g, ''));
            if (isBase64Image(firstDecode)) {
              finalBase64 = firstDecode;
            }
          } catch (e) {
            // If first decode fails, use original
          }
          
          // Try to create image URL
          imageUrl = createImagePreviewUrl(finalBase64);
          
          if (imageUrl) {
            // Successfully created image preview
            result = "Image decoded successfully. See preview below.";
            setOutputImagePreview(imageUrl);
          } else {
            // Failed to create image, fall back to text decoding
            result = decodeBase64(input, type);
            setOutputImagePreview(null);
          }
        } else {
          // Check if it might be an SVG by trying to decode and check content
          try {
            const decoded = decodeBase64(input, type);
            if (decoded.trim().startsWith('<svg') || decoded.includes('<svg')) {
              // It's an SVG! Create a data URL for it
              const svgDataUrl = `data:image/svg+xml;base64,${input.replace(/\s/g, '')}`;
              result = "SVG image decoded successfully. See preview below.";
              setOutputImagePreview(svgDataUrl);
            } else {
              // Regular text decoding
              result = decoded;
            }
          } catch (e) {
            // If decoding fails, show error
            result = decodeBase64(input, type);
          }
        }
      }
      
      setOutputText(result);
      
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

  // Batch processing removed - not needed for image processing

  // Event handlers
  const handleProcess = () => {
    processBase64Operation(inputText, mode, encodingType);
  };

  // Swap mode function removed - now using toggle switch

  // History functions removed for performance

  const copyToClipboard = async (text) => {
    try {
      // If we have an image preview and we're decoding, copy the input Base64 instead of the message
      let textToCopy = text;
      if (outputImagePreview && mode === 'decode') {
        textToCopy = inputText; // Copy the original Base64 input
      }
      
      await navigator.clipboard.writeText(textToCopy);
      notifications.show({
        title: 'Copied',
        message: 'Base64 data copied to clipboard',
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
    // If we have an image preview and we're decoding, download the actual image
    if (outputImagePreview && mode === 'decode') {
      // Create a download link for the image
      const a = document.createElement('a');
      a.href = outputImagePreview;
      
      // Determine file extension from mime type
      let extension = 'jpg'; // default
      if (outputImagePreview.includes('image/png')) extension = 'png';
      else if (outputImagePreview.includes('image/gif')) extension = 'gif';
      else if (outputImagePreview.includes('image/webp')) extension = 'webp';
      else if (outputImagePreview.includes('image/bmp')) extension = 'bmp';
      else if (outputImagePreview.includes('image/svg+xml')) extension = 'svg';
      
      a.download = `decoded-image.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // For text output or encoding, download as text file
      const blob = new Blob([outputText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `base64-${mode}-result.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setSelectedFile(null);
    setFileContent('');
    setError(null);
    setInputImagePreview(null);
    setOutputImagePreview(null);
  };

  return (
    <Paper p="xl" radius="lg" withBorder>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="teal" variant="light">
            <Base64Icon size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              Base64 Encoder/Decoder
            </Title>
            <Text size="sm" c="dimmed">
              Encode and decode text and files using Base64 encoding with multiple variants
            </Text>
          </div>
        </Group>

      {/* Controls */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Switch
              label={mode === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
              description={mode === 'encode' ? 'Convert text/files to Base64' : 'Convert Base64 back to original format'}
              checked={mode === 'decode'}
              onChange={(event) => setMode(event.currentTarget.checked ? 'decode' : 'encode')}
              size="lg"
              thumbIcon={
                mode === 'encode' ? (
                  <IconUpload size={12} />
                ) : (
                  <IconDownload size={12} />
                )
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Encoding Type"
              value={encodingType}
              onChange={setEncodingType}
              data={ENCODING_MODES}
            />
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
          maxSize={15 * 1024 * 1024} // 15MB limit
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
                Supports text, images, and documents up to 15MB
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
              <Text size="lg" fw={500}>Input</Text>
              <Group>
                {selectedFile ? (
                  <Badge color="blue" size="sm">
                    File Loaded: {getFileType(selectedFile.name)}
                  </Badge>
                ) : isValidBase64 !== null ? (
                  <Badge color={isValidBase64 ? 'green' : 'orange'} size="sm">
                    {isValidBase64 ? 'Valid Base64' : 'Not Base64'}
                  </Badge>
                ) : null}
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={pasteFromClipboard}
                  title="Paste from clipboard"
                >
                  <IconClipboard size={14} />
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="red"
                  onClick={clearAll}
                  title="Clear all"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
            
            {inputImagePreview ? (
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {selectedFile ? 'Image Preview:' : 'Base64 Image Preview:'}
                </Text>
                <Image
                  src={inputImagePreview}
                  alt="Input image preview"
                  fit="contain"
                  h={200}
                  radius="md"
                  withPlaceholder
                />
                <Text size="xs" color="dimmed" mt="xs">
                  {selectedFile ? 'Image loaded' : 'Base64 image detected'} • {inputText.length} characters in Base64
                </Text>
              </Box>
            ) : (
              <>
                <Textarea
                  placeholder={mode === 'encode' ? 
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
              </>
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
                    {/* Only show copy button if not a decoded image */}
                    {!(outputImagePreview && mode === 'decode') && (
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => copyToClipboard(outputText)}
                        title="Copy to clipboard"
                      >
                        <IconCopy size={14} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={downloadResult}
                      title={outputImagePreview && mode === 'decode' ? 'Download image' : 'Download result'}
                    >
                      <IconDownload size={14} />
                    </ActionIcon>
                  </>
                )}
              </Group>
            </Group>
            
            {outputImagePreview ? (
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {mode === 'encode' ? 'Encoded Image:' : 'Decoded Image:'}
                </Text>
                <Image
                  src={outputImagePreview}
                  alt={mode === 'encode' ? 'Encoded image' : 'Decoded image'}
                  fit="contain"
                  h={200}
                  radius="md"
                  withPlaceholder
                />
                <Text size="xs" color="dimmed" mt="xs">
                  {mode === 'encode' ? 'Image encoded to Base64' : 'Image decoded successfully'} • {outputText.length} characters
                </Text>
                
                {/* Show Base64 text below the image for encoding */}
                {mode === 'encode' && (
                  <Box mt="md">
                    <Text size="sm" fw={500} mb="xs">Base64 Output:</Text>
                    <Textarea
                      value={outputText}
                      readOnly
                      minRows={4}
                      maxRows={8}
                      autosize
                    />
                  </Box>
                )}
              </Box>
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
            
            {outputText && !outputImagePreview && (
              <Text size="xs" color="dimmed" mt="xs">
                {outputText.length} characters
              </Text>
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
          {mode === 'encode' ? 'Encode' : 'Decode'}
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

        {/* History section removed for performance with large files */}
      </Stack>
    </Paper>
  );
};

export default Base64Tool; 
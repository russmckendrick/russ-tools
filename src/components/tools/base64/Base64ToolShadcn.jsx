import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  Copy,
  ClipboardPaste,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Check,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Base64Icon from './Base64Icon';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const ENCODING_MODES = [
  { value: 'standard', label: 'Standard Base64', description: 'RFC 4648 standard encoding' },
  { value: 'urlsafe', label: 'URL-Safe Base64', description: 'URL and filename safe encoding' },
  { value: 'mime', label: 'MIME Base64', description: 'MIME encoding with line breaks' }
];

const FILE_TYPES = {
  text: { icon: FileText, color: 'blue', extensions: ['.txt', '.json', '.xml', '.csv', '.log'] },
  image: { icon: ImageIcon, color: 'green', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'] },
  document: { icon: File, color: 'orange', extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'] },
  other: { icon: File, color: 'gray', extensions: [] }
};

const Base64ToolShadcn = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('encode');
  const [encodingType, setEncodingType] = useState('standard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidBase64, setIsValidBase64] = useState(null);
  const [inputImagePreview, setInputImagePreview] = useState(null);
  const [outputImagePreview, setOutputImagePreview] = useState(null);
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'base64');
  const seoData = generateToolSEO(toolConfig);

  // Get input from URL parameters
  const { input: urlInput } = useParams();

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
    if (inputText.trim() && !selectedFile) {
      const detected = detectBase64(inputText.trim());
      setIsValidBase64(detected);
      if (detected && mode === 'encode') {
        setMode('decode');
      }
      
      if (detected && isBase64Image(inputText.trim())) {
        const imageUrl = createImagePreviewUrl(inputText.trim());
        if (imageUrl) {
          setInputImagePreview(imageUrl);
        }
      } else {
        setInputImagePreview(null);
      }
    } else if (inputText.trim() && selectedFile) {
      const detected = detectBase64(inputText.trim());
      setIsValidBase64(detected);
    } else if (!selectedFile) {
      setIsValidBase64(null);
      setInputImagePreview(null);
    }
  }, [inputText, selectedFile, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to detect if text is Base64
  const detectBase64 = (text) => {
    if (!text || text.length < 4) return false;
    
    const cleanText = text.replace(/\s/g, '');
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const urlSafeBase64Regex = /^[A-Za-z0-9_-]*={0,2}$/;
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
    
    if (base64String.startsWith('data:image/')) {
      return true;
    }
    
    try {
      const cleanBase64 = base64String.replace(/\s/g, '');
      
      if (cleanBase64.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        const imageSignatures = [
          '/9j/', '/9k/', '/+0/',     // JPEG
          'iVBORw0KGgo',             // PNG
          'R0lGODlh', 'R0lGODdh',    // GIF
          'UklGR',                    // WebP
          'PHN2Zw', 'PD94bWw',       // SVG
          'Qk0',                      // BMP
          'SUkq', 'TU0A'             // TIFF
        ];
        
        const isImageSignature = imageSignatures.some(sig => cleanBase64.startsWith(sig));
        
        let isSvgContent = false;
        try {
          const decoded = atob(cleanBase64);
          isSvgContent = decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"');
        } catch (e) {
          // Ignore decode errors
        }
        
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
      
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        return null;
      }
      
      try {
        atob(cleanBase64);
      } catch (e) {
        return null;
      }
      
      let detectedMimeType = mimeType;
      if (!detectedMimeType) {
        if (cleanBase64.startsWith('/9j/') || cleanBase64.startsWith('/9k/') || cleanBase64.startsWith('/+0/')) detectedMimeType = 'image/jpeg';
        else if (cleanBase64.startsWith('iVBORw0KGgo')) detectedMimeType = 'image/png';
        else if (cleanBase64.startsWith('R0lGODlh') || cleanBase64.startsWith('R0lGODdh')) detectedMimeType = 'image/gif';
        else if (cleanBase64.startsWith('UklGR')) detectedMimeType = 'image/webp';
        else if (cleanBase64.startsWith('PHN2Zw') || cleanBase64.startsWith('PD94bWw')) detectedMimeType = 'image/svg+xml';
        else if (cleanBase64.startsWith('Qk0')) detectedMimeType = 'image/bmp';
        else {
          try {
            const decoded = atob(cleanBase64);
            if (decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"')) {
              detectedMimeType = 'image/svg+xml';
            } else {
              return null;
            }
          } catch (e) {
            return null;
          }
        }
      }
      
      return `data:${detectedMimeType};base64,${cleanBase64}`;
      
    } catch (error) {
      console.log('Error creating image preview URL:', error);
      return null;
    }
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
      let cleanText = text.replace(/\s/g, '');
      
      switch (type) {
        case 'urlsafe':
          cleanText = cleanText
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          while (cleanText.length % 4) {
            cleanText += '=';
          }
          break;
        case 'mime':
          break;
      }
      
      const decoded = atob(cleanText);
      
      if (isBase64Image(decoded)) {
        return decodeURIComponent(escape(atob(decoded)));
      }
      
      return decodeURIComponent(escape(decoded));
    } catch (error) {
      throw new Error(`Decoding failed: ${error.message}`);
    }
  };

  // Configure react-dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        setError(`File rejected: ${rejection.errors?.[0]?.message || 'Invalid file'}`);
        return;
      }
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    },
    maxSize: 15 * 1024 * 1024, // 15MB limit
    accept: {
      'text/*': ['.txt', '.json', '.xml', '.csv', '.log', '.md'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
      'application/*': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip']
    },
    multiple: false
  });

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
    setOutputText('');
    setOutputImagePreview(null);
    
    try {
      const fileType = getFileType(file.name);
      
      if (fileType === 'image') {
        const imageUrl = URL.createObjectURL(file);
        setInputImagePreview(imageUrl);
        setMode('encode');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1];
          setInputText(base64);
        };
        reader.readAsDataURL(file);
      } else if (fileType === 'text' || file.size < 1024 * 1024) {
        const text = await file.text();
        setInputText(text);
        
        const trimmedText = text.trim();
        const isBase64Content = detectBase64(trimmedText);
        
        if (isBase64Content) {
          setMode('decode');
          
          if (isBase64Image(trimmedText)) {
            const imageUrl = createImagePreviewUrl(trimmedText);
            if (imageUrl) {
              setInputImagePreview(imageUrl);
            }
          }
        } else {
          setMode('encode');
        }
      } else {
        setMode('encode');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1];
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

    if (operation === 'decode') {
      if (selectedFile && getFileType(selectedFile.name) === 'image') {
        setError('Cannot decode an image file. Please switch to Encode mode to encode this image, or upload a Base64 encoded text file to decode.');
        setLoading(false);
        return;
      }
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
        if (selectedFile && getFileType(selectedFile.name) === 'image') {
          result = input;
          if (inputImagePreview) {
            setOutputImagePreview(inputImagePreview);
          }
        } else {
          result = encodeBase64(input, type);
        }
      } else {
        const isImage = isBase64Image(input);
        
        if (isImage) {
          let finalBase64 = input;
          
          try {
            const firstDecode = atob(input.replace(/\s/g, ''));
            if (isBase64Image(firstDecode)) {
              finalBase64 = firstDecode;
            }
          } catch (e) {
            // Use original
          }
          
          const imageUrl = createImagePreviewUrl(finalBase64);
          
          if (imageUrl) {
            result = "Image decoded successfully. See preview below.";
            setOutputImagePreview(imageUrl);
          } else {
            result = decodeBase64(input, type);
            setOutputImagePreview(null);
          }
        } else {
          try {
            const decoded = decodeBase64(input, type);
            if (decoded.trim().startsWith('<svg') || decoded.includes('<svg')) {
              const svgDataUrl = `data:image/svg+xml;base64,${input.replace(/\s/g, '')}`;
              result = "SVG image decoded successfully. See preview below.";
              setOutputImagePreview(svgDataUrl);
            } else {
              result = decoded;
            }
          } catch (e) {
            result = decodeBase64(input, type);
          }
        }
      }
      
      setOutputText(result);
      
      toast.success(`${operation === 'encode' ? 'Encoded' : 'Decoded'} successfully`);
      
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleProcess = () => {
    processBase64Operation(inputText, mode, encodingType);
  };

  const copyToClipboard = async (text) => {
    try {
      let textToCopy = text;
      if (outputImagePreview && mode === 'decode') {
        textToCopy = inputText;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Base64 data copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  };

  const downloadResult = () => {
    if (outputImagePreview && mode === 'decode') {
      const a = document.createElement('a');
      a.href = outputImagePreview;
      
      let extension = 'jpg';
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
    setError(null);
    setInputImagePreview(null);
    setOutputImagePreview(null);
  };

  return (
    <>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <ToolHeader
          icon={Base64Icon}
          title="Base64 Encoder/Decoder"
          description="Encode and decode text and files using Base64 encoding with multiple variants"
          iconColor="teal"
          showTitle={false}
          standalone={true}
        />

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mode-switch" className="text-base font-medium">
                  {mode === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mode-switch"
                    checked={mode === 'decode'}
                    onCheckedChange={(checked) => setMode(checked ? 'decode' : 'encode')}
                  />
                  <span className="text-sm text-muted-foreground">
                    {mode === 'encode' ? 'Convert text/files to Base64' : 'Convert Base64 back to original format'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="encoding-type" className="text-base font-medium">Encoding Type</Label>
                <Select value={encodingType} onValueChange={setEncodingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENCODING_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">File Upload</h3>
              {selectedFile && (
                <Badge variant="secondary">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? isDragAccept
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                isDragAccept ? (
                  <Upload className="mx-auto h-12 w-12 text-green-500 mb-4" />
                ) : (
                  <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                )
              ) : (
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              )}
              <div>
                <p className="text-lg">
                  {isDragActive
                    ? isDragAccept
                      ? 'Drop the file here'
                      : 'File not supported'
                    : 'Drag files here or click to select'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports text, images, and documents up to 15MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input/Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Input</h3>
                <div className="flex items-center gap-2">
                  {selectedFile ? (
                    <Badge variant="outline">
                      File Loaded: {getFileType(selectedFile.name)}
                    </Badge>
                  ) : isValidBase64 !== null ? (
                    <Badge variant={isValidBase64 ? "default" : "secondary"}>
                      {isValidBase64 ? 'Valid Base64' : 'Not Base64'}
                    </Badge>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={pasteFromClipboard}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inputImagePreview ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {selectedFile ? 'Image Preview:' : 'Base64 Image Preview:'}
                    </h4>
                    <img
                      src={inputImagePreview}
                      alt="Input image preview"
                      className="w-full h-48 object-contain rounded-md border bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedFile ? 'Image loaded' : 'Base64 image detected'} • {inputText.length} characters in Base64
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder={mode === 'encode' ? 
                      "Enter text to encode..." : 
                      "Enter Base64 text to decode..."
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={8}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  {inputText && (
                    <p className="text-xs text-muted-foreground">
                      {inputText.length} characters
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Output</h3>
                <div className="flex items-center gap-2">
                  {outputText && (
                    <>
                      {!(outputImagePreview && mode === 'decode') && (
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(outputText)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={downloadResult}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {outputImagePreview ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {mode === 'encode' ? 'Encoded Image:' : 'Decoded Image:'}
                    </h4>
                    <img
                      src={outputImagePreview}
                      alt={mode === 'encode' ? 'Encoded image' : 'Decoded image'}
                      className="w-full h-48 object-contain rounded-md border bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {mode === 'encode' ? 'Image encoded to Base64' : 'Image decoded successfully'} • {outputText.length} characters
                    </p>
                    
                    {mode === 'encode' && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Base64 Output:</h4>
                        <Textarea
                          value={outputText}
                          readOnly
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Output will appear here..."
                    value={outputText}
                    readOnly
                    rows={8}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  {outputText && (
                    <p className="text-xs text-muted-foreground">
                      {outputText.length} characters
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleProcess}
            disabled={loading || (!inputText.trim() && !selectedFile)}
            size="lg"
            className="px-8"
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === 'encode' ? (
              <Upload className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {mode === 'encode' ? 'Encode' : 'Decode'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
};

export default Base64ToolShadcn;
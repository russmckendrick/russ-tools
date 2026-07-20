import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Download,
  Copy,
  ClipboardPaste,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { copyText, readText, downloadFile } from '@/core';
import {
  detectBase64,
  getFileType,
  isBase64Image,
  createImagePreviewUrl,
  encodeBase64,
  decodeBase64,
} from './lib/base64.js';

const ENCODING_MODES = [
  { value: 'standard', label: 'Standard Base64', description: 'RFC 4648 standard encoding' },
  { value: 'urlsafe', label: 'URL-Safe Base64', description: 'URL and filename safe encoding' },
  { value: 'mime', label: 'MIME Base64', description: 'MIME encoding with line breaks' }
];

const Base64Tool = () => {
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

  const { input: urlInput } = useParams();

  // Deep link: /base64/:input processes on mount with the mode the content
  // implies — base64 decodes, anything else encodes. It used to process with
  // the *initial* mode while auto-detect flipped the switch afterwards, so a
  // shared base64 link showed its payload re-encoded under a toggle saying
  // "Decode" (logged in BEHAVIOR_CHANGES.md).
  useEffect(() => {
    if (urlInput && urlInput.trim()) {
      const decodedInput = decodeURIComponent(urlInput);
      const operation = detectBase64(decodedInput.trim()) ? 'decode' : 'encode';
      setInputText(decodedInput);
      setMode(operation);
      processBase64Operation(decodedInput, operation, encodingType);
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
  }, [inputText, selectedFile, mode]);

  // Configure react-dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept
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
          } catch {
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
          } catch {
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
    let textToCopy = text;
    if (outputImagePreview && mode === 'decode') {
      textToCopy = inputText;
    }

    if (await copyText(textToCopy)) {
      toast.success('Base64 data copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const pasteFromClipboard = async () => {
    const text = await readText();
    if (text === null) {
      toast.error('Failed to paste from clipboard');
    } else {
      setInputText(text);
    }
  };

  const downloadResult = () => {
    if (outputImagePreview && mode === 'decode') {
      let extension = 'jpg';
      if (outputImagePreview.includes('image/png')) extension = 'png';
      else if (outputImagePreview.includes('image/gif')) extension = 'gif';
      else if (outputImagePreview.includes('image/webp')) extension = 'webp';
      else if (outputImagePreview.includes('image/bmp')) extension = 'bmp';
      else if (outputImagePreview.includes('image/svg+xml')) extension = 'svg';

      downloadFile(dataUrlToBlob(outputImagePreview), `decoded-image.${extension}`);
    } else {
      downloadFile(outputText, `base64-${mode}-result.txt`, 'text/plain');
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
    <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mode-switch" className="text-body-md font-medium">
                  {mode === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mode-switch"
                    checked={mode === 'decode'}
                    onCheckedChange={(checked) => setMode(checked ? 'decode' : 'encode')}
                  />
                  <span className="text-body-sm text-muted-foreground">
                    {mode === 'encode' ? 'Convert text/files to Base64' : 'Convert Base64 back to original format'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="encoding-type" className="text-body-md font-medium">Encoding Type</Label>
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
              <h3 className="text-title-sm">File Upload</h3>
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
                    ? 'border-success bg-success-subtle'
                    : 'border-danger bg-danger-subtle'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                isDragAccept ? (
                  <Upload className="mx-auto h-12 w-12 text-success mb-4" />
                ) : (
                  <X className="mx-auto h-12 w-12 text-danger mb-4" />
                )
              ) : (
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              )}
              <div>
                <p className="text-title-sm">
                  {isDragActive
                    ? isDragAccept
                      ? 'Drop the file here'
                      : 'File not supported'
                    : 'Drag files here or click to select'
                  }
                </p>
                <p className="text-body-sm text-muted-foreground mt-2">
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
                <h3 className="text-title-sm">Input</h3>
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
                  <Button size="sm" variant="outline" onClick={pasteFromClipboard} aria-label="Paste from clipboard">
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll} aria-label="Clear input and output">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inputImagePreview ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-body-sm font-medium mb-2">
                      {selectedFile ? 'Image Preview:' : 'Base64 Image Preview:'}
                    </h4>
                    <img
                      src={inputImagePreview}
                      alt="Input image preview"
                      className="w-full h-48 object-contain rounded-md border bg-muted"
                    />
                    <p className="text-body-sm text-muted-foreground mt-2">
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
                    className="min-h-[200px] font-mono text-data-md"
                  />
                  {inputText && (
                    <p className="text-data-sm font-mono text-muted-foreground">
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
                <h3 className="text-title-sm">Output</h3>
                <div className="flex items-center gap-2">
                  {outputText && (
                    <>
                      {!(outputImagePreview && mode === 'decode') && (
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(outputText)} aria-label="Copy output">
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={downloadResult} aria-label="Download result">
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
                    <h4 className="text-body-sm font-medium mb-2">
                      {mode === 'encode' ? 'Encoded Image:' : 'Decoded Image:'}
                    </h4>
                    <img
                      src={outputImagePreview}
                      alt={mode === 'encode' ? 'Encoded image' : 'Decoded image'}
                      className="w-full h-48 object-contain rounded-md border bg-muted"
                    />
                    <p className="text-body-sm text-muted-foreground mt-2">
                      {mode === 'encode' ? 'Image encoded to Base64' : 'Image decoded successfully'} • {outputText.length} characters
                    </p>

                    {mode === 'encode' && (
                      <div className="mt-4">
                        <h4 className="text-body-sm font-medium mb-2">Base64 Output:</h4>
                        <Textarea
                          value={outputText}
                          readOnly
                          rows={4}
                          className="font-mono text-data-md"
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
                    className="min-h-[200px] font-mono text-data-md"
                  />
                  {outputText && (
                    <p className="text-data-sm font-mono text-muted-foreground">
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
              <RefreshCw className="mr-2 h-4 w-4 animate-spin-ccw" />
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
  );
};

/**
 * A decoded image lives in state as a data: URL; turn it back into bytes so
 * core/'s downloadFile handles the anchor dance (and the object-URL revoke)
 * in one place.
 */
function dataUrlToBlob(dataUrl) {
  const [head, payload] = dataUrl.split(',');
  const mime = head.slice(head.indexOf(':') + 1, head.indexOf(';'));
  const bytes = atob(payload);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

export default Base64Tool;

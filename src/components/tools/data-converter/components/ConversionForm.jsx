import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  RotateCcw, 
  ArrowRightLeft 
} from 'lucide-react';
import { toast } from 'sonner';
import CodeEditor from './CodeEditor';

const FORMAT_OPTIONS = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'json', label: 'JSON', extension: '.json', mime: 'application/json' },
  { value: 'yaml', label: 'YAML', extension: '.yml', mime: 'text/yaml' },
  { value: 'toml', label: 'TOML', extension: '.toml', mime: 'text/toml' }
];

const ConversionForm = ({
  inputData,
  setInputData,
  outputData,
  inputFormat,
  setInputFormat,
  outputFormat,
  setOutputFormat,
  detectedFormat,
  isConverting,
  onConvert,
  onClear,
  onFileUpload,
  validationResult
}) => {

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadData = (data, format) => {
    const formatOption = FORMAT_OPTIONS.find(f => f.value === format);
    const extension = formatOption?.extension || '.txt';
    const mimeType = formatOption?.mime || 'text/plain';
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-data${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setInputData(content);
        if (onFileUpload) onFileUpload(file);
        toast.success('File uploaded successfully');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const inputFormatDisplay = detectedFormat || inputFormat;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card className="relative rounded-xl shadow-sm ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Input Data
                {detectedFormat && detectedFormat !== inputFormat && (
                  <Badge variant="secondary" className="text-xs">
                    Detected: {detectedFormat.toUpperCase()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Paste your data or upload a file
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={inputFormat} onValueChange={setInputFormat}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <CodeEditor
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              language={inputFormatDisplay === 'auto' ? 'json' : inputFormatDisplay}
              placeholder="Enter your JSON, YAML, or TOML data here..."
              minHeight="384px"
            />
            {validationResult && !validationResult.success && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="text-xs">
                  Invalid
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".json,.yaml,.yml,.toml"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            
            <Button
              variant="outline" 
              size="sm"
              onClick={onClear}
              disabled={!inputData}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            
            {inputData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(inputData)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Output Section */}
      <Card className="relative rounded-xl shadow-sm ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Output Data</CardTitle>
              <CardDescription>
                Converted result
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.filter(option => option.value !== 'auto').map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <CodeEditor
              value={outputData}
              language={outputFormat}
              placeholder="Converted data will appear here..."
              readOnly
              minHeight="384px"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={onConvert}
              disabled={!inputData || isConverting}
              className="min-w-32"
            >
              {isConverting ? (
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              {isConverting ? 'Converting...' : 'Convert'}
            </Button>
            
            {outputData && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(outputData)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadData(outputData, outputFormat)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionForm;
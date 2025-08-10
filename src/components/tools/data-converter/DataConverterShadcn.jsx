import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Download, 
  Upload, 
  FileText, 
  Settings, 
  Copy, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  History,
  Zap,
  Eye,
  ArrowRightLeft
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';

// Import validation utilities
import { 
  validateJSON, 
  validateYAML, 
  validateTOML, 
  validateWithDetection,
  validateWithSchema,
  commonSchemas,
  formatErrorForDisplay 
} from './validation';

// Import sample data
import { 
  JSON_SAMPLES,
  YAML_SAMPLES,
  TOML_SAMPLES
} from './samples';
import ToolHeader from '../../common/ToolHeader';

const DataConverterShadcn = () => {
  // Core state
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [inputFormat, setInputFormat] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('json');
  const [validationResult, setValidationResult] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState(null);
  
  // Settings
  const [settings, setSettings] = useState({
    enableValidation: true,
    enableSchemaValidation: false,
    selectedSchema: 'user',
    autoDetectFormat: true,
    prettifyOutput: true,
    enableHistory: true,
    maxHistoryItems: 50
  });
  
  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);
  
  // History
  const [conversionHistory, setConversionHistory] = useState([]);
  
  // Refs
  const inputTextareaRef = useRef(null);
  const outputTextareaRef = useRef(null);
  
  // Load settings and history from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dataConverter_settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
    
    const savedHistory = localStorage.getItem('dataConverter_history');
    if (savedHistory) {
      setConversionHistory(JSON.parse(savedHistory));
    }
  }, []);
  
  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('dataConverter_settings', JSON.stringify(settings));
  }, [settings]);
  
  // Save history to localStorage
  useEffect(() => {
    if (settings.enableHistory) {
      localStorage.setItem('dataConverter_history', JSON.stringify(conversionHistory));
    }
  }, [conversionHistory, settings.enableHistory]);
  
  // Format detection and validation
  useEffect(() => {
    if (!inputData.trim()) {
      setValidationResult(null);
      setDetectedFormat(null);
      setOutputData('');
      return;
    }
    
    if (settings.enableValidation) {
      const result = validateWithDetection(inputData);
      setValidationResult(result);
      setDetectedFormat(result.detectedFormat || null);
      
      // Auto-convert when format is detected and validation passes
      if (result.success && result.detectedFormat) {
        convertData(result.data, result.detectedFormat, outputFormat);
      }
    }
  }, [inputData, settings.enableValidation]);
  
  // Convert data function
  const convertData = (data, fromFormat, toFormat) => {
    if (!data) return;
    
    try {
      let converted = '';
      
      switch (toFormat) {
        case 'json':
          converted = settings.prettifyOutput 
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
          break;
            
        case 'yaml':
          const yaml = require('js-yaml');
          converted = yaml.dump(data, {
            indent: settings.prettifyOutput ? 2 : 0,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
          });
          break;
          
        case 'toml':
          const TOML = require('@ltd/j-toml');
          converted = TOML.stringify(data, {
            indent: settings.prettifyOutput ? 2 : 0,
            newline: '\n'
          });
          break;
          
        default:
          throw new Error(`Unsupported output format: ${toFormat}`);
      }
      
      setOutputData(converted);
      
      // Add to history
      if (settings.enableHistory) {
        addToHistory({
          input: inputData.substring(0, 200) + (inputData.length > 200 ? '...' : ''),
          output: converted.substring(0, 200) + (converted.length > 200 ? '...' : ''),
          fromFormat: fromFormat || detectedFormat,
          toFormat,
          timestamp: new Date().toISOString(),
          success: true
        });
      }
      
      // Trigger syntax highlighting
      setTimeout(() => {
        if (outputTextareaRef.current) {
          Prism.highlightElement(outputTextareaRef.current);
        }
      }, 0);
      
    } catch (error) {
      toast.error(`Conversion failed: ${error.message}`);
      setOutputData('');
      
      if (settings.enableHistory) {
        addToHistory({
          input: inputData.substring(0, 200) + (inputData.length > 200 ? '...' : ''),
          error: error.message,
          fromFormat: fromFormat || detectedFormat,
          toFormat,
          timestamp: new Date().toISOString(),
          success: false
        });
      }
    }
  };
  
  // Manual conversion trigger
  const handleConvert = () => {
    if (!inputData.trim()) {
      toast.error('Please enter some data to convert');
      return;
    }
    
    setIsConverting(true);
    
    try {
      let parseResult;
      const actualInputFormat = inputFormat === 'auto' ? detectedFormat : inputFormat;
      
      // Parse input based on format
      switch (actualInputFormat) {
        case 'json':
          parseResult = validateJSON(inputData);
          break;
        case 'yaml':
          parseResult = validateYAML(inputData);
          break;
        case 'toml':
          parseResult = validateTOML(inputData);
          break;
        default:
          parseResult = validateWithDetection(inputData);
      }
      
      if (!parseResult.success) {
        throw new Error(parseResult.errors[0]?.message || 'Failed to parse input data');
      }
      
      // Schema validation if enabled
      if (settings.enableSchemaValidation && settings.selectedSchema) {
        const schema = commonSchemas[settings.selectedSchema];
        if (schema) {
          const schemaResult = validateWithSchema(parseResult.data, schema);
          if (!schemaResult.success) {
            toast.warning(`Schema validation failed: ${schemaResult.errors[0]?.message || 'Unknown error'}`);
          }
        }
      }
      
      convertData(parseResult.data, actualInputFormat, outputFormat);
      toast.success(`Successfully converted ${actualInputFormat || 'detected format'} to ${outputFormat.toUpperCase()}`);
      
    } catch (error) {
      toast.error(`Conversion failed: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };
  
  // History management
  const addToHistory = (entry) => {
    setConversionHistory(prev => {
      const newHistory = [entry, ...prev].slice(0, settings.maxHistoryItems);
      return newHistory;
    });
  };
  
  const clearHistory = () => {
    setConversionHistory([]);
    localStorage.removeItem('dataConverter_history');
    toast.success('History cleared');
  };
  
  const loadFromHistory = (entry) => {
    if (entry.success) {
      setInputData(entry.input.endsWith('...') ? entry.input.slice(0, -3) : entry.input);
      setOutputData(entry.output.endsWith('...') ? entry.output.slice(0, -3) : entry.output);
      setOutputFormat(entry.toFormat);
      setIsHistoryOpen(false);
      toast.success('Loaded from history');
    }
  };
  
  // Sample data loading
  const loadSample = (format, sampleKey) => {
    const samples = {
      json: JSON_SAMPLES,
      yaml: YAML_SAMPLES,
      toml: TOML_SAMPLES
    };
    
    const sample = samples[format][sampleKey];
    if (sample) {
      setInputData(sample.data);
      setInputFormat(format);
      setIsSamplesOpen(false);
      toast.success(`Loaded ${sample.name} sample`);
    }
  };
  
  // File operations
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputData(e.target.result);
      toast.success('File loaded successfully');
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleDownload = (data, filename, format) => {
    if (!data) {
      toast.error('No data to download');
      return;
    }
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };
  
  // Copy to clipboard
  const handleCopy = async (data) => {
    if (!data) {
      toast.error('No data to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(data);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };
  
  // Clear functions
  const clearInput = () => {
    setInputData('');
    setValidationResult(null);
    setDetectedFormat(null);
  };
  
  const clearOutput = () => {
    setOutputData('');
  };
  
  const clearAll = () => {
    clearInput();
    clearOutput();
    toast.success('All data cleared');
  };
  
  // Format minification
  const minifyOutput = () => {
    if (!outputData) {
      toast.error('No output data to minify');
      return;
    }
    
    try {
      let minified = '';
      
      switch (outputFormat) {
        case 'json':
          const parsed = JSON.parse(outputData);
          minified = JSON.stringify(parsed);
          break;
        case 'yaml':
          // YAML doesn't have a standard minification, but we can remove extra whitespace
          minified = outputData.replace(/\n\s*\n/g, '\n').trim();
          break;
        case 'toml':
          // TOML minification - remove extra whitespace and comments
          minified = outputData
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .join('\n');
          break;
        default:
          throw new Error('Minification not supported for this format');
      }
      
      setOutputData(minified);
      toast.success('Output minified');
    } catch (error) {
      toast.error(`Minification failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={ArrowRightLeft}
        title="Data Format Converter"
        description="Convert between JSON, YAML, and TOML formats with validation and error checking"
        iconColor="blue"
        standalone={true}
      />

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversion Settings</CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={isSamplesOpen} onOpenChange={setIsSamplesOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Samples
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Load Sample Data</DialogTitle>
                    <DialogDescription>
                      Choose from predefined sample data for testing
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="json" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="json">JSON</TabsTrigger>
                      <TabsTrigger value="yaml">YAML</TabsTrigger>
                      <TabsTrigger value="toml">TOML</TabsTrigger>
                    </TabsList>
                    <TabsContent value="json" className="space-y-2">
                      {Object.entries(JSON_SAMPLES).map(([key, sample]) => (
                        <Button
                          key={key}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => loadSample('json', key)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{sample.name}</div>
                            <div className="text-xs text-muted-foreground">{sample.description}</div>
                          </div>
                        </Button>
                      ))}
                    </TabsContent>
                    <TabsContent value="yaml" className="space-y-2">
                      {Object.entries(YAML_SAMPLES).map(([key, sample]) => (
                        <Button
                          key={key}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => loadSample('yaml', key)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{sample.name}</div>
                            <div className="text-xs text-muted-foreground">{sample.description}</div>
                          </div>
                        </Button>
                      ))}
                    </TabsContent>
                    <TabsContent value="toml" className="space-y-2">
                      {Object.entries(TOML_SAMPLES).map(([key, sample]) => (
                        <Button
                          key={key}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => loadSample('toml', key)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{sample.name}</div>
                            <div className="text-xs text-muted-foreground">{sample.description}</div>
                          </div>
                        </Button>
                      ))}
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    History ({conversionHistory.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>Conversion History</DialogTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearHistory}
                        disabled={conversionHistory.length === 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                    <DialogDescription>
                      Recent data conversions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {conversionHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No conversion history</p>
                    ) : (
                      conversionHistory.map((entry, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {entry.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge variant="outline">
                                {entry.fromFormat?.toUpperCase()} → {entry.toFormat?.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                          {entry.success ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-auto p-2"
                              onClick={() => loadFromHistory(entry)}
                            >
                              <div className="text-left text-xs font-mono">
                                {entry.input}
                              </div>
                            </Button>
                          ) : (
                            <div className="text-xs text-red-500 font-mono">
                              Error: {entry.error}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Converter Settings</DialogTitle>
                    <DialogDescription>
                      Configure validation, formatting, and other options
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="validation">Enable Validation</Label>
                        <p className="text-xs text-muted-foreground">Validate data format and syntax</p>
                      </div>
                      <Switch
                        id="validation"
                        checked={settings.enableValidation}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, enableValidation: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="schema">Schema Validation</Label>
                        <p className="text-xs text-muted-foreground">Validate against predefined schemas</p>
                      </div>
                      <Switch
                        id="schema"
                        checked={settings.enableSchemaValidation}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, enableSchemaValidation: checked }))
                        }
                      />
                    </div>
                    
                    {settings.enableSchemaValidation && (
                      <div>
                        <Label>Schema Type</Label>
                        <Select
                          value={settings.selectedSchema}
                          onValueChange={(value) => 
                            setSettings(prev => ({ ...prev, selectedSchema: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User Profile</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="config">Configuration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="prettify">Prettify Output</Label>
                        <p className="text-xs text-muted-foreground">Format output with proper indentation</p>
                      </div>
                      <Switch
                        id="prettify"
                        checked={settings.prettifyOutput}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, prettifyOutput: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="history">Enable History</Label>
                        <p className="text-xs text-muted-foreground">Keep track of conversions</p>
                      </div>
                      <Switch
                        id="history"
                        checked={settings.enableHistory}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, enableHistory: checked }))
                        }
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="input-format">Input Format</Label>
              <Select value={inputFormat} onValueChange={setInputFormat}>
                <SelectTrigger id="input-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="toml">TOML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="output-format">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger id="output-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="toml">TOML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleConvert} disabled={isConverting || !inputData.trim()}>
              {isConverting ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Convert
                </>
              )}
            </Button>
          </div>
          
          {/* Format detection badge */}
          {detectedFormat && (
            <div className="mt-3">
              <Badge variant="secondary">
                Detected: {detectedFormat.toUpperCase()}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && !validationResult.success && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Validation Errors:</div>
              {validationResult.errors.slice(0, 3).map((error, index) => {
                const formatted = formatErrorForDisplay(error, inputData);
                return (
                  <div key={index} className="space-y-1">
                    <div className="text-sm font-mono">
                      {formatted.message}
                      {formatted.line && (
                        <span className="text-muted-foreground ml-2">
                          (Line {formatted.line}{formatted.column && `, Column ${formatted.column}`})
                        </span>
                      )}
                    </div>
                    {formatted.suggestions.length > 0 && (
                      <div className="text-xs text-muted-foreground ml-4">
                        • {formatted.suggestions[0]}
                      </div>
                    )}
                  </div>
                );
              })}
              {validationResult.errors.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  ...and {validationResult.errors.length - 3} more errors
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Input/Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Input Data</CardTitle>
                <CardDescription>
                  {inputFormat === 'auto' ? 'Paste or upload your data' : `Enter ${inputFormat.toUpperCase()} data`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json,.yml,.yaml,.toml"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearInput}
                  disabled={!inputData}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={inputTextareaRef}
              placeholder="Paste your data here..."
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            {validationResult?.success && (
              <div className="mt-2 flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Valid {detectedFormat?.toUpperCase()} format</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Converted Data</CardTitle>
                <CardDescription>
                  Output in {outputFormat.toUpperCase()} format
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(outputData, 'converted', outputFormat)}
                  disabled={!outputData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(outputData)}
                  disabled={!outputData}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={minifyOutput}
                  disabled={!outputData}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Minify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearOutput}
                  disabled={!outputData}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={outputTextareaRef}
              placeholder="Converted data will appear here..."
              value={outputData}
              readOnly
              className="min-h-[400px] font-mono text-sm bg-muted/30"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (outputData) {
                  setInputData(outputData);
                  setInputFormat(outputFormat);
                  toast.success('Output moved to input');
                }
              }}
              disabled={!outputData}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Use Output as Input
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy(inputData)}
              disabled={!inputData}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Input
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload(inputData, 'input', detectedFormat || inputFormat)}
              disabled={!inputData}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Input
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataConverterShadcn;
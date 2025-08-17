import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconUpload, 
  IconFileText, 
  IconTable, 
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { 
  parseCSV, 
  detectDelimiter, 
  parseExcelData, 
  parseJSONData,
  validateFileSize,
  isValidTableFile,
  getFileExtension
} from '../utils/csvParser';
import { parseMarkdownTable } from '../utils/tableFormatter';

const ImportDialog = ({ open, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetState = useCallback(() => {
    setTextInput('');
    setSelectedFile(null);
    setDelimiter(',');
    setHasHeader(true);
    setPreview(null);
    setError(null);
    setActiveTab('text');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const generatePreview = useCallback(async (data, source = 'text') => {
    try {
      setError(null);
      let parsedData = [];

      if (source === 'file' && selectedFile) {
        const fileExtension = getFileExtension(selectedFile.name);
        
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          parsedData = await parseExcelData(selectedFile);
        } else if (fileExtension === 'json') {
          const text = await selectedFile.text();
          parsedData = parseJSONData(text);
        } else {
          // CSV/TSV/TXT
          const text = await selectedFile.text();
          const detectedDelimiter = delimiter === 'auto' ? detectDelimiter(text) : delimiter;
          parsedData = parseCSV(text, detectedDelimiter);
        }
      } else if (source === 'text' && data) {
        if (data.trim().startsWith('|')) {
          // Markdown table
          const { data: tableData, hasHeader: markdownHasHeader } = parseMarkdownTable(data);
          parsedData = tableData;
          setHasHeader(markdownHasHeader);
        } else if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
          // JSON
          parsedData = parseJSONData(data);
        } else {
          // CSV/TSV
          const detectedDelimiter = delimiter === 'auto' ? detectDelimiter(data) : delimiter;
          parsedData = parseCSV(data, detectedDelimiter);
        }
      }

      if (parsedData.length === 0) {
        setError('No data found to import');
        setPreview(null);
        return;
      }

      const limitedPreview = parsedData.slice(0, 10); // Show only first 10 rows
      setPreview({
        data: limitedPreview,
        totalRows: parsedData.length,
        fullData: parsedData
      });
    } catch (err) {
      setError(err.message);
      setPreview(null);
    }
  }, [selectedFile, delimiter]);

  const handleTextInputChange = useCallback((value) => {
    setTextInput(value);
    if (value.trim()) {
      generatePreview(value, 'text');
    } else {
      setPreview(null);
      setError(null);
    }
  }, [generatePreview]);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setError(null);
      return;
    }

    try {
      validateFileSize(file);
      
      if (!isValidTableFile(file)) {
        throw new Error('Unsupported file type. Please use CSV, TSV, TXT, XLSX, or JSON files.');
      }

      setSelectedFile(file);
      setError(null);
      await generatePreview(null, 'file');
    } catch (err) {
      setError(err.message);
      setSelectedFile(null);
      setPreview(null);
    }
  }, [generatePreview]);

  const handleDelimiterChange = useCallback((newDelimiter) => {
    setDelimiter(newDelimiter);
    
    if (activeTab === 'text' && textInput.trim()) {
      generatePreview(textInput, 'text');
    } else if (activeTab === 'file' && selectedFile) {
      generatePreview(null, 'file');
    }
  }, [activeTab, textInput, selectedFile, generatePreview]);

  const handleImport = useCallback(() => {
    if (!preview?.fullData) {
      toast.error('No data to import');
      setError('No data to import');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert to markdown and import
      const tableData = preview.fullData;
      const markdownLines = [];
      
      if (hasHeader && tableData.length > 0) {
        // Header row
        markdownLines.push(`| ${tableData[0].join(' | ')} |`);
        // Separator row
        markdownLines.push(`| ${tableData[0].map(() => '---').join(' | ')} |`);
        // Data rows
        for (let i = 1; i < tableData.length; i++) {
          markdownLines.push(`| ${tableData[i].join(' | ')} |`);
        }
      } else {
        // No header, all rows are data
        for (let i = 0; i < tableData.length; i++) {
          markdownLines.push(`| ${tableData[i].join(' | ')} |`);
        }
      }
      
      const markdown = markdownLines.join('\n');
      onImport(markdown);
      toast.success(`Successfully imported ${tableData.length} rows`);
      handleClose();
    } catch (err) {
      const errorMsg = `Import failed: ${err.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [preview, hasHeader, onImport, handleClose]);

  const renderPreviewTable = () => {
    if (!preview) return null;

    const { data, totalRows } = preview;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Preview ({data.length} of {totalRows} rows)</Label>
          {totalRows > 10 && (
            <span className="text-xs text-muted-foreground">Showing first 10 rows</span>
          )}
        </div>
        
        <div className="border rounded-lg overflow-auto max-h-64">
          <table className="w-full text-sm">
            <tbody>
              {data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`border-b ${
                    hasHeader && rowIndex === 0 ? 'bg-muted/50 font-medium' : ''
                  }`}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-r p-2 min-w-[100px]">
                      {cell || <span className="text-muted-foreground italic">empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <IconUpload className="w-5 h-5" />
            <span>Import Table Data</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <IconFileText className="w-4 h-4" />
                <span>Paste Text</span>
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center space-x-2">
                <IconUpload className="w-4 h-4" />
                <span>Upload File</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Paste your data</Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste CSV, TSV, JSON, or Markdown table data here..."
                  value={textInput}
                  onChange={(e) => handleTextInputChange(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Supports CSV, TSV, JSON arrays, and Markdown tables
                </p>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-input">Upload a file</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <IconUpload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <input
                      id="file-input"
                      type="file"
                      accept=".csv,.tsv,.txt,.xlsx,.xls,.json"
                      onChange={handleFileSelect}
                      className="mb-4"
                    />
                    {selectedFile && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports CSV, TSV, TXT, XLSX, XLS, and JSON files (max 10MB)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Import Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="delimiter-select">Delimiter (for CSV/TSV)</Label>
              <Select value={delimiter} onValueChange={handleDelimiterChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value="\t">Tab (\t)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="|">Pipe (|)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Switch
                  checked={hasHeader}
                  onCheckedChange={setHasHeader}
                />
                <span>First row is header</span>
              </Label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <IconAlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <Alert>
                <IconCheck className="w-4 h-4" />
                <AlertDescription>
                  Found {preview.totalRows} rows with {preview.data[0]?.length || 0} columns
                </AlertDescription>
              </Alert>
              {renderPreviewTable()}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              <IconX className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!preview || isLoading}
            >
              <IconTable className="w-4 h-4 mr-2" />
              {isLoading ? 'Importing...' : 'Import Table'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
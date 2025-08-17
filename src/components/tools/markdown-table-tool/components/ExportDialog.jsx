import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  IconDownload, 
  IconCopy, 
  IconFileText, 
  IconCheck,
  IconX,
  IconTable,
  IconCode,
  IconBraces
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { convertToCSV, convertToTSV, convertToJSON } from '../utils/csvParser';

const ExportDialog = ({ open, onClose, tableData, alignments, hasHeader, markdown }) => {
  const [exportFormat, setExportFormat] = useState('markdown');
  const [includeHeader, setIncludeHeader] = useState(hasHeader);
  const [csvDelimiter, setCsvDelimiter] = useState(',');
  const [filename, setFilename] = useState('table');
  const [copied, setCopied] = useState(false);

  const resetState = useCallback(() => {
    setExportFormat('markdown');
    setIncludeHeader(hasHeader);
    setCsvDelimiter(',');
    setFilename('table');
    setCopied(false);
  }, [hasHeader]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const generateExportData = useCallback(() => {
    const generateHTMLTable = (data, aligns, hasHeaderRow) => {
      if (!data || data.length === 0) return '';

      const getAlignmentClass = (alignment) => {
        switch (alignment) {
          case 'center': return 'text-center';
          case 'right': return 'text-right';
          default: return 'text-left';
        }
      };

      let html = '<!DOCTYPE html>\n<html>\n<head>\n';
      html += '  <title>Exported Table</title>\n';
      html += '  <style>\n';
      html += '    table { border-collapse: collapse; width: 100%; }\n';
      html += '    th, td { border: 1px solid #ddd; padding: 8px; }\n';
      html += '    th { background-color: #f2f2f2; font-weight: bold; }\n';
      html += '    .text-left { text-align: left; }\n';
      html += '    .text-center { text-align: center; }\n';
      html += '    .text-right { text-align: right; }\n';
      html += '  </style>\n</head>\n<body>\n';
      html += '<table>\n';

      if (hasHeaderRow && data.length > 0) {
        html += '  <thead>\n    <tr>\n';
        data[0].forEach((cell, index) => {
          const alignment = aligns[index] || 'left';
          html += `      <th class="${getAlignmentClass(alignment)}">${escapeHtml(cell)}</th>\n`;
        });
        html += '    </tr>\n  </thead>\n';
        html += '  <tbody>\n';
        
        for (let i = 1; i < data.length; i++) {
          html += '    <tr>\n';
          data[i].forEach((cell, index) => {
            const alignment = aligns[index] || 'left';
            html += `      <td class="${getAlignmentClass(alignment)}">${escapeHtml(cell)}</td>\n`;
          });
          html += '    </tr>\n';
        }
      } else {
        html += '  <tbody>\n';
        data.forEach(row => {
          html += '    <tr>\n';
          row.forEach((cell, index) => {
            const alignment = aligns[index] || 'left';
            html += `      <td class="${getAlignmentClass(alignment)}">${escapeHtml(cell)}</td>\n`;
          });
          html += '    </tr>\n';
        });
      }

      html += '  </tbody>\n</table>\n</body>\n</html>';
      return html;
    };

    if (!tableData || tableData.length === 0) {
      return { content: '', mimeType: 'text/plain', extension: 'txt' };
    }

    const dataToExport = includeHeader ? tableData : tableData.slice(hasHeader ? 1 : 0);

    switch (exportFormat) {
      case 'csv':
        return {
          content: convertToCSV(dataToExport, csvDelimiter),
          mimeType: 'text/csv',
          extension: 'csv'
        };

      case 'tsv':
        return {
          content: convertToTSV(dataToExport),
          mimeType: 'text/tab-separated-values',
          extension: 'tsv'
        };

      case 'json':
        return {
          content: convertToJSON(dataToExport, includeHeader && hasHeader),
          mimeType: 'application/json',
          extension: 'json'
        };

      case 'html':
        return {
          content: generateHTMLTable(dataToExport, alignments, includeHeader && hasHeader),
          mimeType: 'text/html',
          extension: 'html'
        };

      case 'latex':
        return {
          content: generateLaTeXTable(dataToExport, alignments, includeHeader && hasHeader),
          mimeType: 'text/x-latex',
          extension: 'tex'
        };

      case 'markdown':
      default:
        return {
          content: markdown,
          mimeType: 'text/markdown',
          extension: 'md'
        };
    }
  }, [tableData, exportFormat, includeHeader, hasHeader, csvDelimiter, alignments, markdown]);

  const generateLaTeXTable = (data, aligns, hasHeaderRow) => {
    if (!data || data.length === 0) return '';

    const getLatexAlignment = (alignment) => {
      switch (alignment) {
        case 'center': return 'c';
        case 'right': return 'r';
        default: return 'l';
      }
    };

    const escapeLatex = (text) => {
      return String(text)
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/[&%$#_{}]/g, '\\$&')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');
    };

    const columnSpec = aligns.map(getLatexAlignment).join('|');
    let latex = '\\begin{table}[h!]\n';
    latex += '\\centering\n';
    latex += `\\begin{tabular}{|${columnSpec}|}\n`;
    latex += '\\hline\n';

    if (hasHeaderRow && data.length > 0) {
      const headerRow = data[0].map(escapeLatex).join(' & ');
      latex += `${headerRow} \\\\\n\\hline\n`;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i].map(escapeLatex).join(' & ');
        latex += `${row} \\\\\n`;
      }
    } else {
      data.forEach(row => {
        const latexRow = row.map(escapeLatex).join(' & ');
        latex += `${latexRow} \\\\\n`;
      });
    }

    latex += '\\hline\n';
    latex += '\\end{tabular}\n';
    latex += '\\caption{Exported Table}\n';
    latex += '\\end{table}';

    return latex;
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handleCopy = useCallback(async () => {
    try {
      const { content } = generateExportData();
      if (!content.trim()) {
        toast.error('No content to copy');
        return;
      }
      await navigator.clipboard.writeText(content);
      toast.success(`${exportFormat.toUpperCase()} content copied to clipboard`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, [generateExportData, exportFormat]);

  const handleDownload = useCallback(() => {
    try {
      const { content, mimeType, extension } = generateExportData();
      if (!content.trim()) {
        toast.error('No content to download');
        return;
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`File downloaded: ${filename}.${extension}`);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file');
    }
  }, [generateExportData, filename]);

  const getFormatIcon = (format) => {
    switch (format) {
      case 'html': return <IconCode className="w-4 h-4" />;
      case 'json': return <IconBraces className="w-4 h-4" />;
      case 'latex': return <IconFileText className="w-4 h-4" />;
      default: return <IconTable className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format) => {
    switch (format) {
      case 'markdown': return 'GitHub Flavored Markdown table format';
      case 'csv': return 'Comma-separated values, compatible with Excel';
      case 'tsv': return 'Tab-separated values, good for importing';
      case 'json': return 'JSON array format, for programmatic use';
      case 'html': return 'HTML table with styling, ready for web pages';
      case 'latex': return 'LaTeX table format for academic documents';
      default: return '';
    }
  };

  const exportData = generateExportData();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <IconDownload className="w-5 h-5" />
            <span>Export Table</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {getFormatIcon(exportFormat)}
                    <span>{exportFormat.toUpperCase()}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">
                  <div className="flex items-center space-x-2">
                    <IconTable className="w-4 h-4" />
                    <span>Markdown</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <IconTable className="w-4 h-4" />
                    <span>CSV</span>
                  </div>
                </SelectItem>
                <SelectItem value="tsv">
                  <div className="flex items-center space-x-2">
                    <IconTable className="w-4 h-4" />
                    <span>TSV</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center space-x-2">
                    <IconBraces className="w-4 h-4" />
                    <span>JSON</span>
                  </div>
                </SelectItem>
                <SelectItem value="html">
                  <div className="flex items-center space-x-2">
                    <IconCode className="w-4 h-4" />
                    <span>HTML</span>
                  </div>
                </SelectItem>
                <SelectItem value="latex">
                  <div className="flex items-center space-x-2">
                    <IconFileText className="w-4 h-4" />
                    <span>LaTeX</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{getFormatDescription(exportFormat)}</p>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-3">
              <Label className="flex items-center space-x-2">
                <Switch
                  checked={includeHeader}
                  onCheckedChange={setIncludeHeader}
                />
                <span>Include header row</span>
              </Label>

              {exportFormat === 'csv' && (
                <div className="space-y-2">
                  <Label htmlFor="csv-delimiter">CSV Delimiter</Label>
                  <Select value={csvDelimiter} onValueChange={setCsvDelimiter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab (\t)</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
              />
              <p className="text-xs text-muted-foreground">
                Will be saved as: {filename}.{exportData.extension}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="border rounded-lg bg-muted/30 p-4 max-h-64 overflow-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                {exportData.content.length > 2000 
                  ? exportData.content.substring(0, 2000) + '\n... (truncated for display)'
                  : exportData.content
                }
              </pre>
            </div>
          </div>

          {/* File Info */}
          <Alert>
            <IconCheck className="w-4 h-4" />
            <AlertDescription>
              Ready to export {tableData?.length || 0} rows × {tableData?.[0]?.length || 0} columns 
              as {exportFormat.toUpperCase()} ({(new Blob([exportData.content]).size / 1024).toFixed(1)} KB)
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              <IconX className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <IconCheck className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <IconCopy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            
            <Button onClick={handleDownload}>
              <IconDownload className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
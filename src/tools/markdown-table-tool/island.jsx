import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Check, Copy, Download, Plus, TriangleAlert, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { copyText } from '@/core';
import { useTableEditor } from './hooks/useTableEditor';
import TableEditor from './components/TableEditor';
import MarkdownPreview from './components/MarkdownPreview';
import ImportDialog from './components/ImportDialog';
import ExportDialog from './components/ExportDialog';

const MarkdownTableTool = () => {
  const {
    tableData,
    alignments,
    hasHeader,
    selectedCell,
    validation,
    stats,
    canUndo,
    canRedo,
    updateCell,
    addRow,
    removeRow,
    addColumn,
    removeColumn,
    updateAlignment,
    setHasHeader,
    clearTable,
    undo,
    redo,
    exportToMarkdown,
    importFromMarkdown
  } = useTableEditor();

  const [activeTab, setActiveTab] = useState('editor');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleCopyMarkdown = async () => {
    const markdown = exportToMarkdown();
    if (!markdown.trim()) {
      toast.error('No content to copy');
      return;
    }
    if (await copyText(markdown)) {
      toast.success('Markdown copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleImport = (markdownText) => {
    try {
      importFromMarkdown(markdownText);
      toast.success('Table imported successfully');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Failed to import table: ' + error.message);
    }
  };

  const getValidationColor = () => {
    if (!validation.isValid) return 'text-destructive';
    if (validation.data.warnings.length > 0 || validation.markdown.warnings.length > 0) return 'text-warning';
    return 'text-success';
  };

  const getValidationIcon = () => {
    if (!validation.isValid) return <TriangleAlert className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getValidationColor()}>
              {getValidationIcon()}
              {validation.isValid ? 'Valid' : 'Issues'}
            </Badge>

            <Badge variant="secondary">
              {stats.rows} rows × {stats.columns} cols
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              title="Undo last action"
              aria-label="Undo last action"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              title="Redo last action"
              aria-label="Redo last action"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
            >
              <Plus className="w-4 h-4 mr-1" />
              Row
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={addColumn}
            >
              <Plus className="w-4 h-4 mr-1" />
              Column
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="editor">Visual Editor</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
            <TabsTrigger value="markdown">Raw Markdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor">
            <TableEditor
              data={tableData}
              alignments={alignments}
              hasHeader={hasHeader}
              selectedCell={selectedCell}
              onUpdateCell={updateCell}
              onAddRow={addRow}
              onRemoveRow={removeRow}
              onAddColumn={addColumn}
              onRemoveColumn={removeColumn}
              onUpdateAlignment={updateAlignment}
              onToggleHeader={setHasHeader}
              onClearTable={clearTable}
            />
          </TabsContent>
          
          <TabsContent value="preview">
            <MarkdownPreview
              markdown={exportToMarkdown()}
              validation={validation}
              stats={stats}
            />
          </TabsContent>
          
          <TabsContent value="markdown">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-title-sm">Raw Markdown Output</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-data-md font-mono whitespace-pre-wrap break-all">
                  {exportToMarkdown()}
                </pre>
              </div>
              
              {!validation.isValid && (
                <Alert variant="destructive">
                  <TriangleAlert className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Validation Errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-body-sm">
                      {validation.data.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {validation.markdown.errors.map((error, index) => (
                        <li key={`md-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {(validation.data.warnings.length > 0 || validation.markdown.warnings.length > 0) && (
                <Alert>
                  <TriangleAlert className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-1 text-body-sm">
                      {validation.data.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                      {validation.markdown.warnings.map((warning, index) => (
                        <li key={`md-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <ImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />

        <ExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          tableData={tableData}
          alignments={alignments}
          hasHeader={hasHeader}
          markdown={exportToMarkdown()}
        />
      </div>
    </>
  );
};

export default MarkdownTableTool;
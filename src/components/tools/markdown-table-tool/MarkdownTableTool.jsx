import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconTable, IconPlus, IconMinus, IconArrowLeft, IconArrowRight, IconDownload, IconUpload, IconCopy, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
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
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    try {
      const markdown = exportToMarkdown();
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getValidationColor = () => {
    if (!validation.isValid) return 'text-red-500';
    if (validation.data.warnings.length > 0 || validation.markdown.warnings.length > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getValidationIcon = () => {
    if (!validation.isValid) return <IconAlertTriangle className="w-4 h-4" />;
    return <IconCheck className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <IconTable className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Markdown Table Tool</h1>
            <p className="text-gray-600 dark:text-gray-400">Create, format, and validate markdown tables</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getValidationColor()}>
            {getValidationIcon()}
            {validation.isValid ? 'Valid' : 'Issues'}
          </Badge>
          
          <Badge variant="secondary">
            {stats.rows} rows × {stats.columns} cols
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Table Editor</CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <IconUpload className="w-4 h-4 mr-1" />
                Import
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <IconDownload className="w-4 h-4 mr-1" />
                Export
              </Button>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
              >
                <IconArrowLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
              >
                <IconArrowRight className="w-4 h-4" />
              </Button>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
              >
                <IconPlus className="w-4 h-4 mr-1" />
                Row
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={addColumn}
              >
                <IconPlus className="w-4 h-4 mr-1" />
                Column
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Visual Editor</TabsTrigger>
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
              <TabsTrigger value="markdown">Raw Markdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="mt-4">
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
            
            <TabsContent value="preview" className="mt-4">
              <MarkdownPreview
                markdown={exportToMarkdown()}
                validation={validation}
                stats={stats}
              />
            </TabsContent>
            
            <TabsContent value="markdown" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Raw Markdown Output</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMarkdown}
                    className={copied ? 'text-green-600' : ''}
                  >
                    {copied ? (
                      <>
                        <IconCheck className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <IconCopy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                    {exportToMarkdown()}
                  </pre>
                </div>
                
                {!validation.isValid && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Validation Errors:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                      {validation.data.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {validation.markdown.errors.map((error, index) => (
                        <li key={`md-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(validation.data.warnings.length > 0 || validation.markdown.warnings.length > 0) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                      {validation.data.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                      {validation.markdown.warnings.map((warning, index) => (
                        <li key={`md-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={importFromMarkdown}
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
  );
};

export default MarkdownTableTool;
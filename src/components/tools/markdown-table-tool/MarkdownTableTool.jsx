import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconTable, IconPlus, IconMinus, IconArrowLeft, IconArrowRight, IconDownload, IconUpload, IconCopy, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { toast } from 'sonner';
import SEOHead from '@/components/common/SEOHead';
import ToolHeader from '@/components/common/ToolHeader';
import MarkdownTableIcon from './MarkdownTableIcon';
import { generateToolSEO } from '@/utils/seoUtils';
import toolsConfig from '@/utils/toolsConfig.json';
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

  // Generate SEO data
  const tool = toolsConfig.find(t => t.id === 'markdown-table-tool');
  const seoData = generateToolSEO(tool);

  const handleCopyMarkdown = async () => {
    try {
      const markdown = exportToMarkdown();
      if (!markdown.trim()) {
        toast.error('No content to copy');
        return;
      }
      await navigator.clipboard.writeText(markdown);
      toast.success('Markdown copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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
    if (validation.data.warnings.length > 0 || validation.markdown.warnings.length > 0) return 'text-orange-600';
    return 'text-green-600';
  };

  const getValidationIcon = () => {
    if (!validation.isValid) return <IconAlertTriangle className="w-4 h-4" />;
    return <IconCheck className="w-4 h-4" />;
  };

  return (
    <>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        <ToolHeader
          icon={MarkdownTableIcon}
          title="Markdown Table Tool"
          description="Create, format, and validate markdown tables with real-time preview and advanced editing features"
          iconColor="blue"
          showTitle={false}
          actions={[
            {
              text: "Import",
              icon: IconUpload,
              onClick: () => setShowImportDialog(true),
              variant: "outline"
            },
            {
              text: "Export",
              icon: IconDownload,
              onClick: () => setShowExportDialog(true),
              variant: "outline"
            }
          ]}
          standalone={true}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getValidationColor()}>
              {getValidationIcon()}
              {validation.isValid ? 'Valid' : 'Issues'}
            </Badge>
            
            <Badge variant="secondary">
              {stats.rows} rows × {stats.columns} cols
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              title="Undo last action"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              title="Redo last action"
            >
              <IconArrowRight className="w-4 h-4" />
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
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
                <h3 className="text-lg font-medium">Raw Markdown Output</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                >
                  <IconCopy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                  {exportToMarkdown()}
                </pre>
              </div>
              
              {!validation.isValid && (
                <Alert variant="destructive">
                  <IconAlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Validation Errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
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
                  <IconAlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Warnings:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
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
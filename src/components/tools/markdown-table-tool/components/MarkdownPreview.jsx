import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  IconCheck, 
  IconAlertTriangle, 
  IconInfoCircle,
  IconTable,
  IconFileText,
  IconHash
} from '@tabler/icons-react';

const MarkdownPreview = ({ markdown, validation, stats }) => {
  const renderMarkdownTable = (markdownText) => {
    if (!markdownText) return null;

    const lines = markdownText.split('\n').filter(line => line.trim());
    const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    
    if (tableLines.length === 0) return null;

    let headerRow = null;
    let separatorIndex = -1;
    let dataRows = [];

    // Find separator row
    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      const content = line.trim().slice(1, -1);
      if (/^[\s\-:|]*$/.test(content) && content.includes('-')) {
        separatorIndex = i;
        break;
      }
    }

    if (separatorIndex > 0) {
      headerRow = tableLines[0];
      dataRows = tableLines.slice(separatorIndex + 1);
    } else {
      dataRows = tableLines;
    }

    const parseRow = (line) => {
      return line
        .trim()
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim());
    };

    const getAlignmentFromSeparator = (separatorLine) => {
      const cells = separatorLine
        .trim()
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim());

      return cells.map(cell => {
        if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
        if (cell.endsWith(':')) return 'right';
        return 'left';
      });
    };

    const alignments = separatorIndex >= 0 
      ? getAlignmentFromSeparator(tableLines[separatorIndex])
      : [];

    return (
      <div className="border rounded-lg overflow-auto">
        <table className="w-full border-collapse">
          {headerRow && (
            <thead>
              <tr className="bg-muted/50">
                {parseRow(headerRow).map((cell, index) => (
                  <th
                    key={index}
                    className={`border border-border p-3 font-medium ${
                      alignments[index] === 'center' ? 'text-center' :
                      alignments[index] === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30">
                {parseRow(row).map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`border border-border p-3 ${
                      alignments[cellIndex] === 'center' ? 'text-center' :
                      alignments[cellIndex] === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getValidationIcon = (type) => {
    switch (type) {
      case 'error': return <IconAlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <IconAlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <IconCheck className="w-4 h-4 text-green-500" />;
      default: return <IconInfoCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getValidationVariant = (type) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IconTable className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Dimensions</p>
                <p className="text-lg font-bold">{stats.rows} × {stats.columns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IconHash className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Cells</p>
                <p className="text-lg font-bold">{stats.cells}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IconFileText className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Characters</p>
                <p className="text-lg font-bold">{stats.totalCharacters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 rounded-full ${
                validation.isValid ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-lg font-bold">{validation.isValid ? 'Valid' : 'Invalid'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {(!validation.isValid || validation.data.warnings.length > 0 || validation.markdown.warnings.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Validation Results</h3>
          
          {/* Errors */}
          {validation.data.errors.map((error, index) => (
            <Alert key={`data-error-${index}`} variant={getValidationVariant('error')}>
              <div className="flex items-start space-x-2">
                {getValidationIcon('error')}
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ))}
          
          {validation.markdown.errors.map((error, index) => (
            <Alert key={`md-error-${index}`} variant={getValidationVariant('error')}>
              <div className="flex items-start space-x-2">
                {getValidationIcon('error')}
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          ))}

          {/* Warnings */}
          {validation.data.warnings.map((warning, index) => (
            <Alert key={`data-warning-${index}`} variant={getValidationVariant('warning')}>
              <div className="flex items-start space-x-2">
                {getValidationIcon('warning')}
                <AlertDescription>{warning}</AlertDescription>
              </div>
            </Alert>
          ))}
          
          {validation.markdown.warnings.map((warning, index) => (
            <Alert key={`md-warning-${index}`} variant={getValidationVariant('warning')}>
              <div className="flex items-start space-x-2">
                {getValidationIcon('warning')}
                <AlertDescription>{warning}</AlertDescription>
              </div>
            </Alert>
          ))}

          {/* Success */}
          {validation.isValid && (
            <Alert variant="default">
              <div className="flex items-start space-x-2">
                {getValidationIcon('success')}
                <AlertDescription>Table is valid and ready for use!</AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Live Preview</CardTitle>
            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.isValid ? 'Renders correctly' : 'May not render properly'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {markdown ? (
            <div className="space-y-4">
              {renderMarkdownTable(markdown)}
              
              {/* Mobile Preview Note */}
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <IconInfoCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Preview Note:</p>
                    <p>This preview shows how your table will render in markdown viewers. On smaller screens, tables may scroll horizontally.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconTable className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No table data to preview</p>
              <p className="text-sm">Add some content to your table to see the preview</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Markdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw Markdown</CardTitle>
        </CardHeader>
        <CardContent>
          {markdown ? (
            <div className="bg-muted/30 rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                {markdown}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconFileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No markdown generated</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkdownPreview;
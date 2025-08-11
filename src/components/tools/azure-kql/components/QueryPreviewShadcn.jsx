import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Copy, Code2, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import Prism from 'prismjs';
import '../../../../utils/prism-kql';

const QueryPreviewShadcn = ({ query, service, parameters, template }) => {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState('');

  useEffect(() => {
    if (query) {
      // Apply syntax highlighting
      const highlightedCode = Prism.highlight(query, Prism.languages.kql, 'kql');
      setHighlighted(highlightedCode);
    }
  }, [query]);

  const handleCopy = () => {
    if (query) {
      navigator.clipboard.writeText(query);
      setCopied(true);
      toast.success('Query copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getQueryMetrics = () => {
    if (!query) return null;
    
    const lines = query.split('\n').filter(line => line.trim());
    const operators = (query.match(/\|/g) || []).length;
    const filters = (query.match(/where/gi) || []).length;
    const projections = (query.match(/project/gi) || []).length;
    
    return {
      lines: lines.length,
      operators,
      filters,
      projections,
      complexity: operators > 5 ? 'Complex' : operators > 2 ? 'Moderate' : 'Simple'
    };
  };

  const metrics = getQueryMetrics();

  if (!query) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Query Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure parameters and click "Generate KQL Query" to see the preview
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Query Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            {metrics && (
              <>
                <Badge variant="secondary">{metrics.lines} lines</Badge>
                <Badge variant="secondary">{metrics.complexity}</Badge>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
            >
              {copied ? (
                <>✓ Copied</>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm">
            <code 
              className="language-kql text-slate-100"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
        
        {metrics && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">
              <FileText className="w-3 h-3 mr-1" />
              {metrics.operators} operators
            </Badge>
            <Badge variant="outline">
              {metrics.filters} filters
            </Badge>
            <Badge variant="outline">
              {metrics.projections} projections
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryPreviewShadcn;
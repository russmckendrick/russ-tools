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
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Code2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Query Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-800/50 dark:bg-cyan-950/50">
            <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <AlertDescription className="text-cyan-800 dark:text-cyan-200">
              Configure parameters and click "Generate KQL Query" to see the preview
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Code2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Query Preview
          </CardTitle>
          <div className="flex items-center gap-3">
            {metrics && (
              <>
                <Badge variant="secondary" className="h-6 px-2.5 text-xs">
                  {metrics.lines} lines
                </Badge>
                <Badge 
                  variant={metrics.complexity === 'Complex' ? 'destructive' : metrics.complexity === 'Moderate' ? 'default' : 'secondary'}
                  className="h-6 px-2.5 text-xs"
                >
                  {metrics.complexity}
                </Badge>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 px-3"
            >
              {copied ? (
                <span className="text-green-600 dark:text-green-400 font-medium">✓ Copied</span>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl bg-slate-950 dark:bg-slate-900 p-5 text-sm border border-slate-800">
            <code 
              className="language-kql text-slate-100 dark:text-slate-200"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
        
        {metrics && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="h-7 px-3 text-xs">
              <FileText className="w-3 h-3 mr-1.5" />
              {metrics.operators} operators
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-xs">
              {metrics.filters} filters
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-xs">
              {metrics.projections} projections
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryPreviewShadcn;
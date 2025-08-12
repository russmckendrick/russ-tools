import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Info, Code2, FileText } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { getQueryMetadata } from '../utils/queryGenerator';

Prism.languages.kql = {
  'comment': {
    pattern: /\/\/.*/,
    greedy: true
  },
  'string': {
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true
  },
  'keyword': /\b(?:where|project|summarize|order|by|limit|extend|join|union|let|on|in|contains|startswith|endswith|and|or|not|between|ago|now|datetime|bin|count|sum|avg|min|max|distinct|any|all|take|top|sort|asc|desc)\b/i,
  'function': /\b(?:TimeGenerated|ipv4_is_in_range|geo_info_from_ip_address|tostring|toint|todouble|tobool|parse_json)\b/,
  'operator': /[=!<>]=?|[&|]=?|\+|-|\*|\/|%/,
  'punctuation': /[{}[\];(),.:]/,
  'number': /\b\d+(?:\.\d+)?\b/,
  'boolean': /\b(?:true|false)\b/i
};

const QueryPreview = ({ query, service, template }) => {
  const [highlighted, setHighlighted] = useState('');
  const metadata = query ? getQueryMetadata(query) : null;

  useEffect(() => {
    if (query) {
      const html = Prism.highlight(query, Prism.languages.kql, 'kql');
      setHighlighted(html);
    }
  }, [query]);

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
            <Info className="w-4 h-4" />
            <AlertDescription>
              Configure parameters and click "Generate Query" to see the KQL output
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Query Preview
          </div>
          {metadata && (
            <div className="flex gap-2">
              <Badge variant="secondary">
                <FileText className="w-3 h-3 mr-1" />
                {metadata.table}
              </Badge>
              <Badge variant="secondary">
                {metadata.filterCount} filters
              </Badge>
              <Badge variant="secondary">
                Limit: {metadata.limit}
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="language-kql bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code 
              className="language-kql"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
        
        {template?.performance_notes && (
          <Alert className="mt-4">
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Performance Note:</strong> {template.performance_notes}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryPreview;
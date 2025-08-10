import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { History, Clock, FileText, Trash2 } from 'lucide-react';
// Simple time ago formatter
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const QueryHistoryShadcn = ({ history, onLoadQuery }) => {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Query History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No query history yet. Generated queries will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{entry.service}</Badge>
                    <Badge variant="outline">{entry.template}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(new Date(entry.timestamp))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLoadQuery(entry)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Load
                </Button>
              </div>
              
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                <code>{entry.query.substring(0, 200)}...</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QueryHistoryShadcn;
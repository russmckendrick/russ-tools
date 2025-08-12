import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Badge } from '../../../ui/badge';
import { Alert, AlertDescription } from '../../../ui/alert';
import { 
  Clock, 
  Search, 
  Trash2, 
  Upload, 
  Database,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const QueryHistory = ({ history, onLoad, onClear }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(entry => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      entry.service?.toLowerCase().includes(search) ||
      entry.template?.toLowerCase().includes(search) ||
      entry.query?.toLowerCase().includes(search) ||
      Object.values(entry.parameters || {}).some(val => 
        String(val).toLowerCase().includes(search)
      )
    );
  });

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Query History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              No queries in history yet. Generated queries will appear here automatically.
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
            <Clock className="w-5 h-5" />
            Query History
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{history.length} queries</Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClear}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {filteredHistory.map((entry, index) => (
            <div 
              key={index}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{entry.service}</span>
                    <Badge variant="secondary">{entry.template}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoad(entry)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Load
                </Button>
              </div>
              
              <div className="bg-muted/30 p-2 rounded text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {entry.query.split('\n').slice(0, 3).join('\n')}
                  {entry.query.split('\n').length > 3 && '\n...'}
                </pre>
              </div>
              
              {Object.keys(entry.parameters || {}).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(entry.parameters).map(([key, value]) => (
                    value && value !== '' && value !== 'any' && (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {String(value)}
                      </Badge>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredHistory.length === 0 && searchTerm && (
          <Alert>
            <AlertDescription>
              No queries found matching "{searchTerm}"
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryHistory;
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { History, Trash2, RotateCcw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const ConversionHistory = ({ 
  conversionHistory, 
  isOpen, 
  onOpenChange, 
  onLoadFromHistory, 
  onClearHistory 
}) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFormatColor = (format) => {
    const colors = {
      json: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      yaml: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      toml: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[format] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const truncateData = (data, maxLength = 100) => {
    if (!data || typeof data !== 'string') return '';
    if (data.length <= maxLength) return data;
    return data.substring(0, maxLength) + '...';
  };

  const handleClearHistory = () => {
    onClearHistory();
    toast.success('Conversion history cleared');
  };

  const handleLoadFromHistory = (historyItem) => {
    onLoadFromHistory(historyItem);
    onOpenChange(false);
    toast.success('Loaded from history');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History ({conversionHistory?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Conversion History</DialogTitle>
              <DialogDescription>
                Recent data conversions ({conversionHistory?.length || 0} items)
              </DialogDescription>
            </div>
            {conversionHistory && conversionHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
            {!conversionHistory || conversionHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversion history yet</p>
                <p className="text-sm">Your conversions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversionHistory?.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getFormatColor(item.inputFormat || item.fromFormat)}>
                              {(item.inputFormat || item.fromFormat || 'unknown').toUpperCase()}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge className={getFormatColor(item.outputFormat || item.toFormat)}>
                              {(item.outputFormat || item.toFormat || 'unknown').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Input:</p>
                              <pre className="text-xs font-mono bg-muted p-2 rounded max-h-20 overflow-hidden">
                                {truncateData(item.inputData || item.input || '')}
                              </pre>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Output:</p>
                              <pre className="text-xs font-mono bg-muted p-2 rounded max-h-20 overflow-hidden">
                                {truncateData(item.outputData || item.output || '')}
                              </pre>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadFromHistory(item)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversionHistory;
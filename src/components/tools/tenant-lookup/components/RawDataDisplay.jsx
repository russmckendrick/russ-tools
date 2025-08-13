import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Copy, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

const RawDataDisplay = ({ data }) => {
  const [showRawData, setShowRawData] = useState(false);

  if (!data) return null;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportJson = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tenant-lookup-${data.domain}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('JSON file downloaded');
  };

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Raw Response Data
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
          >
            {showRawData ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
            {showRawData ? 'Hide' : 'Show'} Raw Data
          </Button>
        </div>
      </CardHeader>
      {showRawData && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Complete JSON Response ({jsonString.length.toLocaleString()} characters)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(jsonString)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy JSON
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exportJson}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
            <Textarea
              value={jsonString}
              readOnly
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default RawDataDisplay;
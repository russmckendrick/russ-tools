import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, RotateCcw, Globe } from 'lucide-react';

const DNSHistoryDisplay = ({ 
  lookupHistory, 
  onHistoryItemClick, 
  onClearHistory 
}) => {
  if (!lookupHistory || lookupHistory.length === 0) return null;

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      'A': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'AAAA': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'MX': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'TXT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'CNAME': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'NS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'SOA': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'PTR': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'SRV': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'CAA': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getProviderBadgeColor = (provider) => {
    const colors = {
      'google': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'cloudflare': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'opendns': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'auto': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getProviderName = (provider) => {
    const names = {
      'google': 'Google DNS',
      'cloudflare': 'Cloudflare DNS',
      'opendns': 'OpenDNS',
      'auto': 'Browser Default'
    };
    return names[provider] || provider;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Recent DNS Lookups</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearHistory}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lookupHistory.slice(0, 10).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium font-mono">{item.domain}</p>
                    <Badge className={getRecordTypeColor(item.recordType)}>
                      {item.recordType}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getProviderBadgeColor(item.provider)}
                    >
                      {getProviderName(item.provider)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatTimestamp(item.timestamp)}
                  </p>
                  {item.recordCount && (
                    <p className="text-xs text-muted-foreground">
                      {item.recordCount} record{item.recordCount !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onHistoryItemClick(item)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Repeat
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DNSHistoryDisplay;
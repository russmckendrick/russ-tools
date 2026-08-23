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
      'A': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'AAAA': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'MX': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'TXT': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'CNAME': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'NS': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'SOA': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'PTR': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'SRV': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'CAA': 'bg-surface-inset text-on-surface'
    };
    return colors[type] || 'bg-surface-inset text-on-surface';
  };

  const getProviderBadgeColor = (provider) => {
    const colors = {
      'google': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'cloudflare': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'opendns': 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]',
      'auto': 'bg-surface-inset text-on-surface'
    };
    return colors[provider] || 'bg-surface-inset text-on-surface';
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
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h3 className="text-title-sm">Recent DNS Lookups</h3>
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
            <div key={index} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-md">
              <div className="flex min-w-0 items-center gap-3">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium font-mono">{item.domain || item.query}</p>
                    <Badge className={getRecordTypeColor(item.recordType || 'A')}>
                      {item.recordType || 'A'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getProviderBadgeColor(item.provider || 'google')}
                    >
                      {getProviderName(item.provider || 'google')}
                    </Badge>
                  </div>
                  <p className="text-data-md font-mono text-muted-foreground">
                    {formatTimestamp(item.timestamp)}
                  </p>
                  {item.recordCount && (
                    <p className="text-body-sm text-muted-foreground">
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

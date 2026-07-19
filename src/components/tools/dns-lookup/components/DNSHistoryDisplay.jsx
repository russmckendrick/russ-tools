import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, Globe } from 'lucide-react';

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
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <History className="h-4 w-4 shrink-0 text-[var(--cat)]" />
            <h3 className="truncate text-title-sm">Recent Lookups</h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClearHistory}
            aria-label="Clear DNS lookup history"
            title="Clear history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/*
          The whole row is the button. In a 320px control column there is no
          space for a domain, two badges, a timestamp and a separate "Repeat"
          control side by side — and a history entry only ever does one thing
          when you click it, so a dedicated affordance was always redundant.
        */}
        <div className="grid gap-1.5">
          {lookupHistory.slice(0, 10).map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onHistoryItemClick(item)}
              title={`Repeat ${item.recordType} lookup for ${item.domain}`}
              className="grid w-full gap-1 rounded-md border border-outline p-2.5 text-left transition-colors hover:border-[var(--cat)] hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono font-medium">{item.domain}</span>
                <Badge className={`ml-auto shrink-0 ${getRecordTypeColor(item.recordType)}`}>
                  {item.recordType}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pl-6 text-data-sm font-mono text-muted-foreground">
                <span className="truncate">{getProviderName(item.provider)}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{formatTimestamp(item.timestamp)}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DNSHistoryDisplay;
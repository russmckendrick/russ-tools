import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { dnsTypeName, formatDnsRecord } from '@/core';

const DNSRecordDisplay = ({ record }) => {
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const isIPAddress = (str) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
  };

  const recordText = `${record.name} → ${formatDnsRecord(record)}`;
  const isIP = isIPAddress(record.data);

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-outline bg-surface-inset p-3">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <Badge>{dnsTypeName(record.type)}</Badge>
        <div className="min-w-0 flex-1 break-words font-mono text-data-md">
          {recordText}
        </div>
      </div>
      <div className="ml-2 flex flex-shrink-0 gap-2">
        {isIP && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <Link to={`/whois-lookup/${record.data}`}>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>WHOIS lookup for {record.data}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(recordText)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy record</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default DNSRecordDisplay;

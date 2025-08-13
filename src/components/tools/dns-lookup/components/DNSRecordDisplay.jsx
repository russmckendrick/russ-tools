import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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

  const formatDNSRecord = (record) => {
    const formatTTL = (ttl) => ttl ? ` (TTL: ${ttl}s)` : '';
    
    switch (record.type) {
      case 1: // A
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
      case 28: // AAAA
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
      case 15: // MX
        return `${record.name} → ${record.priority} ${record.exchange}${formatTTL(record.TTL)}`;
      case 16: // TXT
        return `${record.name} → "${record.data}"${formatTTL(record.TTL)}`;
      case 5: // CNAME
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
      case 2: // NS
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
      case 6: // SOA
        return `${record.name} → ${record.mname} ${record.rname} (Serial: ${record.serial})${formatTTL(record.TTL)}`;
      case 12: // PTR
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
      case 33: // SRV
        return `${record.name} → ${record.priority} ${record.weight} ${record.port} ${record.target}${formatTTL(record.TTL)}`;
      case 257: // CAA
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
      default:
        return `${record.name} → ${record.data}${formatTTL(record.TTL)}`;
    }
  };

  const recordText = formatDNSRecord(record);
  const isIP = isIPAddress(record.data);
  
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
      <div className="font-mono text-sm flex-1 break-all">
        {recordText}
      </div>
      <div className="flex gap-2 ml-2 flex-shrink-0">
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
import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Mail, FileText, Copy, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';

const DNSAnalysisDisplay = ({ dnsInfo }) => {
  if (!dnsInfo) return null;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getEmailProviderFromMX = (mxRecord) => {
    const exchange = mxRecord.exchange.toLowerCase();
    if (exchange.includes('outlook') || exchange.includes('microsoft')) return 'Microsoft 365';
    if (exchange.includes('google') || exchange.includes('gmail')) return 'Google Workspace';
    if (exchange.includes('mimecast')) return 'Mimecast';
    if (exchange.includes('proofpoint')) return 'Proofpoint';
    if (exchange.includes('barracuda')) return 'Barracuda';
    if (exchange.includes('cloudflare')) return 'Cloudflare';
    return 'Custom';
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'Microsoft 365':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Google Workspace':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Mimecast':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Proofpoint':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Barracuda':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Cloudflare':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* DNS Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Network className="h-5 w-5" />
            DNS Analysis Overview
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Exchange Online</p>
              <Badge variant={dnsInfo.hasExchangeOnline ? "default" : "secondary"}>
                {dnsInfo.hasExchangeOnline ? "Detected" : "Not Detected"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Office 365 SPF</p>
              <Badge variant={dnsInfo.hasOffice365SPF ? "default" : "secondary"}>
                {dnsInfo.hasOffice365SPF ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MX Records */}
      {dnsInfo.mxRecords && dnsInfo.mxRecords.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Mail Exchange (MX) Records
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dnsInfo.mxRecords.map((mx, index) => {
                const provider = getEmailProviderFromMX(mx);
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Priority: {mx.priority}</Badge>
                        <Badge className={getProviderColor(provider)}>
                          {provider}
                        </Badge>
                      </div>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {mx.exchange}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(mx.exchange)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TXT Records */}
      {dnsInfo.txtRecords && dnsInfo.txtRecords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                TXT Records ({dnsInfo.txtRecords.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {dnsInfo.txtRecords.map((record, index) => {
                // Remove quotes from the record
                const cleanRecord = record.replace(/^"(.*)"$/, '$1');
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <code className="flex-1 text-xs font-mono break-all pr-2">
                      {cleanRecord}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(cleanRecord)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DNSAnalysisDisplay;
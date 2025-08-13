import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Save, Copy, ExternalLink, Shield, Globe, Clock } from 'lucide-react';
import { toast } from 'sonner';

const TenantInfoDisplay = ({ data, onSave }) => {
  if (!data) return null;

  const getTenantTypeColor = (tenantType) => {
    switch (tenantType) {
      case 'AAD': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'B2C': 
      case 'AADB2C': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCloudStatusColor = (isCloudOnly) => {
    return isCloudOnly 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Basic Tenant Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tenant Information
            </h3>
            {onSave && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSave}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Lookup
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium font-mono">{data.domain}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Display Name</p>
              <p className="font-medium">{data.displayName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tenant ID</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {data.tenantId}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(data.tenantId)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Default Domain</p>
              <p className="font-medium font-mono">{data.defaultDomainName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tenant Type</p>
              <Badge className={getTenantTypeColor(data.tenantType)}>
                {data.tenantType || 'Unknown'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="outline">
                {data.tenantCategory || 'Unknown'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cloud Status</p>
              <Badge className={getCloudStatusColor(data.isCloudOnly)}>
                {data.isCloudOnly ? 'Cloud Only' : 'Hybrid'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Detection Method</p>
              <Badge variant="secondary">
                {data.method || 'Unknown'}
              </Badge>
            </div>
            {data.federationBrandName && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Federation Brand Name</p>
                <p className="font-medium">{data.federationBrandName}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Lookup Timestamp</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{formatTimestamp(data.timestamp)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Endpoints */}
      {data.authUrl && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Endpoints
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Authorization URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                    {data.authUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(data.authUrl)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={data.authUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
              {data.tokenUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">Token URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                      {data.tokenUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(data.tokenUrl)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TenantInfoDisplay;
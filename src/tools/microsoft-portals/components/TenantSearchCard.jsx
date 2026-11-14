import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Copy,
  AlertCircle,
  RefreshCw,
  History,
  X,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const TenantSearchCard = ({
  searchInput,
  setSearchInput,
  loading,
  error,
  tenantInfo,
  lookupHistory,
  onSearch,
  onClearHistory,
  onRemoveDomain
}) => {
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-title-sm">Tenant Lookup & Portal Access</CardTitle>
        <CardDescription>
          Enter a domain name or email address to find the tenant and generate portal links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Enter domain (e.g., contoso.com) or email address..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="text-data-md font-mono"
              />
            </div>
            <Button onClick={onSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin-ccw" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {/* Recent Searches */}
          {lookupHistory.length > 0 && (
            <div className="rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-body-sm font-medium">Recent Searches</Label>
                <Button variant="outline" size="sm" onClick={onClearHistory}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lookupHistory.slice(0, 5).map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-7 text-data-sm font-mono"
                    onClick={() => {
                      setSearchInput(item.domain);
                      onSearch(item.domain);
                    }}
                  >
                    <History className="h-3 w-3 mr-1" />
                    {item.domain}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDomain(item.domain);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tenant Info */}
          {tenantInfo && (
            <div className="border-t border-outline pt-4">
              <h3 className="text-label-caps uppercase text-on-surface-faint">Tenant</h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-body-sm font-medium">Domain</dt>
                  <dd className="mt-1 font-mono text-data-md text-on-surface-muted [overflow-wrap:anywhere]">{tenantInfo.domain}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-body-sm font-medium">Tenant ID</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 font-mono text-data-md text-on-surface-muted [overflow-wrap:anywhere]">
                      {tenantInfo.tenantId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      aria-label="Copy tenant ID"
                      onClick={() => copyToClipboard(tenantInfo.tenantId, 'Tenant ID')}
                    >
                      <Copy aria-hidden="true" />
                    </Button>
                  </dd>
                </div>
                {tenantInfo.displayName && (
                  <div className="min-w-0">
                    <dt className="text-body-sm font-medium">Display name</dt>
                    <dd className="mt-1 text-body-sm text-on-surface-muted">{tenantInfo.displayName}</dd>
                  </div>
                )}
                {tenantInfo.method && (
                  <div className="min-w-0">
                    <dt className="text-body-sm font-medium">Lookup method</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{tenantInfo.method}</Badge>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantSearchCard;
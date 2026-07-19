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
    <Card className="relative rounded-xl shadow-sm ring-1 ring-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-title-sm">Tenant Lookup & Portal Access</CardTitle>
        <CardDescription>
          Enter a domain name or email address to find the tenant and generate portal links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
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
            <div className="rounded-lg p-3 ring-1 ring-border/60">
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
            <Card className="rounded-xl shadow-sm ring-1 ring-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-title-sm">Tenant Information</CardTitle>
              </CardHeader>
              <CardContent>
                {/* One field per row. The two-column version put a 36-char
                    tenant GUID and its copy button into a ~140px track in
                    the control column, and both spilled past the card. */}
                <div className="grid gap-3">
                  <div className="grid gap-0.5">
                    <Label className="text-body-sm font-medium">Domain</Label>
                    <p className="truncate text-data-md font-mono text-muted-foreground">{tenantInfo.domain}</p>
                  </div>
                  <div className="grid gap-0.5">
                    <Label className="text-body-sm font-medium">Tenant ID</Label>
                    <div className="flex min-w-0 items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded bg-muted p-1 text-data-sm font-mono">
                        {tenantInfo.tenantId}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyToClipboard(tenantInfo.tenantId, 'Tenant ID')}
                        aria-label="Copy tenant ID"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {tenantInfo.displayName && (
                    <div className="grid gap-0.5">
                      <Label className="text-body-sm font-medium">Display Name</Label>
                      <p className="text-body-sm text-muted-foreground">{tenantInfo.displayName}</p>
                    </div>
                  )}
                  {tenantInfo.method && (
                    <div className="grid justify-items-start gap-0.5">
                      <Label className="text-body-sm font-medium">Lookup Method</Label>
                      <Badge variant="secondary" className="max-w-full truncate text-data-sm font-mono">
                        {tenantInfo.method}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantSearchCard;
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
    <Card>
      <CardHeader>
        <CardTitle>Tenant Lookup & Portal Access</CardTitle>
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
                className="text-sm"
              />
            </div>
            <Button onClick={onSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {/* Recent Searches */}
          {lookupHistory.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Recent Searches</Label>
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
                    className="h-7 text-xs"
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tenant Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Domain</Label>
                    <p className="text-sm text-muted-foreground">{tenantInfo.domain}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tenant ID</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-1 rounded">
                        {tenantInfo.tenantId}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(tenantInfo.tenantId, 'Tenant ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {tenantInfo.displayName && (
                    <div>
                      <Label className="text-sm font-medium">Display Name</Label>
                      <p className="text-sm text-muted-foreground">{tenantInfo.displayName}</p>
                    </div>
                  )}
                  {tenantInfo.method && (
                    <div>
                      <Label className="text-sm font-medium">Lookup Method</Label>
                      <Badge variant="secondary" className="text-xs">
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
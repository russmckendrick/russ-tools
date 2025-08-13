import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HeadersTab = ({ data }) => {
  const endpoint = data.endpoints?.[0];
  const httpTransaction = endpoint?.details?.httpTransactions?.[0];

  if (!httpTransaction) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No HTTP transaction data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Request Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">HTTP Request</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">URL</p>
              <p className="font-medium font-mono text-sm">{httpTransaction.requestUrl}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Request Line</p>
              <p className="font-medium font-mono text-sm">{httpTransaction.requestLine}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Request Headers</p>
              <div className="bg-muted p-3 rounded font-mono text-xs space-y-1">
                {httpTransaction.requestHeaders?.map((header, index) => (
                  <div key={index}>{header}</div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">HTTP Response</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status Code</p>
                <Badge variant={httpTransaction.statusCode === 200 ? "default" : "destructive"}>
                  {httpTransaction.statusCode}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Response Line</p>
                <p className="font-medium font-mono text-sm">{httpTransaction.responseLine}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Response Headers</p>
              <div className="bg-muted p-3 rounded font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                {httpTransaction.responseHeaders?.map((header, index) => (
                  <div key={index} className="break-all">
                    <span className="text-primary font-medium">{header.name}:</span> {header.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Headers Analysis */}
      {endpoint?.details && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Security Headers</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">HSTS</span>
                <Badge variant={endpoint.details.hstsPolicy?.status === 'present' ? "default" : "destructive"}>
                  {endpoint.details.hstsPolicy?.status === 'present' ? "Present" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">HPKP</span>
                <Badge variant={endpoint.details.hpkpPolicy?.status === 'present' ? "default" : "secondary"}>
                  {endpoint.details.hpkpPolicy?.status === 'present' ? "Present" : "Not Set"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeadersTab;
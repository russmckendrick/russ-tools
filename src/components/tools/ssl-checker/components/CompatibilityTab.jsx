import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CompatibilityTab = ({ data }) => {
  const endpoint = data.endpoints?.[0];
  const sims = endpoint?.details?.sims;

  if (!sims?.results) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No compatibility test results available</p>
        </CardContent>
      </Card>
    );
  }

  const successful = sims.results.filter(sim => sim.errorCode === 0);
  const failed = sims.results.filter(sim => sim.errorCode !== 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Compatibility Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{successful.length}</p>
              <p className="text-sm text-muted-foreground">Compatible</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{failed.length}</p>
              <p className="text-sm text-muted-foreground">Incompatible</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{sims.results.length}</p>
              <p className="text-sm text-muted-foreground">Total Tested</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Successful Connections */}
      {successful.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Compatible Clients ({successful.length})</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {successful.map((sim, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{sim.client.name} {sim.client.version}</p>
                    {sim.suiteName && (
                      <p className="text-xs text-muted-foreground">{sim.suiteName}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default">✓ Compatible</Badge>
                    {sim.protocolId && (
                      <Badge variant="outline">
                        TLS {sim.protocolId === 772 ? '1.3' : sim.protocolId === 771 ? '1.2' : '1.x'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Connections */}
      {failed.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Incompatible Clients ({failed.length})</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {failed.map((sim, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{sim.client.name} {sim.client.version}</p>
                    {sim.errorMessage && (
                      <p className="text-xs text-muted-foreground">{sim.errorMessage}</p>
                    )}
                  </div>
                  <Badge variant="destructive">✗ Incompatible</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompatibilityTab;
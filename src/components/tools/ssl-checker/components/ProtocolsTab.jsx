import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ProtocolsTab = ({ data }) => {
  const endpoint = data.endpoints?.[0];
  const details = endpoint?.details;

  if (!details) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No protocol details available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Supported Protocols */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Supported Protocols</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {details.protocols?.map((protocol, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                {protocol.name} {protocol.version}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cipher Suites */}
      {details.suites?.list && details.suites.list.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Cipher Suites ({details.suites.list.length})</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {details.suites.list.slice(0, 20).map((suite, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                  <span className="font-mono">{suite.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">{suite.kxType}</Badge>
                    <Badge variant="outline">{suite.kxStrength} bits</Badge>
                  </div>
                </div>
              ))}
              {details.suites.list.length > 20 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {details.suites.list.length - 20} more cipher suites
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Named Groups */}
      {details.namedGroups?.list && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Named Groups</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {details.namedGroups.list.map((group, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{group.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">{group.bits} bits</Badge>
                    <Badge variant="outline">{group.namedGroupType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProtocolsTab;
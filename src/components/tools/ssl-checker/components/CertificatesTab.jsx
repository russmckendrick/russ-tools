import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from '../utils/sslUtils';

const CertificatesTab = ({ data }) => {
  const endpoint = data.endpoints?.[0];
  const certs = data.certs || [];

  return (
    <div className="space-y-4">
      {/* Certificate Chains */}
      {endpoint?.details?.certChains && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Certificate Chains</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoint.details.certChains.map((chain, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Chain {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Issues</p>
                      <Badge variant={chain.issues === 0 ? "default" : "destructive"}>
                        {chain.issues === 0 ? "No Issues" : `${chain.issues} Issues`}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">SNI Required</p>
                      <Badge variant={chain.noSni ? "destructive" : "default"}>
                        {chain.noSni ? "SNI Required" : "SNI Optional"}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Trust Paths */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Trust Stores</p>
                    <div className="flex gap-2 flex-wrap">
                      {chain.trustPaths?.slice(0, 5).map((path, pathIndex) => {
                        const trust = path.trust?.[0];
                        return (
                          <Badge key={pathIndex} variant={trust?.isTrusted ? "default" : "destructive"}>
                            {trust?.rootStore} {trust?.isTrusted ? "✓" : "✗"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Details */}
      {certs.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Certificate Details</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certs.map((cert, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-medium font-mono text-sm">{cert.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issuer</p>
                      <p className="font-medium font-mono text-sm">{cert.issuerSubject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid From</p>
                      <p className="font-medium">{formatDate(cert.notBefore)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid Until</p>
                      <p className="font-medium">{formatDate(cert.notAfter)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Key Algorithm</p>
                      <p className="font-medium">{cert.keyAlg || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Key Size</p>
                      <p className="font-medium">{cert.keySize ? `${cert.keySize} bits` : 'Unknown'}</p>
                    </div>
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

export default CertificatesTab;
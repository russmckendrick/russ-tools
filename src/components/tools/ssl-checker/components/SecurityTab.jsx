import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SecurityTab = ({ data }) => {
  const endpoint = data.endpoints?.[0];
  const details = endpoint?.details;

  if (!details) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No security details available</p>
        </CardContent>
      </Card>
    );
  }

  const vulnerabilities = [
    { name: 'Heartbleed', status: details.heartbleed, critical: true },
    { name: 'POODLE', status: details.poodle, critical: true },
    { name: 'BEAST', status: details.vulnBeast, critical: false },
    { name: 'FREAK', status: details.freak, critical: true },
    { name: 'Logjam', status: details.logjam, critical: true },
    { name: 'RC4 Support', status: details.supportsRc4, critical: false },
    { name: 'Ticketbleed', status: details.ticketbleed === 2, critical: false },
  ];

  const securityFeatures = [
    { name: 'Forward Secrecy', status: details.forwardSecrecy >= 2, level: details.forwardSecrecy },
    { name: 'OCSP Stapling', status: details.ocspStapling, level: null },
    { name: 'Session Tickets', status: details.sessionTickets === 1, level: null },
    { name: 'AEAD Support', status: details.supportsAead, level: null },
    { name: 'TLS 1.3 Ready', status: details.implementsTLS13MandatoryCS, level: null },
    { name: 'SNI Required', status: details.sniRequired, level: null },
  ];

  return (
    <div className="space-y-4">
      {/* Vulnerabilities */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Vulnerability Assessment</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vulnerabilities.map((vuln, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{vuln.name}</span>
                <Badge variant={vuln.status ? "destructive" : "default"}>
                  {vuln.status ? "Vulnerable" : "Safe"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Security Features</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{feature.name}</span>
                <div className="flex items-center gap-2">
                  {feature.level !== null && (
                    <span className="text-sm text-muted-foreground">Level {feature.level}</span>
                  )}
                  <Badge variant={feature.status ? "default" : "secondary"}>
                    {feature.status ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HSTS Policy */}
      {details.hstsPolicy && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">HSTS Policy</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={details.hstsPolicy.status === 'present' ? "default" : "secondary"}>
                  {details.hstsPolicy.status}
                </Badge>
              </div>
              {details.hstsPolicy.maxAge && (
                <div>
                  <p className="text-sm text-muted-foreground">Max Age</p>
                  <p className="font-medium">{Math.round(details.hstsPolicy.maxAge / 86400)} days</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityTab;
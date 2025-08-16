import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { 
  Shield, 
  Calendar, 
  Building, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowDown,
  Lock
} from 'lucide-react';

const ChainOverview = ({ analysis }) => {
  if (!analysis || !analysis.certificates) {
    return null;
  }

  const { certificates, chain } = analysis;
  const leafCert = certificates.find(cert => cert.type === 'leaf');
  const rootCert = certificates.find(cert => cert.type === 'root');
  
  const getStatusIcon = (isValid) => {
    if (isValid) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'red' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', days: daysUntilExpiry, color: 'yellow' };
    } else {
      return { status: 'valid', days: daysUntilExpiry, color: 'green' };
    }
  };

  const leafExpiry = leafCert ? getExpiryStatus(leafCert.details.validTo) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Certificate Chain Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 py-6">
            {certificates
              .sort((a, b) => {
                const order = { root: 0, intermediate: 1, leaf: 2 };
                return order[a.type] - order[b.type];
              })
              .map((cert, index) => (
                <React.Fragment key={cert.id}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      p-4 rounded-lg border-2 min-w-[200px] text-center
                      ${cert.type === 'root' ? 'border-green-500 bg-green-50' : ''}
                      ${cert.type === 'intermediate' ? 'border-blue-500 bg-blue-50' : ''}
                      ${cert.type === 'leaf' ? 'border-purple-500 bg-purple-50' : ''}
                    `}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Lock className="w-4 h-4" />
                        <span className="font-medium capitalize">{cert.type} Certificate</span>
                      </div>
                      <p className="text-sm font-medium">{cert.details.subject.CN}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Issuer: {cert.details.issuer.CN}
                      </p>
                      <div className="flex justify-center mt-2">
                        {cert.issues?.length > 0 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  {index < certificates.length - 1 && (
                    <ArrowDown className="w-6 h-6 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              {getStatusIcon(chain?.isValid)}
              <span className="font-medium">
                Chain Status: {chain?.isValid ? 'Valid and Trusted' : 'Invalid or Untrusted'}
              </span>
            </div>
            
            {leafExpiry && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {leafExpiry.status === 'expired' 
                    ? `Certificate expired ${leafExpiry.days} days ago`
                    : leafExpiry.status === 'expiring'
                    ? `Certificate expires in ${leafExpiry.days} days`
                    : `Certificate expires in ${leafExpiry.days} days`
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-medium mb-1">Security Status</h3>
            <p className="text-sm text-gray-600">
              {chain?.isValid ? 'Secure Connection' : 'Security Issues Found'}
            </p>
            <Badge variant={chain?.isValid ? 'default' : 'destructive'} className="mt-2">
              {leafCert?.details.keyInfo?.algorithm || 'Unknown Algorithm'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className={`w-8 h-8 ${
                leafExpiry?.color === 'green' ? 'text-green-600' :
                leafExpiry?.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <h3 className="font-medium mb-1">Expiration</h3>
            <p className="text-sm text-gray-600">
              {leafExpiry ? `${leafExpiry.days} days` : 'Unknown'}
            </p>
            <Badge variant={
              leafExpiry?.color === 'green' ? 'default' :
              leafExpiry?.color === 'yellow' ? 'secondary' : 'destructive'
            } className="mt-2">
              {leafExpiry?.status === 'expired' ? 'Expired' :
               leafExpiry?.status === 'expiring' ? 'Expiring Soon' : 'Valid'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-medium mb-1">Certificate Authority</h3>
            <p className="text-sm text-gray-600">
              {rootCert?.details.subject.CN || 'Unknown CA'}
            </p>
            <Badge variant="outline" className="mt-2">
              Trusted Root
            </Badge>
          </CardContent>
        </Card>
      </div>

      {chain?.issues && chain.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Chain Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chain.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-red-50">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">{issue.severity}</p>
                    <p className="text-sm text-red-700">{issue.description}</p>
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

export default ChainOverview;
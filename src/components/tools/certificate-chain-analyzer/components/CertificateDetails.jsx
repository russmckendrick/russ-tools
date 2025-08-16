import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  FileText, 
  Shield, 
  Calendar,
  Key,
  Fingerprint,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

const CertificateDetails = ({ certificates }) => {
  const [expandedCerts, setExpandedCerts] = useState(new Set());

  const toggleExpanded = (certId) => {
    setExpandedCerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(certId)) {
        newSet.delete(certId);
      } else {
        newSet.add(certId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(date));
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'root': return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'leaf': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!certificates || certificates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No certificate details available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Certificate Details ({certificates.length} certificates found)</h2>
      </div>

      {certificates.map((cert) => {
        const isExpanded = expandedCerts.has(cert.id);
        const { details } = cert;

        return (
          <Card key={cert.id} className="overflow-hidden">
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(cert.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? 
                        <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      }
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${getTypeColor(cert.type)}`}
                          >
                            {cert.type} Certificate
                          </Badge>
                          {cert.issues && cert.issues.length > 0 && (
                            <Badge variant="destructive">
                              {cert.issues.length} issue{cert.issues.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">
                          {details.subject.CN || 'Unknown Subject'}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Issued by: {details.issuer.CN || 'Unknown Issuer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Valid: {formatDate(details.validity.notBefore)}</p>
                      <p>Until: {formatDate(details.validity.notAfter)}</p>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Subject Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Subject Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Common Name (CN)</label>
                        <p className="text-gray-900">{details.subject.CN || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Organization (O)</label>
                        <p className="text-gray-900">{details.subject.O || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Organizational Unit (OU)</label>
                        <p className="text-gray-900">{details.subject.OU || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Country (C)</label>
                        <p className="text-gray-900">{details.subject.C || 'Not specified'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-medium text-gray-700">Full Distinguished Name</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded flex-1">
                            {details.subject.raw || 'Not available'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(details.subject.raw, 'Subject DN')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issuer Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Issuer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Common Name (CN)</label>
                        <p className="text-gray-900">{details.issuer.CN || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Organization (O)</label>
                        <p className="text-gray-900">{details.issuer.O || 'Not specified'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-medium text-gray-700">Full Distinguished Name</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded flex-1">
                            {details.issuer.raw || 'Not available'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(details.issuer.raw, 'Issuer DN')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validity Period */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Validity Period
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Valid From</label>
                        <p className="text-gray-900">{formatDate(details.validity.notBefore)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Valid Until</label>
                        <p className="text-gray-900">{formatDate(details.validity.notAfter)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Serial Number</label>
                        <p className="text-gray-900 font-mono text-xs">{details.serialNumber}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Version</label>
                        <p className="text-gray-900">v{details.version}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Public Key Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Algorithm</label>
                        <p className="text-gray-900">{details.keyInfo.algorithm}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Key Size</label>
                        <p className="text-gray-900">{details.keyInfo.keySize} bits</p>
                      </div>
                    </div>
                  </div>

                  {/* Extensions */}
                  {details.extensions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Extensions</h4>
                      <div className="space-y-3 text-sm">
                        {details.extensions.subjectAltName && details.extensions.subjectAltName.length > 0 && (
                          <div>
                            <label className="font-medium text-gray-700">Subject Alternative Names</label>
                            <div className="mt-1 space-y-1">
                              {details.extensions.subjectAltName.map((san, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {san.type}
                                  </Badge>
                                  <span className="text-gray-900">{san.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.extensions.keyUsage && details.extensions.keyUsage.length > 0 && (
                          <div>
                            <label className="font-medium text-gray-700">Key Usage</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {details.extensions.keyUsage.map((usage, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {usage}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.extensions.extendedKeyUsage && details.extensions.extendedKeyUsage.length > 0 && (
                          <div>
                            <label className="font-medium text-gray-700">Extended Key Usage</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {details.extensions.extendedKeyUsage.map((usage, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {usage}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.extensions.basicConstraints && (
                          <div>
                            <label className="font-medium text-gray-700">Basic Constraints</label>
                            <div className="mt-1">
                              <span className="text-gray-900">
                                CA: {details.extensions.basicConstraints.isCA ? 'Yes' : 'No'}
                                {details.extensions.basicConstraints.pathLenConstraint !== null && 
                                  `, Path Length: ${details.extensions.basicConstraints.pathLenConstraint}`
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fingerprints */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" />
                      Certificate Fingerprints
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">SHA-256</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded flex-1">
                            {cert.fingerprints.sha256 || 'Not available'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(cert.fingerprints.sha256, 'SHA-256 fingerprint')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">SHA-1</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded flex-1">
                            {cert.fingerprints.sha1 || 'Not available'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(cert.fingerprints.sha1, 'SHA-1 fingerprint')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  {cert.issues && cert.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-3">Certificate Issues</h4>
                      <div className="space-y-2">
                        {cert.issues.map((issue, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                            <div className="flex items-start gap-2">
                              <Badge 
                                variant="destructive" 
                                className="text-xs"
                              >
                                {issue.severity}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">{issue.type}</p>
                                <p className="text-sm text-red-700 mt-1">{issue.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

export default CertificateDetails;
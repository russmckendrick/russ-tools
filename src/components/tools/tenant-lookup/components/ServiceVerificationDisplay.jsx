import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const ServiceVerificationDisplay = ({ txtRecords }) => {
  if (!txtRecords || txtRecords.length === 0) return null;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const parseServiceVerifications = (records) => {
    const services = [];
    
    records.forEach((record, index) => {
      const cleanRecord = record.replace(/^"(.*)"$/, '$1');
      
      // Google Site Verification
      if (cleanRecord.includes('google-site-verification=')) {
        const token = cleanRecord.match(/google-site-verification=([^"]*)/)?.[1];
        services.push({
          id: `google-${index}`,
          service: 'Google',
          type: 'Site Verification',
          token: token,
          record: cleanRecord,
          icon: '🔍',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        });
      }
      
      // Microsoft Verification
      else if (cleanRecord.includes('MS=')) {
        const token = cleanRecord.match(/MS=([^"]*)/)?.[1];
        services.push({
          id: `microsoft-${index}`,
          service: 'Microsoft',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '🏢',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        });
      }
      
      // Apple Domain Verification
      else if (cleanRecord.includes('apple-domain-verification=')) {
        const token = cleanRecord.match(/apple-domain-verification=([^"]*)/)?.[1];
        services.push({
          id: `apple-${index}`,
          service: 'Apple',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '🍎',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        });
      }
      
      // Facebook Domain Verification
      else if (cleanRecord.includes('facebook-domain-verification=')) {
        const token = cleanRecord.match(/facebook-domain-verification=([^"]*)/)?.[1];
        services.push({
          id: `facebook-${index}`,
          service: 'Facebook',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '📘',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        });
      }
      
      // Atlassian Domain Verification
      else if (cleanRecord.includes('atlassian-domain-verification=')) {
        const token = cleanRecord.match(/atlassian-domain-verification=([^"]*)/)?.[1];
        services.push({
          id: `atlassian-${index}`,
          service: 'Atlassian',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '🔷',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        });
      }
      
      // DocuSign Verification
      else if (cleanRecord.includes('docusign=')) {
        const token = cleanRecord.match(/docusign=([^"]*)/)?.[1];
        services.push({
          id: `docusign-${index}`,
          service: 'DocuSign',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '📝',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        });
      }
      
      // 1Password Verification
      else if (cleanRecord.includes('1password-site-verification=')) {
        const token = cleanRecord.match(/1password-site-verification=([^"]*)/)?.[1];
        services.push({
          id: `1password-${index}`,
          service: '1Password',
          type: 'Site Verification',
          token: token,
          record: cleanRecord,
          icon: '🔐',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        });
      }
      
      // Cursor Domain Verification
      else if (cleanRecord.includes('cursor-domain-verification')) {
        const token = cleanRecord.match(/cursor-domain-verification[^=]*=([^"]*)/)?.[1];
        services.push({
          id: `cursor-${index}`,
          service: 'Cursor',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '📝',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        });
      }
      
      // SPF Records
      else if (cleanRecord.includes('v=spf1')) {
        services.push({
          id: `spf-${index}`,
          service: 'SPF',
          type: 'Email Security',
          token: cleanRecord,
          record: cleanRecord,
          icon: '📧',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        });
      }
      
      // Access Domain Verification
      else if (cleanRecord.includes('access-domain-verification=')) {
        const token = cleanRecord.match(/access-domain-verification=([^"]*)/)?.[1];
        services.push({
          id: `access-${index}`,
          service: 'Cloudflare Access',
          type: 'Domain Verification',
          token: token,
          record: cleanRecord,
          icon: '🛡️',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        });
      }
      
      // Generic hash-like records (potential security tokens)
      else if (/^[a-f0-9]{32,}$/.test(cleanRecord)) {
        services.push({
          id: `hash-${index}`,
          service: 'Unknown',
          type: 'Security Token',
          token: cleanRecord.substring(0, 32) + (cleanRecord.length > 32 ? '...' : ''),
          record: cleanRecord,
          icon: '🔐',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        });
      }
    });
    
    return services;
  };

  const verifications = parseServiceVerifications(txtRecords);

  if (verifications.length === 0) return null;

  const groupedServices = verifications.reduce((acc, service) => {
    const key = service.service;
    if (!acc[key]) acc[key] = [];
    acc[key].push(service);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Service Verifications ({verifications.length})
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedServices).map(([serviceName, serviceRecords]) => (
            <div key={serviceName} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{serviceRecords[0].icon}</span>
                <h4 className="font-medium">{serviceName}</h4>
                <Badge className={serviceRecords[0].color}>
                  {serviceRecords.length} record{serviceRecords.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {serviceRecords.map((service) => (
                  <div key={service.id} className="bg-muted/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{service.type}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(service.record)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="text-xs font-mono break-all block">
                      {service.token}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceVerificationDisplay;
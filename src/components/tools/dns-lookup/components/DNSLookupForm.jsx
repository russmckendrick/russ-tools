import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Search, RotateCcw } from 'lucide-react';

const DNS_RECORD_TYPES = [
  { value: 'A', label: 'A Record (IPv4)' },
  { value: 'AAAA', label: 'AAAA Record (IPv6)' },
  { value: 'MX', label: 'MX Record (Mail Exchange)' },
  { value: 'TXT', label: 'TXT Record (Text)' },
  { value: 'CNAME', label: 'CNAME Record (Alias)' },
  { value: 'NS', label: 'NS Record (Name Server)' },
  { value: 'SOA', label: 'SOA Record (Start of Authority)' },
  { value: 'PTR', label: 'PTR Record (Reverse DNS)' },
  { value: 'SRV', label: 'SRV Record (Service)' },
  { value: 'CAA', label: 'CAA Record (Certificate Authority)' }
];

const DNS_PROVIDERS = [
  { value: 'google', label: 'Google DNS (8.8.8.8)', server: '8.8.8.8' },
  { value: 'cloudflare', label: 'Cloudflare DNS (1.1.1.1)', server: '1.1.1.1' },
  { value: 'opendns', label: 'OpenDNS (208.67.222.222)', server: '208.67.222.222' },
  { value: 'auto', label: 'Browser Default', server: 'auto' }
];

const DNSLookupForm = ({
  domain,
  setDomain,
  recordType,
  setRecordType,
  dnsProvider,
  setDnsProvider,
  loading,
  onLookup,
  onKeyPress
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="domain">Domain Name</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="domain"
                placeholder="example.com or mail.example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyPress={onKeyPress}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="record-type">Record Type</Label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DNS_RECORD_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dns-provider">DNS Provider</Label>
            <Select value={dnsProvider} onValueChange={setDnsProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DNS_PROVIDERS.map(provider => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={onLookup}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Lookup DNS
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter a domain name (e.g., example.com) to perform DNS lookups
        </p>
      </CardContent>
    </Card>
  );
};

export default DNSLookupForm;
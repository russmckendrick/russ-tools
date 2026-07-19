import React from 'react';
import { HelpDialog } from '../../../ui/help-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { 
  Search, 
  Building, 
  Shield, 
  Globe,
  Database,
  Zap,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';

const HelpSystemShadcn = ({ opened, onClose }) => {
  return (
    <HelpDialog
      open={opened}
      onOpenChange={onClose}
      title="Microsoft Tenant Lookup Help"
      description="What this tool asks, and what it can tell you"
    >
      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-body-sm text-muted-foreground">
                Discover Microsoft 365 and Azure AD tenant information from domain names or email addresses using publicly available metadata endpoints.
              </p>
              <div className="grid gap-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">1</Badge>
                  <span className="text-body-sm">Enter a domain name (contoso.com) or email address (user@contoso.com)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">2</Badge>
                  <span className="text-body-sm">Click "Lookup Tenant" or press Enter</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">3</Badge>
                  <span className="text-body-sm">Review tenant information, authentication endpoints, and DNS data</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">4</Badge>
                  <span className="text-body-sm">Save lookups for future reference or export data</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                What You'll Discover
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary">
                    <Building className="w-3 h-3 mr-1" />
                    Organization
                  </Badge>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium">Tenant Information</p>
                    <p className="text-body-sm text-muted-foreground">Display name, tenant ID, domain, and tenant type</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="bg-success-subtle text-success">
                    <Shield className="w-3 h-3 mr-1" />
                    Authentication
                  </Badge>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium">Authorization Endpoints</p>
                    <p className="text-body-sm text-muted-foreground">OAuth URLs, token endpoints, and federation settings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]">
                    <Globe className="w-3 h-3 mr-1" />
                    DNS Analysis
                  </Badge>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium">Microsoft Services</p>
                    <p className="text-body-sm text-muted-foreground">Exchange Online detection, SPF records, MX records</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Supported Tenant Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">AAD</Badge>
                  <span className="text-body-sm text-muted-foreground">Azure Active Directory - Enterprise tenants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success-subtle text-success">B2C</Badge>
                  <span className="text-body-sm text-muted-foreground">Azure AD B2C - Consumer identity management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Hybrid</Badge>
                  <span className="text-body-sm text-muted-foreground">Hybrid deployment with on-premises federation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-surface-inset text-on-surface">Cloud-Only</Badge>
                  <span className="text-body-sm text-muted-foreground">Pure cloud tenant without on-premises</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-body-sm"><strong>URL Parameters:</strong> Direct link to specific tenant lookup (/tenant-lookup/domain.com)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-body-sm"><strong>Save & Load:</strong> Save frequent lookups and load them later</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-body-sm"><strong>JSON Export:</strong> Copy complete tenant data in machine-readable format</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-body-sm"><strong>Cross-Tool Integration:</strong> Links to Microsoft Portals tool for GDAP access</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Use Cases & Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div>
                  <p className="text-body-sm font-medium text-info">🏢 IT Administration</p>
                  <p className="text-body-sm text-muted-foreground">Validate customer tenants, analyze organizational structure, audit Microsoft services</p>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-success">🤝 CSP Partners</p>
                  <p className="text-body-sm text-muted-foreground">Customer onboarding, tenant identification, service validation for partner workflows</p>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--cat)]">🔒 Security Research</p>
                  <p className="text-body-sm text-muted-foreground">Threat intelligence, domain-to-tenant mapping, federation analysis</p>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-warning">📋 Compliance</p>
                  <p className="text-body-sm text-muted-foreground">Organizational data gathering, audit trails, service discovery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                  <span className="text-body-sm">Uses only publicly available Microsoft metadata endpoints</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                  <span className="text-body-sm">No personal data collection or persistent storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                  <span className="text-body-sm">All communications secured with HTTPS and proper authentication</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <span className="text-body-sm">Results depend on Microsoft API availability and tenant configuration</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-body-sm font-medium">Common Issues & Solutions</p>
                  <div className="mt-2 space-y-2">
                    <div className="text-body-sm">
                      <p className="font-medium text-danger">Tenant Not Found</p>
                      <p className="text-muted-foreground">Domain may not have Microsoft services. Verify spelling and try alternative formats.</p>
                    </div>
                    <div className="text-body-sm">
                      <p className="font-medium text-warning">API Timeout</p>
                      <p className="text-muted-foreground">Microsoft APIs experiencing high load. Check connectivity and retry after a few minutes.</p>
                    </div>
                    <div className="text-body-sm">
                      <p className="font-medium text-info">Network Errors</p>
                      <p className="text-muted-foreground">Browser blocking requests or network restrictions. Check browser console for details.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span>Powered by Microsoft Graph API, GetUserRealm, and DNS over HTTPS</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="https://docs.microsoft.com/en-us/graph/api/tenantrelationship-findtenantinformationbydomainname"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                API Docs
              </a>
            </Button>
          </div>
      </div>
    </HelpDialog>
  );
};

export default HelpSystemShadcn;
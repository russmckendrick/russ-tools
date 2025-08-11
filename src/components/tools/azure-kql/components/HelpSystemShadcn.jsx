import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { HelpCircle, Code, Database, Filter } from 'lucide-react';

const HelpSystemShadcn = ({ opened, onClose, currentContext }) => {
  return (
    <Dialog open={opened} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Azure KQL Query Builder Help
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="w-5 h-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This tool helps you build KQL (Kusto Query Language) queries for various Azure services.
              </p>
              <div className="grid gap-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">1</Badge>
                  <span className="text-sm">Select an Azure service from the dropdown</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">2</Badge>
                  <span className="text-sm">Choose a query template</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">3</Badge>
                  <span className="text-sm">Fill in the required parameters</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">4</Badge>
                  <span className="text-sm">Click Generate to create your KQL query</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Supported Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Azure Firewall</Badge>
                  <span className="text-sm text-muted-foreground">Network security and traffic analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Application Gateway</Badge>
                  <span className="text-sm text-muted-foreground">Web application firewall logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Virtual Desktop</Badge>
                  <span className="text-sm text-muted-foreground">Session and connection monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5" />
                Query Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The tool automatically optimizes queries for better performance:
              </p>
              <div className="grid gap-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-sm">Filters are ordered by selectivity</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-sm">Time ranges are applied early</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">•</Badge>
                  <span className="text-sm">Projections minimize data transfer</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpSystemShadcn;
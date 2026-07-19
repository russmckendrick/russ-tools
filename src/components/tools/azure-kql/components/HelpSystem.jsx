import React from 'react';
import { HelpDialog } from '../../../ui/help-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { 
  BookOpen, 
  Code2, 
  Zap,
  Shield,
  Database
} from 'lucide-react';

const HelpSystem = ({ open, onClose, context: _context }) => {
  return (
    <HelpDialog
      open={open}
      onOpenChange={onClose}
      title="Azure KQL Query Builder Help"
      description="Learn how to use the query builder effectively"
    >
      
        <Tabs defaultValue="quickstart" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="syntax">KQL Syntax</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="tips">Best Practices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quickstart" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Getting Started
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-body-sm">
                  <li>Select an Azure service from the service selector</li>
                  <li>Choose a query template that matches your use case</li>
                  <li>Fill in the required parameters (marked with *)</li>
                  <li>Optionally configure advanced parameters</li>
                  <li>Click "Generate Query" to create your KQL query</li>
                  <li>Use export options to copy, download, or open in Azure Portal</li>
                </ol>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold">Keyboard Shortcuts</h3>
                <div className="space-y-1 text-body-sm">
                  <div className="flex justify-between">
                    <span>Generate Query</span>
                    <Badge variant="secondary">Ctrl + Enter</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Copy Query</span>
                    <Badge variant="secondary">Ctrl + C</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle Help</span>
                    <Badge variant="secondary">?</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="syntax" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Common KQL Operators
                </h3>
                <div className="space-y-2 text-data-md font-mono">
                  <div className="p-2 bg-muted rounded">
                    <strong>where</strong> - Filter rows based on conditions
                    <div className="text-data-sm mt-1 text-muted-foreground">
                      Example: | where TimeGenerated {'>'} ago(1h)
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>project</strong> - Select specific columns
                    <div className="text-data-sm mt-1 text-muted-foreground">
                      Example: | project TimeGenerated, Action, SourceIp
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>summarize</strong> - Aggregate data
                    <div className="text-data-sm mt-1 text-muted-foreground">
                      Example: | summarize count() by Action
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>order by</strong> - Sort results
                    <div className="text-data-sm mt-1 text-muted-foreground">
                      Example: | order by TimeGenerated desc
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>limit</strong> - Limit number of results
                    <div className="text-data-sm mt-1 text-muted-foreground">
                      Example: | limit 100
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="examples" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Example Queries
                </h3>
                
                <div className="space-y-3">
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-body-sm font-semibold">Find Denied Connections</strong>
                      <Badge>Security</Badge>
                    </div>
                    <pre className="text-data-sm font-mono bg-muted p-2 rounded overflow-x-auto">
{`AZFWNetworkRule
| where TimeGenerated >= ago(24h)
| where Action == "Deny"
| project TimeGenerated, SourceIp, DestinationIp, DestinationPort
| order by TimeGenerated desc`}
                    </pre>
                  </div>
                  
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-body-sm font-semibold">Top Source IPs</strong>
                      <Badge>Traffic Analysis</Badge>
                    </div>
                    <pre className="text-data-sm font-mono bg-muted p-2 rounded overflow-x-auto">
{`AZFWNetworkRule
| where TimeGenerated >= ago(7d)
| summarize RequestCount = count() by SourceIp
| order by RequestCount desc
| limit 10`}
                    </pre>
                  </div>
                  
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-body-sm font-semibold">AVD User Sessions</strong>
                      <Badge>Virtual Desktop</Badge>
                    </div>
                    <pre className="text-data-sm font-mono bg-muted p-2 rounded overflow-x-auto">
{`WVDConnections
| where TimeGenerated > ago(30d)
| where State == "Connected"
| summarize SessionCount = count() by UserName
| order by SessionCount desc`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Performance Best Practices
                </h3>
                <ul className="list-disc list-inside space-y-2 text-body-sm">
                  <li>Always filter by TimeGenerated first for best performance</li>
                  <li>Use specific values instead of wildcards when possible</li>
                  <li>Limit results to prevent overwhelming data returns</li>
                  <li>Order filters from most to least selective</li>
                  <li>Use summarize for aggregations instead of fetching all data</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Considerations
                </h3>
                <ul className="list-disc list-inside space-y-2 text-body-sm">
                  <li>Never include sensitive data in shared URLs</li>
                  <li>Validate IP addresses and CIDR ranges</li>
                  <li>Use appropriate time ranges to avoid excessive data exposure</li>
                  <li>Be cautious with wildcard patterns in production queries</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </HelpDialog>
  );
};

export default HelpSystem;
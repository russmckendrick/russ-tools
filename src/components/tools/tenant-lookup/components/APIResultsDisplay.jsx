import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Copy, Database, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const APIResultsDisplay = ({ apiResults }) => {
  const [expandedApi, setExpandedApi] = useState(null);

  if (!apiResults) return null;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getApiStatusColor = (hasData) => {
    return hasData 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getApiDescription = (apiName) => {
    const descriptions = {
      'Microsoft Graph API': 'Primary Microsoft Graph API for tenant information',
      'GetUserRealm API': 'Microsoft endpoint for user realm and federation details',
      'GetCredentialType API': 'Microsoft endpoint for credential type and user existence',
      'User Realm Details': 'Detailed user realm and federation information',
      'DNS Analysis': 'DNS record analysis for email and security configurations'
    };
    
    return descriptions[apiName] || 'Microsoft API endpoint';
  };

  const hasValidData = (data) => {
    if (!data || typeof data !== 'object') return false;
    
    // Check if it has meaningful data (not just null values)
    const values = Object.values(data).filter(val => val !== null && val !== undefined && val !== '');
    return values.length > 0;
  };

  const formatApiData = (data) => {
    if (!data) return {};
    
    // Remove null/undefined values and format the data nicely
    const formatted = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formatted[key] = value;
      }
    });
    
    return formatted;
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          API Results Breakdown
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(apiResults).map(([apiName, apiData]) => {
            const hasData = hasValidData(apiData);
            const formattedData = formatApiData(apiData);
            const isExpanded = expandedApi === apiName;
            
            return (
              <div key={apiName} className="border rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedApi(isExpanded ? null : apiName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasData ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <h4 className="font-medium">{apiName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getApiDescription(apiName)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getApiStatusColor(hasData)}>
                        {hasData ? 'Data Available' : 'No Data'}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-muted/20">
                    {hasData ? (
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(formattedData).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <div className="flex items-center gap-2">
                                {typeof value === 'boolean' ? (
                                  <Badge variant={value ? "default" : "secondary"}>
                                    {value ? "Yes" : "No"}
                                  </Badge>
                                ) : Array.isArray(value) ? (
                                  <div className="flex flex-wrap gap-1">
                                    {value.map((item, idx) => (
                                      <Badge key={idx} variant="outline">
                                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <code className="text-sm bg-background px-2 py-1 rounded font-mono">
                                    {String(value)}
                                  </code>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-3 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Raw JSON Response</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(JSON.stringify(formattedData, null, 2))}
                            >
                              <Copy className="mr-2 h-3 w-3" />
                              Copy JSON
                            </Button>
                          </div>
                          <Textarea
                            value={JSON.stringify(formattedData, null, 2)}
                            readOnly
                            rows={6}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No data returned from this API endpoint</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default APIResultsDisplay;
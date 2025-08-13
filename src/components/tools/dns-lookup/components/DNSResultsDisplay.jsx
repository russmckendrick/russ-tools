import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Globe, Copy, Download, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import DNSRecordDisplay from './DNSRecordDisplay';

const DNSResultsDisplay = ({ results, domain, recordType }) => {
  if (!results) return null;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dns-lookup-${domain}-${recordType}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('DNS results exported');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      'A': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'AAAA': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'MX': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'TXT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'CNAME': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'NS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'SOA': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'PTR': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'SRV': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'CAA': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const hasRecords = results.Answer && results.Answer.length > 0;
  const hasAuthority = results.Authority && results.Authority.length > 0;
  const hasAdditional = results.Additional && results.Additional.length > 0;

  return (
    <Tabs defaultValue="results" className="space-y-4">
      <TabsList>
        <TabsTrigger value="results">
          Results {hasRecords && `(${results.Answer.length})`}
        </TabsTrigger>
        <TabsTrigger value="details">Query Details</TabsTrigger>
        <TabsTrigger value="raw">Raw Response</TabsTrigger>
      </TabsList>

      <TabsContent value="results">
        <div className="space-y-4">
          {/* Query Summary */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">DNS Query Results</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRecordTypeColor(recordType)}>
                    {recordType} Record
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportResults}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Domain</p>
                  <p className="font-medium font-mono">{domain}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Record Type</p>
                  <p className="font-medium">{recordType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={results.Status === 0 ? "default" : "destructive"}>
                    {results.Status === 0 ? "Success" : "Error"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answer Records */}
          {hasRecords && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Answer Records ({results.Answer.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.Answer.map((record, index) => (
                    <DNSRecordDisplay key={index} record={record} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authority Records */}
          {hasAuthority && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Authority Records ({results.Authority.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.Authority.map((record, index) => (
                    <DNSRecordDisplay key={index} record={record} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Records */}
          {hasAdditional && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Additional Records ({results.Additional.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.Additional.map((record, index) => (
                    <DNSRecordDisplay key={index} record={record} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Records Found */}
          {!hasRecords && !hasAuthority && !hasAdditional && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
                  <p className="text-muted-foreground">
                    No {recordType} records were found for {domain}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="details">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Query Details
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Query Time</p>
                <p className="font-medium">{formatTimestamp(results.timestamp || Date.now())}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Response Code</p>
                <Badge variant={results.Status === 0 ? "default" : "destructive"}>
                  {results.Status === 0 ? "NOERROR" : `Error ${results.Status}`}
                </Badge>
              </div>
              {results.Question && results.Question.length > 0 && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Query Name</p>
                    <p className="font-medium font-mono">{results.Question[0].name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Query Type</p>
                    <p className="font-medium">{results.Question[0].type}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Truncated</p>
                <Badge variant={results.TC ? "destructive" : "secondary"}>
                  {results.TC ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recursion Available</p>
                <Badge variant={results.RA ? "default" : "secondary"}>
                  {results.RA ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="raw">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Raw DNS Response</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={JSON.stringify(results, null, 2)}
              readOnly
              rows={20}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DNSResultsDisplay;
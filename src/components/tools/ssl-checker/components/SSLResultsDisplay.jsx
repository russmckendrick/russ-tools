import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Info, Award } from 'lucide-react';

import CertificatesTab from './CertificatesTab';
import SecurityTab from './SecurityTab';
import ProtocolsTab from './ProtocolsTab';
import CompatibilityTab from './CompatibilityTab';
import HeadersTab from './HeadersTab';
import { getGradeInfo } from '../utils/sslUtils';

const SSLResultsDisplay = ({ data }) => {
  if (!data) return null;

  const primaryEndpoint = data.endpoints?.[0];

  // Calculate overall grade - use lowest grade from all endpoints
  const overallGrade = data.endpoints?.reduce((lowest, endpoint) => {
    if (!endpoint.grade || endpoint.grade === '-') return lowest;
    const grades = ['A+', 'A', 'A-', 'B', 'C', 'D', 'E', 'F', 'T', 'M'];
    const currentIndex = grades.indexOf(endpoint.grade);
    const lowestIndex = grades.indexOf(lowest);
    return currentIndex > lowestIndex ? endpoint.grade : lowest;
  }, 'A+');

  // Grade badge component
  const getGradeBadge = (grade) => {
    if (!grade || grade === '-') return null;
    
    const gradeInfo = getGradeInfo(grade);
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${gradeInfo.color} text-white border-0 text-lg px-3 py-1 font-bold`}
          >
            <Award className="w-4 h-4 mr-1" />
            {grade}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{gradeInfo.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assessment Progress */}
      {data.assessmentProgress && data.status !== 'READY' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Assessment Progress</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{data.assessmentProgress.completionPercentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${data.assessmentProgress.completionPercentage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">{data.assessmentProgress.totalEndpoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ready</p>
                  <p className="font-medium text-green-600">{data.assessmentProgress.readyEndpoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">In Progress</p>
                  <p className="font-medium text-yellow-600">{data.assessmentProgress.inProgressEndpoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-medium text-gray-500">{data.assessmentProgress.pendingEndpoints}</p>
                </div>
              </div>
              {data.assessmentProgress.estimatedTimeRemaining > 0 && (
                <p className="text-sm text-muted-foreground">
                  Estimated time remaining: {data.assessmentProgress.estimatedTimeRemaining} seconds
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">SSL Grade</h3>
                  {overallGrade && getGradeBadge(overallGrade)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{data.statusMessage || data.status || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Host</p>
                    <p className="font-medium">{data.host}</p>
                  </div>
                  {data.endpoints && data.endpoints.length > 0 && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Endpoints</p>
                        <p className="font-medium">{data.endpoints.length} endpoint{data.endpoints.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Analysis Time</p>
                        <p className="font-medium">
                          {data.startTime ? `${Math.round((Date.now() - data.startTime) / 1000)}s` : 'Unknown'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {primaryEndpoint?.hasWarnings && (
                  <div className="mt-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Security Warnings</AlertTitle>
                      <AlertDescription>
                        This SSL configuration has security warnings that should be addressed.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {data.browserCheck && (
                  <div className="mt-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Browser-Based Check</AlertTitle>
                      <AlertDescription>
                        {data.note || 'This SSL check was performed using browser-based validation. For detailed certificate analysis, the API-based check will be used when available.'}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Endpoints Summary */}
            {data.endpoints && data.endpoints.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Endpoints</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.endpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <p className="font-medium">{endpoint.ipAddress}</p>
                            <p className="text-xs text-muted-foreground">{endpoint.statusMessage}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {endpoint.grade && endpoint.grade !== '-' && getGradeBadge(endpoint.grade)}
                          {endpoint.isComplete ? (
                            <Badge variant="default" className="bg-green-500 text-white">Complete</Badge>
                          ) : (
                            <Badge variant="secondary">
                              {endpoint.progress}% ({endpoint.eta}s)
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="certificates">
          <CertificatesTab data={data} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab data={data} />
        </TabsContent>

        <TabsContent value="protocols">
          <ProtocolsTab data={data} />
        </TabsContent>

        <TabsContent value="compatibility">
          <CompatibilityTab data={data} />
        </TabsContent>

        <TabsContent value="headers">
          <HeadersTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SSLResultsDisplay;
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';

const ValidationDisplay = ({ validationResult, detectedFormat }) => {
  if (!validationResult) return null;

  const getValidationIcon = () => {
    if (validationResult.success) {
      return <CheckCircle className="h-5 w-5 text-success" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-danger" />;
    }
  };

  const getValidationColor = () => {
    return validationResult.success 
      ? 'bg-success-subtle border-success/40'
      : 'bg-danger-subtle border-danger/40';
  };

  const formatErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Unknown error occurred';
  };

  return (
    <Card className={`${getValidationColor()} transition-colors duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getValidationIcon()}
            <CardTitle className="text-title-sm">
              Validation Results
            </CardTitle>
            <Badge variant={validationResult.success ? "default" : "destructive"}>
              {validationResult.success ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
          {detectedFormat && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-info" />
              <Badge variant="secondary">
                Detected: {detectedFormat.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
        <CardDescription>
          {validationResult.success 
            ? 'Your data is valid and ready for conversion'
            : 'Please fix the errors below before converting'
          }
        </CardDescription>
      </CardHeader>
      
      {!validationResult.success && validationResult.errors && (
        <CardContent>
          <div className="space-y-3">
            {validationResult.errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-mono text-data-md">
                  {formatErrorMessage(error)}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      )}
      
      {validationResult.success && validationResult.metadata && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
            {validationResult.metadata.lineCount && (
              <div>
                <span className="text-muted-foreground">Lines:</span>
                <span className="ml-2 font-medium">{validationResult.metadata.lineCount}</span>
              </div>
            )}
            {validationResult.metadata.size && (
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-2 font-medium">{validationResult.metadata.size} bytes</span>
              </div>
            )}
            {validationResult.metadata.format && (
              <div>
                <span className="text-muted-foreground">Format:</span>
                <span className="ml-2 font-medium">{validationResult.metadata.format.toUpperCase()}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ValidationDisplay;
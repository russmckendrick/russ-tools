import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Check, AlertTriangle, X } from 'lucide-react';

const ValidationIndicatorShadcn = ({ formState, validationState }) => {
  if (!formState.resourceType || formState.resourceType.length === 0) {
    return null;
  }

  const hasErrors = Object.keys(validationState.errors).length > 0;

  let statusIcon, statusVariant, statusText;
  if (hasErrors) {
    statusIcon = <X className="h-4 w-4" />;
    statusVariant = 'destructive';
    statusText = 'Validation Errors';
  } else if (validationState.isValid) {
    statusIcon = <Check className="h-4 w-4" />;
    statusVariant = 'default';
    statusText = 'Valid';
  } else {
    statusIcon = <AlertTriangle className="h-4 w-4" />;
    statusVariant = 'outline';
    statusText = 'Incomplete';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant} className="gap-1">
          {statusIcon}
          {statusText}
        </Badge>
      </div>

      {/* Show general error if present */}
      {validationState.errors.general && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{validationState.errors.general}</AlertDescription>
        </Alert>
      )}

      {hasErrors && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Please fix the following issues:</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {Object.entries(validationState.errors)
                .filter(([field]) => field !== 'general')
                .map(([field, error]) => (
                  <li key={field} className="text-sm">{error}</li>
                ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationState.isValid && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            All inputs are valid. You can generate a name for your resource.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ValidationIndicatorShadcn;
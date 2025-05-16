import React from 'react';
import { useAzureNaming } from '../../../hooks/useAzureNaming';

const ValidationIndicator = () => {
  const { validationState, formState } = useAzureNaming();

  if (!formState.resourceType) {
    return null;
  }

  const hasErrors = Object.keys(validationState.errors).length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            hasErrors ? 'bg-red-500' : validationState.isValid ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
        <span className="text-sm font-medium text-gray-700">
          {hasErrors
            ? 'Validation Errors'
            : validationState.isValid
            ? 'Valid'
            : 'Incomplete'}
        </span>
      </div>

      {hasErrors && (
        <div className="mt-2 p-3 bg-red-50 rounded-md">
          <h4 className="text-sm font-medium text-red-800">Please fix the following issues:</h4>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {Object.entries(validationState.errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validationState.isValid && (
        <div className="mt-2 p-3 bg-green-50 rounded-md">
          <p className="text-sm text-green-800">
            All inputs are valid. You can generate a name for your resource.
          </p>
        </div>
      )}
    </div>
  );
};

export default ValidationIndicator; 
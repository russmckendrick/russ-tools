import React, { useState } from 'react';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';

const ResultsDisplay = () => {
  const { validationState, formState } = useAzureNaming();
  const { addToHistory } = useAzureNamingContext();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(validationState.generatedName);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

      // Add to history
      addToHistory({
        resourceType: formState.resourceType,
        generatedName: validationState.generatedName,
        configuration: { ...formState }
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!validationState.generatedName) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Generated Name</h3>
      
      <div className="flex items-center space-x-2">
        <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
          {validationState.generatedName}
        </code>
        
        <button
          onClick={handleCopy}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {copySuccess ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Name Components:</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Resource Type:</dt>
          <dd className="text-gray-900">{formState.resourceType}</dd>
          
          <dt className="text-gray-500">Workload:</dt>
          <dd className="text-gray-900">{formState.workload}</dd>
          
          <dt className="text-gray-500">Environment:</dt>
          <dd className="text-gray-900">{formState.environment}</dd>
          
          <dt className="text-gray-500">Region:</dt>
          <dd className="text-gray-900">{formState.region}</dd>
          
          {formState.instance && (
            <>
              <dt className="text-gray-500">Instance:</dt>
              <dd className="text-gray-900">{formState.instance}</dd>
            </>
          )}
          
          {formState.customPrefix && (
            <>
              <dt className="text-gray-500">Custom Prefix:</dt>
              <dd className="text-gray-900">{formState.customPrefix}</dd>
            </>
          )}
          
          {formState.customSuffix && (
            <>
              <dt className="text-gray-500">Custom Suffix:</dt>
              <dd className="text-gray-900">{formState.customSuffix}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
};

export default ResultsDisplay; 
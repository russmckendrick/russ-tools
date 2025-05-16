import React from 'react';
import { AzureNamingProvider } from '../../../context/AzureNamingContext';
import ResourceTypeSelector from './ResourceTypeSelector';
import NamingForm from './NamingForm';
import ValidationIndicator from './ValidationIndicator';
import ResultsDisplay from './ResultsDisplay';
import NamingHistory from './NamingHistory';
import HelpTooltip from './HelpTooltip';

const AzureNamingTool = () => {
  return (
    <AzureNamingProvider>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Azure Resource Naming Tool
            <HelpTooltip
              content="Generate compliant Azure resource names following Microsoft's naming conventions and best practices."
              className="ml-2"
            />
          </h1>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ResourceTypeSelector />
                <NamingForm />
              </div>
              <div>
                <ValidationIndicator />
                <ResultsDisplay />
              </div>
            </div>

            <div className="mt-8">
              <NamingHistory />
            </div>
          </div>
        </div>
      </div>
    </AzureNamingProvider>
  );
};

export default AzureNamingTool; 
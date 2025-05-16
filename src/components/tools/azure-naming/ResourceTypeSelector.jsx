import React from 'react';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const ResourceTypeSelector = () => {
  const { formState, updateFormState, validationState } = useAzureNaming();
  const { resourceTypes } = useAzureNamingContext();

  const handleResourceTypeChange = (e) => {
    updateFormState('resourceType', e.target.value);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Resource Type
        <HelpTooltip
          content="Select the type of Azure resource you want to name. Each resource type has specific naming conventions and restrictions."
          className="ml-2"
        />
      </label>
      <select
        value={formState.resourceType}
        onChange={handleResourceTypeChange}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
          validationState.errors.resourceType ? 'border-red-300' : ''
        }`}
      >
        <option value="">Select a resource type</option>
        {resourceTypes.map((type) => (
          <option key={type} value={type}>
            {type.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      {validationState.errors.resourceType && (
        <p className="mt-2 text-sm text-red-600">{validationState.errors.resourceType}</p>
      )}
    </div>
  );
};

export default ResourceTypeSelector; 
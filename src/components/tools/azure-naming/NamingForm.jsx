import React from 'react';
import { useAzureNaming } from '../../../hooks/useAzureNaming';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import HelpTooltip from './HelpTooltip';

const NamingForm = () => {
  const { formState, updateFormState, validationState, generateName } = useAzureNaming();
  const { environments, regions } = useAzureNamingContext();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateFormState(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateName();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workload/Application Name
          <HelpTooltip
            content="Enter the name of your workload or application. This will be used as the main identifier in the resource name."
            className="ml-2"
          />
        </label>
        <input
          type="text"
          name="workload"
          value={formState.workload}
          onChange={handleInputChange}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            validationState.errors.workload ? 'border-red-300' : ''
          }`}
          placeholder="e.g., payments, webapp, database"
        />
        {validationState.errors.workload && (
          <p className="mt-2 text-sm text-red-600">{validationState.errors.workload}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Environment
          <HelpTooltip
            content="Select the environment where this resource will be deployed."
            className="ml-2"
          />
        </label>
        <select
          name="environment"
          value={formState.environment}
          onChange={handleInputChange}
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
            validationState.errors.environment ? 'border-red-300' : ''
          }`}
        >
          <option value="">Select an environment</option>
          {environments.map((env) => (
            <option key={env} value={env}>
              {env.charAt(0).toUpperCase() + env.slice(1)}
            </option>
          ))}
        </select>
        {validationState.errors.environment && (
          <p className="mt-2 text-sm text-red-600">{validationState.errors.environment}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Region
          <HelpTooltip
            content="Select the Azure region where this resource will be deployed."
            className="ml-2"
          />
        </label>
        <select
          name="region"
          value={formState.region}
          onChange={handleInputChange}
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
            validationState.errors.region ? 'border-red-300' : ''
          }`}
        >
          <option value="">Select a region</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region.replace(/([A-Z])/g, ' $1').trim()}
            </option>
          ))}
        </select>
        {validationState.errors.region && (
          <p className="mt-2 text-sm text-red-600">{validationState.errors.region}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instance Number
          <HelpTooltip
            content="Enter a 3-digit instance number (e.g., 001, 002). Required for resources that support multiple instances."
            className="ml-2"
          />
        </label>
        <input
          type="text"
          name="instance"
          value={formState.instance}
          onChange={handleInputChange}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            validationState.errors.instance ? 'border-red-300' : ''
          }`}
          placeholder="001"
        />
        {validationState.errors.instance && (
          <p className="mt-2 text-sm text-red-600">{validationState.errors.instance}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Prefix (Optional)
            <HelpTooltip
              content="Add a custom prefix to the resource name. This will be added before the resource type prefix."
              className="ml-2"
            />
          </label>
          <input
            type="text"
            name="customPrefix"
            value={formState.customPrefix}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., team, project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Suffix (Optional)
            <HelpTooltip
              content="Add a custom suffix to the resource name. This will be added at the end of the name."
              className="ml-2"
            />
          </label>
          <input
            type="text"
            name="customSuffix"
            value={formState.customSuffix}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., backup, archive"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate Name
        </button>
      </div>
    </form>
  );
};

export default NamingForm; 
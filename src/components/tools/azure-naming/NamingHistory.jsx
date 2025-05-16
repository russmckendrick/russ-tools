import React from 'react';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';
import { useAzureNaming } from '../../../hooks/useAzureNaming';

const NamingHistory = () => {
  const { namingHistory, clearHistory } = useAzureNamingContext();
  const { updateFormState } = useAzureNaming();

  const handleLoadConfiguration = (configuration) => {
    Object.entries(configuration).forEach(([field, value]) => {
      updateFormState(field, value);
    });
  };

  if (namingHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Names</h3>
        <button
          onClick={clearHistory}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear History
        </button>
      </div>
      
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {namingHistory.map((item) => (
            <li key={item.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {item.generatedName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.resourceType} • {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleLoadConfiguration(item.configuration)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Load
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NamingHistory; 
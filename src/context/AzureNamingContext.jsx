import React, { createContext, useContext, useReducer } from 'react';
import { RESOURCE_TYPES, ENVIRONMENT_ABBREVIATIONS, REGION_ABBREVIATIONS } from '../utils/azure-naming/rules';

// Initial state
const initialState = {
  resourceTypes: Object.keys(RESOURCE_TYPES),
  environments: Object.keys(ENVIRONMENT_ABBREVIATIONS),
  regions: Object.keys(REGION_ABBREVIATIONS),
  namingHistory: [],
  savedConfigurations: [],
  preferences: {
    defaultEnvironment: 'development',
    defaultRegion: 'eastus',
    showTooltips: true,
    autoValidate: true
  }
};

// Action types
const ActionTypes = {
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  SAVE_CONFIGURATION: 'SAVE_CONFIGURATION',
  DELETE_CONFIGURATION: 'DELETE_CONFIGURATION',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES'
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.ADD_TO_HISTORY:
      return {
        ...state,
        namingHistory: [
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...action.payload
          },
          ...state.namingHistory.slice(0, 9) // Keep last 10 items
        ]
      };

    case ActionTypes.CLEAR_HISTORY:
      return {
        ...state,
        namingHistory: []
      };

    case ActionTypes.SAVE_CONFIGURATION:
      return {
        ...state,
        savedConfigurations: [
          {
            id: Date.now(),
            name: action.payload.name,
            configuration: action.payload.configuration
          },
          ...state.savedConfigurations
        ]
      };

    case ActionTypes.DELETE_CONFIGURATION:
      return {
        ...state,
        savedConfigurations: state.savedConfigurations.filter(
          config => config.id !== action.payload
        )
      };

    case ActionTypes.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };

    default:
      return state;
  }
};

// Create context
const AzureNamingContext = createContext();

// Provider component
export const AzureNamingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addToHistory = (namingResult) => {
    dispatch({
      type: ActionTypes.ADD_TO_HISTORY,
      payload: namingResult
    });
  };

  const clearHistory = () => {
    dispatch({
      type: ActionTypes.CLEAR_HISTORY
    });
  };

  const saveConfiguration = (name, configuration) => {
    dispatch({
      type: ActionTypes.SAVE_CONFIGURATION,
      payload: { name, configuration }
    });
  };

  const deleteConfiguration = (id) => {
    dispatch({
      type: ActionTypes.DELETE_CONFIGURATION,
      payload: id
    });
  };

  const updatePreferences = (preferences) => {
    dispatch({
      type: ActionTypes.UPDATE_PREFERENCES,
      payload: preferences
    });
  };

  const value = {
    ...state,
    addToHistory,
    clearHistory,
    saveConfiguration,
    deleteConfiguration,
    updatePreferences
  };

  return (
    <AzureNamingContext.Provider value={value}>
      {children}
    </AzureNamingContext.Provider>
  );
};

// Custom hook to use the context
export const useAzureNamingContext = () => {
  const context = useContext(AzureNamingContext);
  if (!context) {
    throw new Error('useAzureNamingContext must be used within an AzureNamingProvider');
  }
  return context;
}; 
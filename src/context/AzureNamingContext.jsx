import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { RESOURCE_TYPES, ENVIRONMENT_ABBREVIATIONS } from '../utils/azure-naming/rules';
import { loadAzureRegionData } from '../utils/azure-naming/region-parser';

// Initial state
const initialState = {
  resourceTypes: Object.keys(RESOURCE_TYPES),
  environments: Object.keys(ENVIRONMENT_ABBREVIATIONS),
  regions: [],
  regionDropdownOptions: [],
  shortNames: {},
  regionData: null,
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
  SET_REGIONS: 'SET_REGIONS',
  SET_REGION_DATA: 'SET_REGION_DATA',
  SET_REGION_DROPDOWN: 'SET_REGION_DROPDOWN',
  SET_SHORTNAMES: 'SET_SHORTNAMES',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  SAVE_CONFIGURATION: 'SAVE_CONFIGURATION',
  DELETE_CONFIGURATION: 'DELETE_CONFIGURATION',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES'
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_REGIONS:
      return {
        ...state,
        regions: action.payload
      };
    case ActionTypes.SET_REGION_DATA:
      return {
        ...state,
        regionData: action.payload
      };
    case ActionTypes.SET_REGION_DROPDOWN:
      return {
        ...state,
        regionDropdownOptions: action.payload
      };
    case ActionTypes.SET_SHORTNAMES:
      return {
        ...state,
        shortNames: action.payload
      };
    case ActionTypes.ADD_TO_HISTORY:
      return {
        ...state,
        namingHistory: [action.payload, ...state.namingHistory].slice(0, 10)
      };
    case ActionTypes.CLEAR_HISTORY:
      return {
        ...state,
        namingHistory: []
      };
    case ActionTypes.SAVE_CONFIGURATION:
      return {
        ...state,
        savedConfigurations: [...state.savedConfigurations, action.payload]
      };
    case ActionTypes.DELETE_CONFIGURATION:
      return {
        ...state,
        savedConfigurations: state.savedConfigurations.filter(config => config.id !== action.payload)
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

// Context
const AzureNamingContext = createContext();

// Provider
export const AzureNamingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regionData = await loadAzureRegionData();
        dispatch({ type: ActionTypes.SET_REGION_DATA, payload: regionData });
        dispatch({ type: ActionTypes.SET_REGIONS, payload: Object.keys(regionData.cliNames) });
        // Build dropdown options: [{ label, value }]
        const dropdownOptions = Object.entries(regionData.regions).map(([slug, displayName]) => ({
          label: displayName,
          value: slug
        }));
        dispatch({ type: ActionTypes.SET_REGION_DROPDOWN, payload: dropdownOptions });
        dispatch({ type: ActionTypes.SET_SHORTNAMES, payload: regionData.shortNames });
      } catch (error) {
        console.error('Failed to load region data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRegions();
  }, []);

  const value = {
    ...state,
    isLoading,
    addToHistory: (name) => dispatch({ type: ActionTypes.ADD_TO_HISTORY, payload: name }),
    clearHistory: () => dispatch({ type: ActionTypes.CLEAR_HISTORY }),
    saveConfiguration: (config) => dispatch({ type: ActionTypes.SAVE_CONFIGURATION, payload: config }),
    deleteConfiguration: (id) => dispatch({ type: ActionTypes.DELETE_CONFIGURATION, payload: id }),
    updatePreferences: (prefs) => dispatch({ type: ActionTypes.UPDATE_PREFERENCES, payload: prefs })
  };

  return (
    <AzureNamingContext.Provider value={value}>
      {children}
    </AzureNamingContext.Provider>
  );
};

// Hook
export const useAzureNamingContext = () => {
  const context = useContext(AzureNamingContext);
  if (!context) {
    throw new Error('useAzureNamingContext must be used within an AzureNamingProvider');
  }
  return context;
}; 
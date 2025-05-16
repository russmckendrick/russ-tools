import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { RESOURCE_TYPES, generateResourceName } from '../utils/azure-naming/rules';
import environments from '../environments.json';
import { loadAzureRegionData } from '../utils/azure-naming/region-parser';

// Log raw RESOURCE_TYPES values for debugging
const rawResourceTypes = Object.values(RESOURCE_TYPES);
console.log('RAW RESOURCE_TYPES:', rawResourceTypes);

// Filter for unique resource type names (use only the first occurrence)
const seenNames = new Set();
const uniqueResourceTypes = [];
for (const rt of rawResourceTypes) {
  if (rt && rt.name && rt.type && !seenNames.has(rt.name)) {
    uniqueResourceTypes.push(rt);
    seenNames.add(rt.name);
  }
}
if (uniqueResourceTypes.length < rawResourceTypes.length) {
  console.warn('[AzureNamingContext] Duplicate resource type names detected. Only the first occurrence of each name will be used.');
}

function toDisplayName(name, slug) {
  let display = name.replace(/^azurerm_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  return `${display} (${slug})`;
}

const resourceTypes = uniqueResourceTypes.map(rt => ({
  value: `${rt.type}|${rt.name}`,
  label: toDisplayName(rt.name, rt.type)
}));
console.log('resourceTypes for Select:', resourceTypes);

// Initial state
const initialState = {
  resourceTypes, // Now an array of { value, label }
  environments: Object.keys(environments),
  regions: [],
  regionDropdownOptions: [],
  shortNames: {},
  regionData: null,
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
  const [namingHistory, setNamingHistory] = useLocalStorage({
    key: 'azure-naming-history',
    defaultValue: []
  });

  // --- BEGIN: Move form state and logic here ---
  const [formState, setFormState] = useState({
    resourceType: [],
    workload: '',
    environment: '',
    region: '',
    instance: '001',
    customPrefix: '',
    customSuffix: ''
  });

  const [validationState, setValidationState] = useState({
    isValid: false,
    errors: {},
    generatedName: '',
    isLoading: false
  });

  const updateFormState = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    if (!formState.resourceType || formState.resourceType.length === 0) {
      errors.resourceType = 'At least one resource type is required';
      isValid = false;
    }
    if (!formState.workload) {
      errors.workload = 'Workload/Application Name is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9 _-]+$/.test(formState.workload)) {
      errors.workload = 'Only letters, numbers, spaces, dashes, and underscores are allowed';
      isValid = false;
    }
    if (!formState.environment) {
      errors.environment = 'Environment is required';
      isValid = false;
    }
    if (!formState.region) {
      errors.region = 'Region is required';
      isValid = false;
    }
    if (formState.resourceType && formState.resourceType.length > 0) {
      const firstType = formState.resourceType[0];
      const rules = RESOURCE_TYPES[firstType];
      if (rules) {
        if (rules.format.includes('[instance]') && !/^[0-9]{3}$/.test(formState.instance)) {
          errors.instance = 'Instance must be a 3-digit number';
          isValid = false;
        }
      }
    }
    setValidationState(prev => ({
      ...prev,
      isValid,
      errors
    }));
    return isValid;
  };

  const getSlug = (resourceType) =>
    resourceType && resourceType.includes('|')
      ? resourceType.split('|')[0]
      : resourceType;

  const generateName = async () => {
    if (!validateForm()) {
      return null;
    }
    setValidationState(prev => ({
      ...prev,
      isLoading: true
    }));
    try {
      const generatedNames = (formState.resourceType || []).map((type) => {
        const params = {
          ...formState,
          resourceType: getSlug(type),
        };
        return generateResourceName(params, state.shortNames);
      });
      setValidationState(prev => ({
        ...prev,
        generatedName: generatedNames,
        isValid: true,
        errors: {},
        isLoading: false
      }));
      return generatedNames;
    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        isValid: false,
        errors: { general: error.message },
        isLoading: false
      }));
      return null;
    }
  };

  const resetForm = () => {
    setFormState({
      resourceType: [],
      workload: '',
      environment: '',
      region: '',
      instance: '001',
      customPrefix: '',
      customSuffix: ''
    });
    setValidationState({
      isValid: false,
      errors: {},
      generatedName: '',
      isLoading: false
    });
  };
  // --- END: Move form state and logic here ---

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
        console.log('[AzureNamingContext] Region dropdown options:', dropdownOptions);
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

  // Add environmentOptions for dropdowns
  const environmentOptions = Object.entries(environments).map(([key, value]) => ({
    value: key,
    label: value.displayName
  }));

  const value = {
    ...state,
    isLoading,
    environmentOptions,
    namingHistory,
    formState,
    validationState,
    updateFormState,
    setFormState,
    validateForm,
    generateName,
    resetForm,
    addToHistory: (name) => {
      const newHistory = [name, ...namingHistory].slice(0, 10);
      setNamingHistory(newHistory);
    },
    clearHistory: () => setNamingHistory([]),
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
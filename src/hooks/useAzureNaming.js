import { useState, useCallback } from 'react';
import { generateResourceName, validateResourceName, RESOURCE_TYPES } from '../utils/azure-naming/rules';
import { useAzureNamingContext } from '../context/AzureNamingContext';

export const useAzureNaming = () => {
  const { shortNames } = useAzureNamingContext();

  const [formState, setFormState] = useState({
    resourceType: '',
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

  const updateFormState = useCallback((field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;

    // Required fields validation
    if (!formState.resourceType) {
      errors.resourceType = 'Resource type is required';
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

    // Resource-specific validation
    if (formState.resourceType) {
      const rules = RESOURCE_TYPES[formState.resourceType];
      if (rules) {
        // Validate instance number if required
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
  }, [formState]);

  const generateName = useCallback(async () => {
    console.log('[generateName] called with formState:', formState);
    if (!validateForm()) {
      console.log('[generateName] form is invalid:', validationState.errors);
      return null;
    }

    setValidationState(prev => ({
      ...prev,
      isLoading: true
    }));

    try {
      // Pass shortNames to generateResourceName
      const generatedName = generateResourceName(formState, shortNames);
      console.log('[generateName] generated name:', generatedName);
      setValidationState(prev => ({
        ...prev,
        generatedName,
        isValid: true,
        errors: {},
        isLoading: false
      }));
      return generatedName;
    } catch (error) {
      console.log('[generateName] error:', error.message);
      setValidationState(prev => ({
        ...prev,
        isValid: false,
        errors: { general: error.message },
        isLoading: false
      }));
      return null;
    }
  }, [formState, validateForm, validationState.errors, shortNames]);

  const resetForm = useCallback(() => {
    setFormState({
      resourceType: '',
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
  }, []);

  return {
    formState,
    validationState,
    updateFormState,
    validateForm,
    generateName,
    resetForm
  };
}; 
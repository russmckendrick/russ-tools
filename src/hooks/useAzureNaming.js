import { useState, useCallback } from 'react';
import { generateResourceName, validateResourceName, RESOURCE_TYPES } from '../utils/azure-naming/rules';

export const useAzureNaming = () => {
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
    generatedName: ''
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
      errors.workload = 'Workload name is required';
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
        // Validate workload name
        const workloadValidation = validateResourceName(formState.workload, formState.resourceType);
        if (!workloadValidation.valid) {
          errors.workload = workloadValidation.error;
          isValid = false;
        }

        // Validate instance number if required
        if (rules.format.includes('[instance]') && !/^\d{3}$/.test(formState.instance)) {
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

  const generateName = useCallback(() => {
    console.log('[generateName] called with formState:', formState);
    if (!validateForm()) {
      console.log('[generateName] form is invalid:', validationState.errors);
      return null;
    }

    try {
      const generatedName = generateResourceName(formState);
      console.log('[generateName] generated name:', generatedName);
      setValidationState(prev => ({
        ...prev,
        generatedName,
        isValid: true,
        errors: {}
      }));
      return generatedName;
    } catch (error) {
      console.log('[generateName] error:', error.message);
      setValidationState(prev => ({
        ...prev,
        isValid: false,
        errors: { general: error.message }
      }));
      return null;
    }
  }, [formState, validateForm, validationState.errors]);

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
      generatedName: ''
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
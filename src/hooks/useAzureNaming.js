import { useCallback } from 'react';
import { useAzureNamingContext } from '../context/AzureNamingContext';

export const useAzureNaming = () => {
  // Use everything from context
  const {
    formState,
    validationState,
    updateFormState,
    setFormState,
    setPendingLoad,
    validateForm,
    generateName,
    resetForm
  } = useAzureNamingContext();

  // Optionally, you can wrap updateFormState etc. in useCallback if you want, but not required
  return {
    formState,
    validationState,
    updateFormState,
    setFormState,
    setPendingLoad,
    validateForm,
    generateName,
    resetForm
  };
}; 
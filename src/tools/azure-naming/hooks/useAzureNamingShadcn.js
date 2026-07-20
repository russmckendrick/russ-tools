import { useAzureNamingContextShadcn } from '../context/AzureNamingContextShadcn';

export const useAzureNamingShadcn = () => {
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
  } = useAzureNamingContextShadcn();

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
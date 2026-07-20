import React from 'react';
import { AzureNamingProviderShadcn } from './context/AzureNamingContextShadcn';
import AzureNamingShadcn from './AzureNamingShadcn';

/**
 * The provider lives here, inside the island — it used to wrap the entire
 * SPA in App.jsx, which fetched the Azure region Terraform file on every
 * page load of every tool for every visitor. Mounted per tool page, that
 * bug is unrepresentable.
 */
export default function AzureNamingTool() {
  return (
    <AzureNamingProviderShadcn>
      <AzureNamingShadcn />
    </AzureNamingProviderShadcn>
  );
}

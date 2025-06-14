import React from 'react';

/**
 * Portal Link Generator - Core URL generation logic for Microsoft portals
 */

// Azure Portal Deep Link Generators
export const generateAzurePortalLinks = (tenantId, options = {}) => {
  const baseUrl = 'https://portal.azure.com';
  const tenantParam = tenantId ? `?feature.customportal=false&Microsoft_Azure_Marketplace=true#@${tenantId}` : '';
  
  const links = {
    // Main Portal
    home: {
      name: 'Azure Portal Home',
      url: `${baseUrl}/${tenantParam}`,
      description: 'Main Azure portal dashboard',
      category: 'General'
    },
    
    // Resource Management
    allResources: {
      name: 'All Resources',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseAll`,
      description: 'View all Azure resources',
      category: 'Resources'
    },
    
    resourceGroups: {
      name: 'Resource Groups',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResourceGroups`,
      description: 'Manage resource groups',
      category: 'Resources'
    },
    
    subscriptions: {
      name: 'Subscriptions',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_Azure_Billing/SubscriptionsBlade`,
      description: 'View and manage subscriptions',
      category: 'Management'
    },
    
    // Identity & Access
    activeDirectory: {
      name: 'Azure Active Directory',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview`,
      description: 'Azure AD management',
      category: 'Identity'
    },
    
    users: {
      name: 'Users',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_AAD_IAM/UsersManagementMenuBlade/AllUsers`,
      description: 'Manage Azure AD users',
      category: 'Identity'
    },
    
    groups: {
      name: 'Groups',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_AAD_IAM/GroupsManagementMenuBlade/AllGroups`,
      description: 'Manage Azure AD groups',
      category: 'Identity'
    },
    
    // Security
    securityCenter: {
      name: 'Microsoft Defender for Cloud',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_Azure_Security/SecurityMenuBlade/0`,
      description: 'Security recommendations and alerts',
      category: 'Security'
    },
    
    keyVault: {
      name: 'Key Vaults',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults`,
      description: 'Manage Key Vaults',
      category: 'Security'
    },
    
    // Monitoring
    monitor: {
      name: 'Azure Monitor',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/overview`,
      description: 'Monitoring and diagnostics',
      category: 'Monitoring'
    },
    
    logAnalytics: {
      name: 'Log Analytics',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.OperationalInsights%2Fworkspaces`,
      description: 'Log Analytics workspaces',
      category: 'Monitoring'
    },
    
    // Compute
    virtualMachines: {
      name: 'Virtual Machines',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Compute%2FVirtualMachines`,
      description: 'Manage virtual machines',
      category: 'Compute'
    },
    
    appServices: {
      name: 'App Services',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites`,
      description: 'Web apps and API apps',
      category: 'Compute'
    },
    
    // Storage
    storageAccounts: {
      name: 'Storage Accounts',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Storage%2FStorageAccounts`,
      description: 'Manage storage accounts',
      category: 'Storage'
    },
    
    // Networking
    virtualNetworks: {
      name: 'Virtual Networks',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FvirtualNetworks`,
      description: 'Manage virtual networks',
      category: 'Networking'
    },
    
    loadBalancers: {
      name: 'Load Balancers',
      url: `${baseUrl}/${tenantParam}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FloadBalancers`,
      description: 'Manage load balancers',
      category: 'Networking'
    },
    
    // Cost Management
    costManagement: {
      name: 'Cost Management',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_Azure_CostManagement/Menu/overview`,
      description: 'Cost analysis and budgets',
      category: 'Management'
    },
    
    // Marketplace
    marketplace: {
      name: 'Marketplace',
      url: `${baseUrl}/${tenantParam}/blade/Microsoft_Azure_Marketplace/MarketplaceOffersBlade/selectedMenuItemId/home`,
      description: 'Azure Marketplace',
      category: 'General'
    }
  };
  
  return links;
};

// Microsoft 365 Admin Portal Links
export const generateM365AdminLinks = (tenantId, domain) => {
  const links = {
    // Main Admin Centers
    m365Admin: {
      name: 'Microsoft 365 Admin Center',
      url: `https://admin.microsoft.com/adminportal/home#/homepage`,
      description: 'Main Microsoft 365 administration',
      category: 'Admin Centers'
    },
    
    azureAD: {
      name: 'Azure AD Admin Center',
      url: tenantId ? `https://aad.portal.azure.com/#@${tenantId}/blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview` : 'https://aad.portal.azure.com/',
      description: 'Azure Active Directory management',
      category: 'Admin Centers'
    },
    
    exchange: {
      name: 'Exchange Admin Center',
      url: `https://admin.exchange.microsoft.com/#/`,
      description: 'Exchange Online management',
      category: 'Admin Centers'
    },
    
    sharepoint: {
      name: 'SharePoint Admin Center',
      url: domain ? `https://${domain.split('.')[0]}-admin.sharepoint.com/` : 'https://admin.microsoft.com/sharepoint',
      description: 'SharePoint Online management',
      category: 'Admin Centers'
    },
    
    teams: {
      name: 'Teams Admin Center',
      url: `https://admin.teams.microsoft.com/`,
      description: 'Microsoft Teams management',
      category: 'Admin Centers'
    },
    
    // Security & Compliance
    security: {
      name: 'Microsoft 365 Security',
      url: `https://security.microsoft.com/`,
      description: 'Security dashboard and management',
      category: 'Security'
    },
    
    compliance: {
      name: 'Microsoft 365 Compliance',
      url: `https://compliance.microsoft.com/`,
      description: 'Compliance center and policies',
      category: 'Security'
    },
    
    defender: {
      name: 'Microsoft 365 Defender',
      url: `https://security.microsoft.com/homepage`,
      description: 'Advanced threat protection',
      category: 'Security'
    },
    
    // User Management
    users: {
      name: 'Active Users',
      url: `https://admin.microsoft.com/adminportal/home#/users`,
      description: 'Manage Microsoft 365 users',
      category: 'Users'
    },
    
    groups: {
      name: 'Groups',
      url: `https://admin.microsoft.com/adminportal/home#/groups`,
      description: 'Manage Microsoft 365 groups',
      category: 'Users'
    },
    
    // Licensing
    licenses: {
      name: 'Licenses',
      url: `https://admin.microsoft.com/adminportal/home#/licenses`,
      description: 'Manage licenses and subscriptions',
      category: 'Management'
    },
    
    // Reports
    reports: {
      name: 'Reports',
      url: `https://admin.microsoft.com/adminportal/home#/reports/usage/overview`,
      description: 'Usage and activity reports',
      category: 'Management'
    },
    
    // Service Health
    serviceHealth: {
      name: 'Service Health',
      url: `https://admin.microsoft.com/adminportal/home#/servicehealth`,
      description: 'Service status and health',
      category: 'Management'
    }
  };
  
  return links;
};

// Power Platform & Dynamics 365 Links
export const generatePowerPlatformLinks = (tenantId, domain) => {
  const links = {
    // Power Platform Admin
    powerPlatformAdmin: {
      name: 'Power Platform Admin Center',
      url: `https://admin.powerplatform.microsoft.com/`,
      description: 'Power Platform administration',
      category: 'Admin Centers'
    },
    
    // Power Apps
    powerApps: {
      name: 'Power Apps',
      url: `https://make.powerapps.com/`,
      description: 'Create and manage Power Apps',
      category: 'Power Platform'
    },
    
    powerAppsAdmin: {
      name: 'Power Apps Admin',
      url: `https://admin.powerapps.com/`,
      description: 'Power Apps administration',
      category: 'Power Platform'
    },
    
    // Power Automate
    powerAutomate: {
      name: 'Power Automate',
      url: `https://make.powerautomate.com/`,
      description: 'Create and manage flows',
      category: 'Power Platform'
    },
    
    // Power BI
    powerBI: {
      name: 'Power BI Service',
      url: `https://app.powerbi.com/`,
      description: 'Power BI dashboards and reports',
      category: 'Power Platform'
    },
    
    powerBIAdmin: {
      name: 'Power BI Admin Portal',
      url: `https://app.powerbi.com/admin-portal/usageMetrics?noSignUpCheck=1`,
      description: 'Power BI administration',
      category: 'Power Platform'
    },
    
    // Power Virtual Agents
    powerVirtualAgents: {
      name: 'Power Virtual Agents',
      url: `https://web.powerva.microsoft.com/`,
      description: 'Create and manage chatbots',
      category: 'Power Platform'
    },
    
    // Dynamics 365
    dynamics365: {
      name: 'Dynamics 365 Home',
      url: `https://home.dynamics.com/`,
      description: 'Dynamics 365 applications',
      category: 'Dynamics 365'
    },
    
    dynamicsAdmin: {
      name: 'Dynamics 365 Admin Center',
      url: `https://admin.services.crm.dynamics.com/`,
      description: 'Dynamics 365 administration',
      category: 'Dynamics 365'
    },
    
    // Customer Engagement
    customerEngagement: {
      name: 'Customer Engagement Apps',
      url: `https://make.powerapps.com/environments`,
      description: 'Customer engagement applications',
      category: 'Dynamics 365'
    },
    
    // Finance & Operations
    financeOperations: {
      name: 'Finance & Operations',
      url: `https://diag.lcs.dynamics.com/`,
      description: 'Lifecycle Services portal',
      category: 'Dynamics 365'
    }
  };
  
  return links;
};

// Advanced Portal Links
export const generateAdvancedPortalLinks = (tenantId, domain) => {
  const links = {
    // Graph Explorer
    graphExplorer: {
      name: 'Graph Explorer',
      url: `https://developer.microsoft.com/en-us/graph/graph-explorer`,
      description: 'Test Microsoft Graph APIs',
      category: 'Developer'
    },
    
    // Azure DevOps
    azureDevOps: {
      name: 'Azure DevOps',
      url: `https://dev.azure.com/`,
      description: 'DevOps services and repositories',
      category: 'Developer'
    },
    
    // Visual Studio Code for Web
    vscodeWeb: {
      name: 'VS Code for Web',
      url: `https://vscode.dev/`,
      description: 'Visual Studio Code in browser',
      category: 'Developer'
    },
    
    // Azure Cloud Shell
    cloudShell: {
      name: 'Azure Cloud Shell',
      url: `https://shell.azure.com/`,
      description: 'Browser-based shell experience',
      category: 'Developer'
    },
    
    // Azure Resource Manager
    armTemplates: {
      name: 'ARM Template Deployment',
      url: tenantId ? `https://portal.azure.com/#@${tenantId}/create/Microsoft.Template` : 'https://portal.azure.com/#create/Microsoft.Template',
      description: 'Deploy ARM templates',
      category: 'Developer'
    },
    
    // Azure API Management
    apiManagement: {
      name: 'API Management',
      url: tenantId ? `https://portal.azure.com/#@${tenantId}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.ApiManagement%2Fservice` : 'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.ApiManagement%2Fservice',
      description: 'Manage APIs and gateways',
      category: 'Developer'
    },
    
    // Azure Functions
    functions: {
      name: 'Azure Functions',
      url: tenantId ? `https://portal.azure.com/#@${tenantId}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites/kind/functionapp` : 'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites/kind/functionapp',
      description: 'Serverless compute functions',
      category: 'Developer'
    },
    
    // Logic Apps
    logicApps: {
      name: 'Logic Apps',
      url: tenantId ? `https://portal.azure.com/#@${tenantId}/blade/HubsExtension/BrowseResource/resourceType/Microsoft.Logic%2Fworkflows` : 'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Logic%2Fworkflows',
      description: 'Workflow automation',
      category: 'Developer'
    }
  };
  
  return links;
};

// Main function to generate all portal links
export const generateAllPortalLinks = (tenantInfo) => {
  if (!tenantInfo) return {};
  
  const { tenantId, domain } = tenantInfo;
  
  return {
    azure: generateAzurePortalLinks(tenantId),
    m365: generateM365AdminLinks(tenantId, domain),
    powerPlatform: generatePowerPlatformLinks(tenantId, domain),
    advanced: generateAdvancedPortalLinks(tenantId, domain)
  };
};

// Helper function to get all categories
export const getAllCategories = () => {
  return [
    'General',
    'Admin Centers', 
    'Resources',
    'Identity',
    'Security',
    'Management',
    'Monitoring',
    'Compute',
    'Storage',
    'Networking',
    'Users',
    'Power Platform',
    'Dynamics 365',
    'Developer'
  ];
};

// Helper function to filter links by category
export const filterLinksByCategory = (links, category) => {
  const filtered = {};
  
  Object.keys(links).forEach(section => {
    filtered[section] = {};
    Object.keys(links[section]).forEach(key => {
      if (links[section][key].category === category) {
        filtered[section][key] = links[section][key];
      }
    });
  });
  
  return filtered;
};

// Helper function to search links
export const searchLinks = (links, searchTerm) => {
  if (!searchTerm) return links;
  
  const term = searchTerm.toLowerCase();
  const filtered = {};
  
  Object.keys(links).forEach(section => {
    filtered[section] = {};
    Object.keys(links[section]).forEach(key => {
      const link = links[section][key];
      if (
        link.name.toLowerCase().includes(term) ||
        link.description.toLowerCase().includes(term) ||
        link.category.toLowerCase().includes(term)
      ) {
        filtered[section][key] = link;
      }
    });
  });
  
  return filtered;
};

// This component doesn't render anything, it's just utility functions
const PortalLinkGenerator = () => null;

export default PortalLinkGenerator; 
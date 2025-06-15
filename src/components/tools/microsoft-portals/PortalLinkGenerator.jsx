import React from 'react';
import { getApiEndpoint } from '../../../utils/api/apiUtils';

// Import portal data from JSON files
import azurePortalsData from './data/azure-portals.json';
import m365PortalsData from './data/m365-portals.json';
import powerPlatformPortalsData from './data/power-platform-portals.json';
import advancedPortalsData from './data/advanced-portals.json';

/**
 * Portal Link Generator - Core URL generation logic for Microsoft portals
 */

// Azure Portal Deep Link Generators
export const generateAzurePortalLinks = (tenantId, domain, options = {}) => {
  const externalConfig = getApiEndpoint('external');
  const baseUrl = externalConfig.azure_portal;
  const tenantParam = tenantId ? `?feature.customportal=false&Microsoft_Azure_Marketplace=true#@${tenantId}` : '';
  
  const links = {};
  
  // Process each portal from the JSON data
  Object.keys(azurePortalsData).forEach(key => {
    const portal = azurePortalsData[key];
    let url;
    
    // Handle different URL patterns
    if (portal.url) {
      // Direct URL (like standalone services)
      url = portal.url;
    } else if (portal.urlWithDomain && domain) {
      // Domain-specific URLs for CSP partners
      url = portal.urlWithDomain.replace('{domain}', domain);
    } else if (portal.urlWithTenant && tenantId) {
      // Tenant-specific URLs
      url = portal.urlWithTenant.replace('{tenantId}', tenantId);
    } else {
      // Standard Azure portal paths
      url = `${baseUrl}/${tenantParam}${portal.path}`;
    }
    
    links[key] = {
      name: portal.name,
      url: url,
      description: portal.description,
      category: portal.category,
      tags: portal.tags || [portal.category]
    };
  });
  
  return links;
};

// Microsoft 365 Admin Portal Links
export const generateM365AdminLinks = (tenantId, domain) => {
  const links = {};
  
  // Process each portal from the JSON data
  Object.keys(m365PortalsData).forEach(key => {
    const portal = m365PortalsData[key];
    let url = portal.url;
    
    // Handle special URL cases - prioritize tenant-specific URLs for CSP partners
    if (portal.urlWithTenant && tenantId) {
      url = portal.urlWithTenant.replace('{tenantId}', tenantId);
    } else if (portal.urlWithDomain && domain) {
      url = portal.urlWithDomain.replace('{domain}', domain);
    }
    
    links[key] = {
      name: portal.name,
      url: url,
      description: portal.description,
      category: portal.category,
      tags: portal.tags || [portal.category]
    };
  });
  
  return links;
};

// Power Platform & Dynamics 365 Links
export const generatePowerPlatformLinks = (tenantId, domain) => {
  const links = {};
  
  // Process each portal from the JSON data
  Object.keys(powerPlatformPortalsData).forEach(key => {
    const portal = powerPlatformPortalsData[key];
    let url = portal.url;
    
    // Handle tenant-specific URLs
    if (portal.urlWithTenant && tenantId) {
      url = portal.urlWithTenant.replace('{tenantId}', tenantId);
    } else if (portal.urlWithDomain && domain) {
      url = portal.urlWithDomain.replace('{domain}', domain);
    }
    
    links[key] = {
      name: portal.name,
      url: url,
      description: portal.description,
      category: portal.category,
      tags: portal.tags || [portal.category]
    };
  });
  
  return links;
};

// Advanced Portal Links
export const generateAdvancedPortalLinks = (tenantId, domain) => {
  const links = {};
  
  // Process each portal from the JSON data
  Object.keys(advancedPortalsData).forEach(key => {
    const portal = advancedPortalsData[key];
    let url = portal.url;
    
    // Handle tenant-specific URLs
    if (portal.urlWithTenant && tenantId) {
      url = portal.urlWithTenant.replace('{tenantId}', tenantId);
    } else if (portal.urlWithDomain && domain) {
      url = portal.urlWithDomain.replace('{domain}', domain);
    } else if (portal.urlWithDomainOnMicrosoft && domain) {
      // Special case for URLs that need .onmicrosoft.com format
      const domainPrefix = domain.includes('.') ? domain.split('.')[0] : domain;
      url = portal.urlWithDomainOnMicrosoft.replace('{domain}', domainPrefix);
    }
    
    links[key] = {
      name: portal.name,
      url: url,
      description: portal.description,
      category: portal.category,
      tags: portal.tags || [portal.category]
    };
  });
  
  return links;
};

// Main function to generate all portal links
export const generateAllPortalLinks = (tenantInfo) => {
  const tenantId = tenantInfo?.tenantId || null;
  const domain = tenantInfo?.domain || null;
  
  return {
    azure: generateAzurePortalLinks(tenantId, domain),
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
        link.category.toLowerCase().includes(term) ||
        (link.tags && link.tags.some(tag => tag.toLowerCase().includes(term)))
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
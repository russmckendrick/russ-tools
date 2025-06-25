import { IconNetwork, IconBrandAzure, IconClock, IconShield, IconBrandGithub, IconMessageCircle, IconChartDots3 } from '@tabler/icons-react';
import DNSIcon from '../components/tools/dns-lookup/DNSIcon';
import WHOISIcon from '../components/tools/whois/WHOISIcon';
import JSONIcon from '../components/tools/data-converter/JSONIcon';
import Base64Icon from '../components/tools/base64/Base64Icon';
import JWTIcon from '../components/tools/jwt/JWTIcon';
import PasswordIcon from '../components/tools/password-generator/PasswordIcon';
import MicrosoftPortalsIcon from '../components/tools/microsoft-portals/MicrosoftPortalsIcon';
import TenantLookupIcon from '../components/tools/tenant-lookup/TenantLookupIcon';
import toolsConfig from './toolsConfig.json';

// Icon mapping object
const iconMap = {
  IconNetwork,
  IconBrandAzure,
  IconClock,
  IconShield,
  IconBrandGithub,
  IconMessageCircle,
  IconChartDots3,
  DNSIcon,
  WHOISIcon,
  JSONIcon,
  Base64Icon,
  JWTIcon,
  PasswordIcon,
  MicrosoftPortalsIcon,
  TenantLookupIcon,
};

/**
 * Get all tools with resolved icon components
 * @param {boolean} includeGithub - Whether to include the GitHub source link
 * @returns {Array} Array of tool objects with resolved icon components
 */
export function getTools(includeGithub = true) {
  const tools = includeGithub ? toolsConfig : toolsConfig.filter(tool => tool.id !== 'github-source');
  
  return tools.map(tool => ({
    ...tool,
    icon: iconMap[tool.icon] || IconNetwork, // fallback to IconNetwork if icon not found
  }));
}

/**
 * Get tools formatted for navbar (uses shortDescription and adds link property)
 * @returns {Array} Array of tool objects formatted for navbar use
 */
export function getNavbarTools() {
  return getTools().map(tool => ({
    icon: tool.icon,
    title: tool.title,
    description: tool.shortDescription,
    link: tool.path,
    color: tool.iconColor,
  }));
}

/**
 * Get tools formatted for home view (excludes GitHub source)
 * @returns {Array} Array of tool objects formatted for home view
 */
export function getHomeViewTools() {
  return getTools(false);
} 
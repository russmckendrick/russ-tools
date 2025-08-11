import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';
import toolsConfig from '@/utils/toolsConfig.json';
import { IconNetwork, IconBrandAzure, IconChartDots3, IconClock, IconShield, IconMessageCircle, IconBrandGithub } from '@tabler/icons-react';
import Base64Icon from '@/components/tools/base64/Base64Icon';
import JSONIcon from '@/components/tools/data-converter/JSONIcon';
import DNSIcon from '@/components/tools/dns-lookup/DNSIcon';
import WHOISIcon from '@/components/tools/whois/WHOISIcon';
import PasswordIcon from '@/components/tools/password-generator/PasswordIcon';
import JWTIcon from '@/components/tools/jwt/JWTIcon';
import MicrosoftPortalsIcon from '@/components/tools/microsoft-portals/MicrosoftPortalsIcon';
import TenantLookupIcon from '@/components/tools/tenant-lookup/TenantLookupIcon';
import AzureKQLIcon from '@/components/tools/azure-kql/AzureKQLIcon';
import BuzzwordIpsumIcon from '@/components/tools/buzzword-ipsum/BuzzwordIpsumIcon';

/**
 * Unified Tool Header Component
 * Provides consistent styling and layout across all tools
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Tool icon (Lucide React icon)
 * @param {string} props.title - Tool title
 * @param {string} props.description - Tool description
 * @param {Array} props.actions - Array of action buttons (optional)
 * @param {Object} props.alert - Alert object with text and variant (optional)
 * @param {string} props.iconColor - Icon color theme: 'blue', 'green', 'purple', 'orange', 'red', 'cyan' (default: 'blue')
 * @param {boolean} props.standalone - If true, renders without Card wrapper (default: false)
 * @param {boolean} props.showTitle - If false, hides the big title (for when top bar shows page name). Default: true
 * @param {string} props.toolId - Optional tool id to resolve icon and color from toolsConfig
 */
const ToolHeader = ({
  icon: Icon,
  title,
  description,
  actions = [],
  badges = [],
  alert = null,
  iconColor = 'blue',
  standalone = false,
  showTitle = true,
  toolId
}) => {
  // Resolve icon/color from toolsConfig for consistency
  const location = useLocation();
  const iconByKey = {
    IconNetwork: IconNetwork,
    IconBrandAzure: IconBrandAzure,
    IconChartDots3: IconChartDots3,
    IconClock: IconClock,
    IconShield: IconShield,
    IconMessageCircle: IconMessageCircle,
    IconBrandGithub: IconBrandGithub,
    DNSIcon: DNSIcon,
    WHOISIcon: WHOISIcon,
    Base64Icon: Base64Icon,
    JSONIcon: JSONIcon,
    JWTIcon: JWTIcon,
    PasswordIcon: PasswordIcon,
    MicrosoftPortalsIcon: MicrosoftPortalsIcon,
    TenantLookupIcon: TenantLookupIcon,
    AzureKQLIcon: AzureKQLIcon,
    BuzzwordIpsumIcon: BuzzwordIpsumIcon,
  };

  const detectedTool = React.useMemo(() => {
    if (toolId) return toolsConfig.find(t => t.id === toolId);
    const byPath = toolsConfig.find(t => t.path && location.pathname.startsWith(t.path));
    return byPath || null;
  }, [location.pathname, toolId]);

  const ResolvedIcon = React.useMemo(() => {
    const fromConfig = detectedTool?.icon ? iconByKey[detectedTool.icon] : null;
    return fromConfig || Icon || Info;
  }, [detectedTool, Icon]);

  const resolvedColorKey = detectedTool?.iconColor || iconColor;

  // Icon color mapping with consistent design
  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const iconClasses = iconColorClasses[resolvedColorKey] || iconColorClasses.blue;

  // Header content structure
  const HeaderContent = () => (
    <div className="space-y-4">
      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left side: Icon + Title + Description */}
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconClasses}`}>
            <ResolvedIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            {showTitle && (
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            )}
            <p className="text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        {/* Right side: Action buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size={action.size || 'sm'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                {action.text}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Alert section (if provided) */}
      {alert && (
        <Alert 
          variant={alert.variant || 'default'}
          className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50"
        >
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            {alert.title && <span className="font-semibold">{alert.title}: </span>}
            {alert.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Render with or without Card wrapper
  if (standalone) {
    return <HeaderContent />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <HeaderContent />
      </CardHeader>
    </Card>
  );
};

export default ToolHeader;
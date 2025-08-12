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
import SSLCheckerIcon from '@/components/tools/ssl-checker/SSLCheckerIcon';
import CronIcon from '@/components/tools/cron/CronIcon';
import NetworkDesignerIcon from '@/components/tools/network-designer/NetworkDesignerIcon';

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
 * @param {boolean} props.standalone - If true, renders without Card wrapper (default: false)
 * @param {boolean} props.showTitle - If false, hides the big title (for when top bar shows page name). Default: true
 * @param {string} props.toolId - Optional tool id to resolve icon from toolsConfig
 */
const ToolHeader = ({
  icon: Icon,
  title,
  description,
  actions = [],
  alert = null,
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
    SSLCheckerIcon: SSLCheckerIcon,
    CronIcon: CronIcon,
    NetworkDesignerIcon: NetworkDesignerIcon,
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

  

  const seededRandom = (seed) => {
    let t = seed + 0x6D2B79F5;
    return () => {
      t |= 0;
      t = (t + 0x6D2B79F5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };
  const stringToSeed = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h;
  };
  const tokenStyle = React.useMemo(() => {
    const seedBase = detectedTool?.id || location.pathname || 'tool';
    const rnd = seededRandom(stringToSeed(seedBase));
    const baseRot = (rnd() - 0.5) * 10;
    const baseScale = 0.95 + rnd() * 0.18;
    const dx = 2 + rnd() * 6;
    const dy = 2 + rnd() * 6;
    const drot = (rnd() - 0.5) * 1.8;
    const dur = 4.2 + rnd() * 4.8;
    const delay = -rnd() * 5;
    return {
      '--base-rot': `${baseRot}deg`,
      '--base-scale': `${baseScale}`,
      '--idle-dx': `${dx}px`,
      '--idle-dy': `${dy}px`,
      '--idle-rot': `${drot}deg`,
      '--idle-dur': `${dur}s`,
      '--idle-delay': `${delay}s`,
    };
  }, [detectedTool, location.pathname]);

  // Header content structure
  const HeaderContent = () => (
    <div className="space-y-4">
      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left side: Icon + Title + Description */}
        <div className="flex items-start gap-4">
          <div
            className="icon-token"
            style={{
              ...tokenStyle,
              background: 'transparent',
              border: 'none',
              width: 'auto',
              height: 'auto',
              padding: 0,
              boxShadow: 'none'
            }}
          >
            <ResolvedIcon className="icon-el" />
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
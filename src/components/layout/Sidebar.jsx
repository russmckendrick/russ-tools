import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// theme toggle not needed in sidebar; kept in header
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import toolsConfig from "@/utils/toolsConfig.json"
import { IconNetwork, IconBrandAzure, IconChartDots3, IconClock, IconShield, IconMessageCircle, IconBrandGithub } from "@tabler/icons-react"
import Base64Icon from "@/components/tools/base64/Base64Icon"
import JSONIcon from "@/components/tools/data-converter/JSONIcon"
import DNSIcon from "@/components/tools/dns-lookup/DNSIcon"
import WHOISIcon from "@/components/tools/whois/WHOISIcon"
import PasswordIcon from "@/components/tools/password-generator/PasswordIcon"
import JWTIcon from "@/components/tools/jwt/JWTIcon"
import MicrosoftPortalsIcon from "@/components/tools/microsoft-portals/MicrosoftPortalsIcon"
import TenantLookupIcon from "@/components/tools/tenant-lookup/TenantLookupIcon"
import AzureKQLIcon from "@/components/tools/azure-kql/AzureKQLIcon"
import BuzzwordIpsumIcon from "@/components/tools/buzzword-ipsum/BuzzwordIpsumIcon"
import SSLCheckerIcon from "@/components/tools/ssl-checker/SSLCheckerIcon"
import CronIcon from "@/components/tools/cron/CronIcon"
import NetworkDesignerIcon from "@/components/tools/network-designer/NetworkDesignerIcon"
import MarkdownTableIcon from "@/components/tools/markdown-table-tool/MarkdownTableIcon"
import { FileText, Home, Trash2 } from "lucide-react"

// Map string names in toolsConfig to actual components
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
  MarkdownTableIcon: MarkdownTableIcon,
}

// Flat list of tools from config
const toolItems = toolsConfig
  .filter((t) => t.path && t.path.startsWith("/"))
  .map((t) => ({ name: t.title, path: t.path, iconKey: t.icon }))
  

export function Sidebar({ onClose, collapsed = false }) {
  const location = useLocation()

  const isActiveItem = (path) => {
    return location.pathname === path
  }

  

  return (
    <div className={cn("flex flex-col h-full min-h-0", collapsed ? "w-16" : "w-64") }>
      
      <div
        className="flex-1 py-2 overflow-y-auto overscroll-y-contain min-h-0 touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={cn("px-3 py-2", collapsed && "px-2")}>
          <div className="space-y-1">
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActiveItem("/") ? "secondary" : "ghost"}
                    className={cn("w-full justify-start h-9 px-2", collapsed && "justify-center")}
                    asChild
                  >
                    <Link to="/" onClick={() => onClose && onClose()}>
                      <Home className={cn("h-4 w-4", !collapsed && "mr-2")} />
                      {!collapsed && "Home"}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Home</TooltipContent>}
              </Tooltip>

              {toolItems
                .filter((t) => t.path !== "/ui-demo")
                .map((item) => (
                <Tooltip key={item.path} delayDuration={150}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActiveItem(item.path) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-2 relative",
                        isActiveItem(item.path) && "bg-muted font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-primary",
                        collapsed && "justify-center"
                      )}
                      asChild
                    >
                      <Link to={item.path} onClick={() => onClose && onClose()}>
                        {(() => {
                          const Candidate = iconByKey[item.iconKey]
                          const ItemIcon = Candidate || FileText
                          return <ItemIcon size={16} className={cn("text-primary", !collapsed && "mr-2")} />
                        })()}
                        {!collapsed && item.name}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{item.name}</TooltipContent>}
                </Tooltip>
              ))}
              
              
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Bottom utility */}
      <div className={cn("border-t p-3", collapsed && "p-2") }>
        <TooltipProvider>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn("w-full justify-start text-destructive hover:bg-destructive/10", collapsed && "justify-center")}
                asChild
              >
                <Link to="/delete" onClick={() => onClose && onClose()}>
                  <Trash2 className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && 'Clear Local Storage'}
                </Link>
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Clear Local Storage</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
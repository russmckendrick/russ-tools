import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
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
import { 
  Network, 
  Settings, 
  Database, 
  Shield, 
  Code, 
  FileText,
  Home,
  ChevronDown,
  ChevronRight,
  Github,
  X,
  Clock
} from "lucide-react"

const categoryOrder = [
  "Network Tools",
  "Azure Tools",
  "Microsoft Tools",
  "Security Tools",
  "Developer Tools",
  "Content Tools",
]

const categoryIcons = {
  "Network Tools": Network,
  "Azure Tools": Database,
  "Microsoft Tools": Settings,
  "Security Tools": Shield,
  "Developer Tools": Code,
  "Content Tools": FileText,
}

const iconRegistry = {
  DNSIcon: (props) => <svg {...props} viewBox="0 0 1 1" />, // placeholder, real icons rendered where needed
}

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
}

const toolCategories = [
  { name: "Dashboard", icon: Home, path: "/", items: [] },
  ...categoryOrder.map((categoryName) => {
    const items = toolsConfig
      .filter((t) => t.category === categoryName && t.path && t.path.startsWith("/"))
      .map((t) => ({ name: t.title, path: t.path, iconKey: t.icon }))
    return { name: categoryName, icon: categoryIcons[categoryName] || FileText, items }
  }).filter((c) => c.items.length > 0)
]

export function Sidebar({ onClose, collapsed = false }) {
  const location = useLocation()
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Network Tools']))
  const [hoveredCategory, setHoveredCategory] = useState(null)

  const toggleCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const isActiveItem = (path) => {
    return location.pathname === path
  }

  const isCategoryActive = (category) => {
    if (category.path && location.pathname === category.path) return true
    return category.items?.some(item => location.pathname === item.path)
  }

  return (
    <div className={cn("flex flex-col h-screen", collapsed ? "w-16" : "w-64") }>
      {/* Mobile close button */}
      {onClose && (
        <div className="flex justify-between items-center p-4 border-b lg:hidden">
          <h2 className="text-lg font-semibold">RussTools</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 space-y-4 py-4">
        <div className={cn("px-3 py-2", collapsed && "px-2")}>
          {!collapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight lg:block hidden">
              RussTools
            </h2>
          )}
          <div className="space-y-1">
            <TooltipProvider>
              {toolCategories.map((category) => (
                <div key={category.name} className={cn("relative", collapsed && "group")}
                  onMouseEnter={() => collapsed && setHoveredCategory(category.name)}
                  onMouseLeave={() => collapsed && setHoveredCategory(null)}
                >
                  {category.items.length === 0 ? (
                    <Button
                      variant={isCategoryActive(category) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-2",
                        isCategoryActive(category) && "bg-muted font-medium",
                        collapsed && "justify-center"
                      )}
                      asChild
                    >
                      <Link to={category.path} onClick={() => onClose && onClose()}>
                        <div className={cn("flex items-center", collapsed && "justify-center")}> 
                          <category.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                          {!collapsed && category.name}
                        </div>
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between h-9 px-2",
                              isCategoryActive(category) && "bg-muted/50",
                              collapsed && "justify-center"
                            )}
                            onClick={() => !collapsed && toggleCategory(category.name)}
                          >
                            <div className={cn("flex items-center", collapsed && "justify-center")}> 
                              <category.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                              {!collapsed && category.name}
                            </div>
                            {!collapsed && (
                              expandedCategories.has(category.name) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            )}
                          </Button>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">{category.name}</TooltipContent>
                        )}
                      </Tooltip>
                      {collapsed && hoveredCategory === category.name && (
                        <div className="absolute left-full top-0 z-50 ml-2 w-56 rounded-md border bg-background p-2 shadow-lg">
                          {category.items.map((item) => (
                            <Button
                              key={item.path}
                              variant={isActiveItem(item.path) ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start text-sm h-8 px-2 relative",
                                isActiveItem(item.path) && "bg-muted font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-primary"
                              )}
                              asChild
                            >
                              <Link to={item.path} onClick={() => onClose && onClose()}>
                                {(() => {
                                  const Candidate = iconByKey[item.iconKey]
                                  const ItemIcon = Candidate || (item.iconKey === 'IconBrandAzure' ? Database : FileText)
                                  return <ItemIcon size={16} className="mr-2 h-4 w-4" />
                                })()}
                                {item.name}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                      {!collapsed && expandedCategories.has(category.name) && (
                        <div className="ml-6 space-y-1">
                          {category.items.map((item) => (
                            <Button
                              key={item.path}
                              variant={isActiveItem(item.path) ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start text-sm font-normal h-8 px-2 relative",
                                isActiveItem(item.path) && "bg-muted font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-primary"
                              )}
                              asChild
                            >
                              <Link to={item.path} onClick={() => onClose && onClose()}>
                                {(() => {
                                  const Candidate = iconByKey[item.iconKey]
                                  const ItemIcon = Candidate || (item.iconKey === 'IconBrandAzure' ? Database : FileText)
                                  return <ItemIcon size={16} className="mr-2 h-4 w-4" />
                                })()}
                                {item.name}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {/* Demo link - temporary */}
              <Button
                variant={location.pathname === "/ui-demo" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  location.pathname === "/ui-demo" && "bg-muted font-medium",
                  collapsed && "justify-center"
                )}
                asChild
              >
                <Link to="/ui-demo" onClick={() => onClose && onClose()}>
                  <FileText className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && 'UI Demo'}
                </Link>
              </Button>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Bottom section with GitHub and Theme Toggle */}
      <div className={cn("border-t p-4 space-y-2", collapsed && "p-2") }>
        <Button variant="ghost" className={cn("w-full justify-start", collapsed && "justify-center")} asChild>
          <a 
            href="https://github.com/russmckendrick/russ-tools" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Github className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && 'GitHub'}
          </a>
        </Button>
        {!collapsed && (
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        )}
      </div>
    </div>
  )
}
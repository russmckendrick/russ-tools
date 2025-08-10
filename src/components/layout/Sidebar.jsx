import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  X
} from "lucide-react"

const toolCategories = [
  {
    name: "Dashboard",
    icon: Home,
    path: "/",
    items: []
  },
  {
    name: "Network Tools",
    icon: Network,
    items: [
      { name: "Network Designer", path: "/network-designer" },
      { name: "DNS Lookup", path: "/dns-lookup" },
      { name: "WHOIS Lookup", path: "/whois-lookup" },
      { name: "SSL Checker", path: "/ssl-checker" }
    ]
  },
  {
    name: "Azure Tools",
    icon: Database,
    items: [
      { name: "Resource Naming", path: "/azure-naming" },
      { name: "KQL Query Builder", path: "/azure-kql" }
    ]
  },
  {
    name: "Microsoft Tools",
    icon: Settings,
    items: [
      { name: "Portals (GDAP)", path: "/microsoft-portals" },
      { name: "Tenant Lookup", path: "/tenant-lookup" }
    ]
  },
  {
    name: "Security Tools",
    icon: Shield,
    items: [
      { name: "Password Generator", path: "/password-generator" },
      { name: "JWT Decoder", path: "/jwt" }
    ]
  },
  {
    name: "Developer Tools",
    icon: Code,
    items: [
      { name: "Base64 Encoder", path: "/base64" },
      { name: "Data Converter", path: "/data-converter" },
      { name: "CRON Builder", path: "/cron" },
      { name: "Buzzword Ipsum", path: "/buzzword-ipsum" }
    ]
  }
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
                        "w-full justify-start",
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
                              "w-full justify-between",
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
                                "w-full justify-start text-sm",
                                isActiveItem(item.path) && "bg-muted font-medium"
                              )}
                              asChild
                            >
                              <Link to={item.path} onClick={() => onClose && onClose()}>
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
                                "w-full justify-start text-sm font-normal",
                                isActiveItem(item.path) && "bg-muted font-medium"
                              )}
                              asChild
                            >
                              <Link to={item.path} onClick={() => onClose && onClose()}>
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
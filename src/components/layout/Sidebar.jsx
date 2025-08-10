import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
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
  Github
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

export function Sidebar() {
  const location = useLocation()
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Network Tools']))

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
    <div className="flex flex-col h-screen w-64">
      <div className="flex-1 space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            RussTools
          </h2>
          <div className="space-y-1">
            {toolCategories.map((category) => (
              <div key={category.name}>
                {category.items.length === 0 ? (
                  // Single item categories (like Dashboard)
                  <Button
                    variant={isCategoryActive(category) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isCategoryActive(category) && "bg-muted font-medium"
                    )}
                    asChild
                  >
                    <Link to={category.path}>
                      <category.icon className="mr-2 h-4 w-4" />
                      {category.name}
                    </Link>
                  </Button>
                ) : (
                  // Categories with sub-items
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between",
                        isCategoryActive(category) && "bg-muted/50"
                      )}
                      onClick={() => toggleCategory(category.name)}
                    >
                      <div className="flex items-center">
                        <category.icon className="mr-2 h-4 w-4" />
                        {category.name}
                      </div>
                      {expandedCategories.has(category.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedCategories.has(category.name) && (
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
                            <Link to={item.path}>
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
                location.pathname === "/ui-demo" && "bg-muted font-medium"
              )}
              asChild
            >
              <Link to="/ui-demo">
                <FileText className="mr-2 h-4 w-4" />
                UI Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom section with GitHub and Theme Toggle */}
      <div className="border-t p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <a 
            href="https://github.com/russmckendrick/russ-tools" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </a>
        </Button>
        
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
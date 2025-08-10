import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Network, 
  Database, 
  Shield, 
  Code, 
  Settings,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  FileCode2
} from "lucide-react"

const toolCategories = [
  {
    title: "Network Tools",
    description: "Design networks, check domains, analyze SSL certificates",
    icon: Network,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    tools: [
      { name: "Network Designer", path: "/network-designer", description: "Visual subnet planning with Terraform export" },
      { name: "DNS Lookup", path: "/dns-lookup", description: "Comprehensive DNS queries" },
      { name: "WHOIS Lookup", path: "/whois-lookup", description: "Domain registration info" },
      { name: "SSL Checker", path: "/ssl-checker", description: "Certificate security analysis" }
    ]
  },
  {
    title: "Azure & Microsoft",
    description: "Azure resource management and Microsoft 365 tools",
    icon: Database,
    color: "text-cyan-600 dark:text-cyan-400", 
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    tools: [
      { name: "Azure Naming", path: "/azure-naming", description: "CAF-compliant resource naming" },
      { name: "KQL Query Builder", path: "/azure-kql", description: "Build optimized KQL queries" },
      { name: "Microsoft Portals", path: "/microsoft-portals", description: "GDAP tenant deep links" },
      { name: "Tenant Lookup", path: "/tenant-lookup", description: "Microsoft tenant discovery" }
    ]
  },
  {
    title: "Security Tools", 
    description: "Password generation, JWT validation, and security analysis",
    icon: Shield,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    tools: [
      { name: "Password Generator", path: "/password-generator", description: "Cryptographically secure passwords" },
      { name: "JWT Decoder", path: "/jwt", description: "Decode and validate JWT tokens" }
    ]
  },
  {
    title: "Developer Tools",
    description: "Encoding, data conversion, and development utilities", 
    icon: Code,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    tools: [
      { name: "Base64 Encoder", path: "/base64", description: "Encode/decode text and files" },
      { name: "Data Converter", path: "/data-converter", description: "JSON, YAML, TOML conversion" },
      { name: "CRON Builder", path: "/cron", description: "Build cron expressions" },
      { name: "Buzzword Ipsum", path: "/buzzword-ipsum", description: "Corporate placeholder text" }
    ]
  }
]

const stats = [
  { label: "Total Tools", value: "14", icon: Zap },
  { label: "Categories", value: "4", icon: Settings },
  { label: "Client-Side", value: "100%", icon: Lock },
  { label: "Open Source", value: "Yes", icon: Globe }
]

export function NewHomeView() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Professional Developer Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive suite of network, cloud, and development tools. 
            All client-side, privacy-focused, and completely free.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="text-sm">Privacy First</Badge>
          <Badge variant="secondary" className="text-sm">No Registration</Badge>
          <Badge variant="secondary" className="text-sm">Mobile Responsive</Badge>
          <Badge variant="secondary" className="text-sm">Open Source</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tool Categories */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Tool Categories</h2>
          <p className="text-muted-foreground mt-2">
            Choose from our collection of professional-grade tools
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {toolCategories.map((category) => (
            <Card key={category.title} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <category.icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{tool.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {tool.description}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <Card className="bg-muted/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Why RussTools?</CardTitle>
          <CardDescription>
            Built with modern web technologies for maximum performance and security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Privacy Focused</h3>
              <p className="text-sm text-muted-foreground">
                All processing happens in your browser. Your data never leaves your device.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Built with React 19 and Vite for optimal performance and instant loading.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">No Registration</h3>
              <p className="text-sm text-muted-foreground">
                Start using any tool immediately. No accounts or sign-ups required.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileCode2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Open Source</h3>
              <p className="text-sm text-muted-foreground">
                Fully open source and available on GitHub for transparency and contribution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
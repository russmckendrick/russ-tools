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
  FileCode2,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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
  { label: "Tools", value: "14", icon: Zap },
  { label: "Client-Side", value: "100%", icon: Lock },
  { label: "Open Source", value: "Yes", icon: Globe }
]

export function NewHomeView() {
  return (
    <div className="space-y-8">

      {/* Recent activity */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent activity</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {(() => {
            const items = []
            try {
              const dns = JSON.parse(localStorage.getItem('dns-lookup-history') || '[]')
              dns.slice(0,5).forEach((h) => items.push({
                label: h.query || h.domain,
                meta: 'DNS Lookup',
                to: '/dns-lookup',
              }))
            } catch {}
            try {
              const whois = JSON.parse(localStorage.getItem('whois-lookup-history') || '[]')
              whois.slice(0,5).forEach((h) => items.push({
                label: h.query,
                meta: 'WHOIS',
                to: '/whois-lookup',
              }))
            } catch {}
            try {
              const ssl = JSON.parse(localStorage.getItem('ssl-checker-domain-history') || '[]')
              ssl.slice(0,5).forEach((h) => items.push({
                label: h.domain,
                meta: `SSL ${h.grade || ''}`.trim(),
                to: `/ssl-checker/${encodeURIComponent(h.domain)}`,
              }))
            } catch {}
            try {
              const tenants = JSON.parse(localStorage.getItem('tenant-lookup-saved') || '[]')
              tenants.slice(0,5).forEach((h) => items.push({
                label: h.domain || h.name,
                meta: 'Tenant Lookup',
                to: '/tenant-lookup',
              }))
            } catch {}
            try {
              const portals = JSON.parse(localStorage.getItem('microsoft-portals-history') || '[]')
              portals.slice(0,5).forEach((h) => items.push({
                label: h.domain,
                meta: 'Portals',
                to: '/microsoft-portals',
              }))
            } catch {}
            try {
              const kqlFavs = JSON.parse(localStorage.getItem('azure-kql-custom-templates') || '[]')
              kqlFavs.slice(0,5).forEach((t) => items.push({
                label: t.name || 'Custom KQL Template',
                meta: 'Azure KQL',
                to: '/azure-kql',
              }))
            } catch {}

            if (items.length === 0) {
              return <Card><CardContent className="py-6 text-sm text-muted-foreground">No recent activity yet. Use a tool and it will appear here.</CardContent></Card>
            }

            return (
              <Card className="border-muted/70"><CardContent className="p-0">
                <ul className="divide-y">
                  {items.slice(0,8).map((it, idx) => (
                    <li key={idx} className="px-3 py-2 hover:bg-muted/50 transition-colors">
                      <Link to={it.to} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium truncate max-w-[26rem]">{it.label}</div>
                          <div className="text-xs text-muted-foreground">{it.meta}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent></Card>
            )
          })()}
        </div>
      </div>

      {/* Saved networks + quick generate sections */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Saved Networks */}
        <Card className="border-muted/70">
          <CardHeader>
            <CardTitle className="text-base">Saved networks</CardTitle>
            <CardDescription>From Network Designer</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              try {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('network-designer-'))
                if (keys.length === 0) return <div className="px-3 py-3 text-sm text-muted-foreground">No saved networks</div>
                const items = keys.slice(0,6).map(k => {
                  try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} }
                })
                return (
                  <ul className="divide-y">
                    {items.map((n, i) => (
                      <li key={i} className="px-3 py-2">
                        <Link to="/network-designer" className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{n?.name || 'Saved network'}</div>
                            <div className="text-xs text-muted-foreground">{n?.parentNetwork ? `${n.parentNetwork.ip}/${n.parentNetwork.cidr}` : ''}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              } catch { return <div className="px-3 py-3 text-sm text-muted-foreground">No saved networks</div> }
            })()}
          </CardContent>
        </Card>

        {/* Random Passwords */}
        <Card className="border-muted/70">
          <CardHeader>
            <CardTitle className="text-base">Random passwords</CardTitle>
            <CardDescription>Quick copy, or open generator</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {Array.from({length:5}).map((_,i) => {
                const pwd = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2,6) + "!";
                return (
                  <li key={i} className="px-3 py-2 flex items-center justify-between">
                    <span className="font-mono text-sm truncate mr-2">{pwd}</span>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(pwd); toast.success('Copied password') }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link to="/password-generator" className="text-xs text-muted-foreground hover:underline">Open</Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Buzzword Ipsum */}
        <Card className="border-muted/70">
          <CardHeader>
            <CardTitle className="text-base">Buzzword ipsum</CardTitle>
            <CardDescription>Quick sentences</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {Array.from({length:5}).map((_,i) => {
                const phrase = `Leverage ${['synergies','innovation','scalability','alignment','efficiencies'][i%5]} to drive ${['outcomes','value','growth','impact','excellence'][Math.floor(Math.random()*5)]}.`;
                return (
                  <li key={i} className="px-3 py-2 flex items-center justify-between">
                    <span className="text-sm truncate mr-2">{phrase}</span>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(phrase); toast.success('Copied sentence') }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link to="/buzzword-ipsum" className="text-xs text-muted-foreground hover:underline">Open</Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick links to tools (compact, bottom) */}
      <div>
        <h2 className="text-sm font-medium mb-2 text-muted-foreground">Tools</h2>
        <div className="flex flex-wrap gap-2">
          {toolCategories.flatMap((c) => c.tools).map((tool) => (
            <Button key={tool.path} size="sm" variant="outline" asChild>
              <Link to={tool.path}>{tool.name}</Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground">All tools run locally in your browser.</p>
    </div>
  )
}
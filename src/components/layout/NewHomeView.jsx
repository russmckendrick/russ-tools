import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Copy,
  Fingerprint,
  PanelsTopLeft,
  Users,
  RefreshCw,
  History,
  Key,
  MessageSquareQuote
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
  const [buzzSeed, setBuzzSeed] = useState(0)
  const generateSecure = (len = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+'
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => chars[b % chars.length]).join('')
  }
  const [passwords] = useState(() => Array.from({ length: 5 }).map(() => generateSecure(16)))
  return (
    <div className="space-y-6 relative">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-52 w-52 rounded-full bg-secondary/20 blur-3xl" />

      {/* Hero */}
      <Card className="border-muted/70 bg-gradient-to-r from-background to-muted/40">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl">RussTools</CardTitle>
              <CardDescription>Modern, client-side tools for networks and cloud</CardDescription>
            </div>
            <div className="hidden sm:flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/network-designer">Open Network Designer</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/azure-kql">Open KQL Builder</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Saved networks + quick generate sections */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Saved Networks */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Saved data</CardTitle>
                  <CardDescription>From your tools</CardDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/network-designer">Open</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              try {
                const networks = JSON.parse(localStorage.getItem('networks') || '[]')
                const selectedId = JSON.parse(localStorage.getItem('selectedNetworkId') || 'null')
                if (!Array.isArray(networks) || networks.length === 0) return <div className="px-3 py-3 text-sm text-muted-foreground">No saved networks</div>
                const azureNaming = (() => {
                  try { return JSON.parse(localStorage.getItem('azure-naming-history') || '[]') } catch { return [] }
                })()
                const dataConv = (() => {
                  try { return JSON.parse(localStorage.getItem('dataConverter_history') || '[]') } catch { return [] }
                })()
                return (
                  <ul className="divide-y">
                    {networks.slice(0,4).map((n) => (
                      <li key={n.id} className="px-3 py-1.5">
                        <Link to="/network-designer" className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {n?.name || 'Saved network'}{n?.id === selectedId ? ' • current' : ''}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {n?.parentNetwork ? `${n.parentNetwork.ip}/${n.parentNetwork.cidr}` : ''}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                    {azureNaming.slice(0,2).map((h, i) => (
                      <li key={`azn-${i}`} className="px-3 py-1.5">
                        <Link to="/azure-naming" className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">Azure Naming</div>
                            <div className="text-xs text-muted-foreground truncate">{h?.result || h?.name || 'Previous session'}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                    {dataConv.slice(0,2).map((h, i) => (
                      <li key={`dc-${i}`} className="px-3 py-1.5">
                        <Link to="/data-converter" className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">Data Converter</div>
                            <div className="text-xs text-muted-foreground truncate">{h?.from || ''} → {h?.to || ''}</div>
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

        {/* Recent activity */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                <History className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              const items = []
              try {
                const dns = JSON.parse(localStorage.getItem('dns-lookup-history') || '[]')
                dns.slice(0,5).forEach((h) => items.push({ label: h.query || h.domain, meta: 'DNS Lookup', to: '/dns-lookup' }))
              } catch {}
              try {
                const whois = JSON.parse(localStorage.getItem('whois-lookup-history') || '[]')
                whois.slice(0,5).forEach((h) => items.push({ label: h.query, meta: 'WHOIS', to: '/whois-lookup' }))
              } catch {}
              try {
                const ssl = JSON.parse(localStorage.getItem('ssl-checker-domain-history') || '[]')
                ssl.slice(0,5).forEach((h) => items.push({ label: h.domain, meta: `SSL ${h.grade || ''}`.trim(), to: `/ssl-checker/${encodeURIComponent(h.domain)}` }))
              } catch {}
              try {
                const tenants = JSON.parse(localStorage.getItem('tenant-lookup-saved') || '[]')
                tenants.slice(0,5).forEach((h) => items.push({ label: h.domain || h.name, meta: 'Tenant Lookup', to: '/tenant-lookup' }))
              } catch {}
              try {
                const portals = JSON.parse(localStorage.getItem('microsoft-portals-history') || '[]')
                portals.slice(0,5).forEach((h) => items.push({ label: h.domain, meta: 'Portals', to: '/microsoft-portals' }))
              } catch {}
              try {
                const kqlFavs = JSON.parse(localStorage.getItem('azure-kql-custom-templates') || '[]')
                kqlFavs.slice(0,5).forEach((t) => items.push({ label: t.name || 'Custom KQL Template', meta: 'Azure KQL', to: '/azure-kql' }))
              } catch {}

              if (items.length === 0) {
                return <div className="px-3 py-3 text-sm text-muted-foreground">No recent activity yet</div>
              }

              const metaIcon = (meta) => {
                if (meta.startsWith('DNS')) return Globe
                if (meta.startsWith('WHOIS')) return Fingerprint
                if (meta.startsWith('SSL')) return Shield
                if (meta.startsWith('Portals')) return PanelsTopLeft
                if (meta.startsWith('Tenant')) return Users
                if (meta.startsWith('Azure KQL')) return FileCode2
                return ArrowRight
              }

              return (
                <ul className="divide-y">
                  {items.slice(0,6).map((it, idx) => {
                    const Icon = metaIcon(it.meta)
                    return (
                      <li key={idx} className="group px-3 py-1.5 hover:bg-muted/50 transition-colors">
                        <Link to={it.to} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate max-w-[26rem]">{it.label}</div>
                              <div className="text-xs text-muted-foreground">{it.meta}</div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </CardContent>
        </Card>

        {/* Random Passwords */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Key className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Random passwords</CardTitle>
                  <CardDescription>Quick copy, or open generator</CardDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/password-generator">Open</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {passwords.map((pwd, i) => (
                (
                  <li key={i} className="px-3 py-1.5 flex items-center justify-between">
                    <span className="font-mono text-sm truncate mr-2">{pwd}</span>
                    <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(pwd); toast.success('Copied password') }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </li>
                )
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Buzzword Ipsum */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <MessageSquareQuote className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Buzzword ipsum</CardTitle>
                  <CardDescription>One paragraph, quick copy</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/buzzword-ipsum">Open</Link>
                </Button>
                <Button size="icon" variant="outline" onClick={() => setBuzzSeed((s) => s + 1)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => { const text = document.getElementById('buzzword-paragraph')?.textContent || ''; navigator.clipboard.writeText(text); toast.success('Copied paragraph') }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {(() => {
              const termsA = ['synergies','innovation','scalability','alignment','efficiencies','optimization','resilience']
              const termsB = ['outcomes','value','growth','impact','excellence','velocity','time-to-value']
              const sentence = () => `Leverage ${termsA[Math.floor(Math.random()*termsA.length)]} to drive ${termsB[Math.floor(Math.random()*termsB.length)]}.`
              const paragraph = () => Array.from({length:5}).map(sentence).join(' ')
              // use seed to re-render
              const _ = buzzSeed
              return (
                <div id="buzzword-paragraph" className="space-y-2">
                  <p className="text-sm leading-6 text-muted-foreground">{paragraph()}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{paragraph()}</p>
                </div>
              )
            })()}
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
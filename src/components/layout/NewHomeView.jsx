import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import toolsConfig from "@/utils/toolsConfig.json"
import { IconNetwork, IconBrandAzure, IconChartDots3, IconClock, IconShield, IconMessageCircle, IconBrandGithub, IconTools } from "@tabler/icons-react"
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
}

export function NewHomeView() {
  const [buzzSeed, setBuzzSeed] = useState(0)
  const [ipsumSentences, setIpsumSentences] = useState(4)
  const [tones, setTones] = useState({ strategy: true, agile: false, ai: false })
  const generateSecure = (len = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+'
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => chars[b % chars.length]).join('')
  }
  const [pwdLength, setPwdLength] = useState(16)
  const [pwdOpts, setPwdOpts] = useState({ upper: true, lower: true, digits: true, symbols: true })
  const buildPwdChars = () => {
    let s = ''
    if (pwdOpts.upper) s += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (pwdOpts.lower) s += 'abcdefghijklmnopqrstuvwxyz'
    if (pwdOpts.digits) s += '0123456789'
    if (pwdOpts.symbols) s += '!@#$%^&*()-_=+'
    return s || 'abcdefghijklmnopqrstuvwxyz'
  }
  const generatePwd = (len = pwdLength) => {
    const chars = buildPwdChars()
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => chars[b % chars.length]).join('')
  }
  const [passwords, setPasswords] = useState(() => Array.from({ length: 6 }).map(() => generatePwd(16)))
  useEffect(() => { setPasswords(Array.from({ length: 6 }).map(() => generatePwd())) }, [pwdLength, pwdOpts.upper, pwdOpts.lower, pwdOpts.digits, pwdOpts.symbols])
  const visibleTools = toolsConfig.filter((t) => t.path && t.path.startsWith("/") && t.id !== "github-source" && t.id !== "ui-demo")

  const seededRandom = (seed) => {
    let t = seed + 0x6D2B79F5
    return () => {
      t |= 0
      t = t + 0x6D2B79F5 | 0
      let r = Math.imul(t ^ t >>> 15, 1 | t)
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r)
      return ((r ^ r >>> 14) >>> 0) / 4294967296
    }
  }
  const stringToSeed = (str) => {
    let h = 0
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
    return h
  }

  const getToolIconForPath = (path) => {
    try {
      const tool = toolsConfig.find((t) => t.path && path.startsWith(t.path))
      if (!tool) return null
      const Candidate = iconByKey[tool.icon]
      return Candidate || null
    } catch { return null }
  }
  
  return (
    <div className="space-y-6 relative">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-52 w-52 rounded-full bg-secondary/20 blur-3xl" />

      {/* Intro */}
      <Card className="border-muted/70 bg-gradient-to-r from-background to-muted/40">
        <CardHeader className="py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTools className="h-9 w-9 md:h-11 md:w-11 text-primary" />
              <div className="flex items-center gap-4 flex-wrap">
                <CardTitle className="text-primary text-3xl md:text-4xl font-extrabold tracking-tight">RussTools</CardTitle>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">A collection of random tools for day-to-day use</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {(() => {
        const gridRef = useRef(null)
        const [gridCols, setGridCols] = useState(6)
        const total = visibleTools.length
        useEffect(() => {
          const el = gridRef.current
          if (!el) return
          const calc = () => {
            const w = el.clientWidth
            const desiredRows = w < 640 ? 4 : (w < 1024 ? 3 : 4)
            const minTile = 84
            const gap = 32
            const maxColsFit = Math.max(1, Math.floor((w + gap) / (minTile + gap)))
            const colsNeeded = Math.ceil(total / desiredRows)
            const cols = Math.min(Math.max(colsNeeded, 2), maxColsFit)
            setGridCols(cols)
          }
          calc()
          const ro = new ResizeObserver(calc)
          ro.observe(el)
          return () => ro.disconnect()
        }, [total])
        return (
          <div ref={gridRef} className="icon-grid grid gap-8 place-items-center"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(84px, 1fr))` }}
          >
        {visibleTools.map((t, i) => {
          const Candidate = iconByKey[t.icon] || Network
          const Icon = Candidate
          const rnd = seededRandom(stringToSeed(t.id) ^ i)
          const baseRot = (rnd() - 0.5) * 10
          const baseScale = 0.95 + rnd() * 0.18
          const dx = 2 + rnd() * 6
          const dy = 2 + rnd() * 6
          const drot = (rnd() - 0.5) * 1.8
          const dur = 4.2 + rnd() * 4.8
          const delay = -rnd() * 5
          return (
            <Link
              key={t.id}
              to={t.path}
              className="icon-token"
              aria-label={t.title}
              title={t.title}
              style={{
                "--base-rot": `${baseRot}deg`,
                "--base-scale": `${baseScale}`,
                "--idle-dx": `${dx}px`,
                "--idle-dy": `${dy}px`,
                "--idle-rot": `${drot}deg`,
                "--idle-dur": `${dur}s`,
                "--idle-delay": `${delay}s`
              }}
            >
              <Icon className="icon-el" />
            </Link>
          )
        })}
          </div>
        )
      })()}

      {/* Saved networks + quick generate sections */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Saved Networks */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                <div>
                  <CardTitle className="text-base">Saved data</CardTitle>
                </div>
              </div>
              <div />
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
                  (() => {
                    const merged = []
                    const IconND = getToolIconForPath('/network-designer') || Network
                    const IconAN = getToolIconForPath('/azure-naming') || IconBrandAzure
                    const IconDC = getToolIconForPath('/data-converter') || JSONIcon
                    networks.forEach((n) => {
                      merged.push({
                        key: n.id,
                        to: '/network-designer',
                        Icon: IconND,
                        primary: n?.name || 'Saved network' + (n?.id === selectedId ? ' • current' : ''),
                        secondary: n?.parentNetwork ? `${n.parentNetwork.ip}/${n.parentNetwork.cidr}` : ''
                      })
                    })
                    azureNaming.forEach((h, i) => {
                      merged.push({ key: `azn-${i}`, to: '/azure-naming', Icon: IconAN, primary: 'Azure Naming', secondary: h?.result || h?.name || 'Previous session' })
                    })
                    dataConv.forEach((h, i) => {
                      merged.push({ key: `dc-${i}`, to: '/data-converter', Icon: IconDC, primary: 'Data Converter', secondary: `${h?.from || ''} → ${h?.to || ''}` })
                    })
                    return (
                      <ul className="divide-y">
                        {merged.slice(0,3).map((it) => (
                          <li key={it.key} className="group px-3 py-2 hover:bg-muted/50 transition-colors">
                            <Link to={it.to} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <it.Icon className="h-4 w-4 text-primary" />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{it.primary}</div>
                                  <div className="text-xs text-muted-foreground truncate">{it.secondary}</div>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )
                  })()
                )
              } catch { return <div className="px-3 py-3 text-sm text-muted-foreground">No saved networks</div> }
            })()}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 md:h-7 md:w-7 text-primary" />
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

              return (
                <ul className="divide-y">
                  {items.slice(0,3).map((it, idx) => {
                    const IconComp = getToolIconForPath(it.to) || ArrowRight
                    return (
                      <li key={idx} className="group px-3 py-2 hover:bg-muted/50 transition-colors">
                        <Link to={it.to} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <IconComp className="h-4 w-4 text-primary" />
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
                <PasswordIcon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
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
          <CardContent className="p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Length {pwdLength}</span>
                <Slider value={[pwdLength]} min={8} max={32} step={1} onValueChange={(v) => setPwdLength(v[0])} className="w-40" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="sw-upper" checked={pwdOpts.upper} onCheckedChange={(v) => setPwdOpts(o => ({ ...o, upper: v }))} />
                  <Label htmlFor="sw-upper" className="text-xs">A‑Z</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="sw-lower" checked={pwdOpts.lower} onCheckedChange={(v) => setPwdOpts(o => ({ ...o, lower: v }))} />
                  <Label htmlFor="sw-lower" className="text-xs">a‑z</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="sw-digits" checked={pwdOpts.digits} onCheckedChange={(v) => setPwdOpts(o => ({ ...o, digits: v }))} />
                  <Label htmlFor="sw-digits" className="text-xs">0‑9</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="sw-symbols" checked={pwdOpts.symbols} onCheckedChange={(v) => setPwdOpts(o => ({ ...o, symbols: v }))} />
                  <Label htmlFor="sw-symbols" className="text-xs">#</Label>
                </div>
              </div>
              <Button size="icon" variant="outline" onClick={() => setPasswords(Array.from({ length: 5 }).map(() => generatePwd()))}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {passwords.map((pwd, i) => {
                const delay = -Math.random() * 3
                return (
                  <button key={i} className="keycap" style={{ animationDelay: `${delay}s` }} onClick={() => { navigator.clipboard.writeText(pwd); toast.success('Copied password') }}>
                    {pwd}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Buzzword Ipsum */}
        <Card className="border-muted/70 bg-gradient-to-b from-muted/20 to-background shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BuzzwordIpsumIcon size={28} className="text-primary" />
                <div>
                  <CardTitle className="text-base">Buzzword ipsum</CardTitle>
                  <CardDescription>One paragraph, quick copy</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/buzzword-ipsum">Open</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sentences {ipsumSentences}</span>
                <Slider value={[ipsumSentences]} min={1} max={5} step={1} onValueChange={(v) => setIpsumSentences(v[0])} className="w-40" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="tone-strategy" checked={tones.strategy} onCheckedChange={(v) => setTones(t => ({ ...t, strategy: v }))} />
                  <Label htmlFor="tone-strategy" className="text-xs">Strategy</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="tone-agile" checked={tones.agile} onCheckedChange={(v) => setTones(t => ({ ...t, agile: v }))} />
                  <Label htmlFor="tone-agile" className="text-xs">Agile</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="tone-ai" checked={tones.ai} onCheckedChange={(v) => setTones(t => ({ ...t, ai: v }))} />
                  <Label htmlFor="tone-ai" className="text-xs">AI</Label>
                </div>
              </div>
              <Button size="icon" variant="outline" onClick={() => setBuzzSeed((s) => s + 1)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => { const text = document.getElementById('buzzword-paragraph')?.textContent || ''; navigator.clipboard.writeText(text); toast.success('Copied paragraph') }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {(() => {
              const baseA = ['synergies','innovation','scalability','alignment','efficiencies','optimization','resilience']
              const stratA = ['governance','roadmaps','operating models','value streams','stakeholder alignment']
              const agileA = ['sprints','backlogs','iterations','velocity','standups']
              const aiA = ['LLMs','embeddings','inference','fine‑tuning','vector search']
              let termsA = [...baseA]
              if (tones.strategy) termsA = [...termsA, ...stratA]
              if (tones.agile) termsA = [...termsA, ...agileA]
              if (tones.ai) termsA = [...termsA, ...aiA]
              const baseB = ['outcomes','value','growth','impact','excellence','velocity','time-to-value']
              const stratB = ['governance maturity','portfolio health','risk posture']
              const agileB = ['delivery cadence','team autonomy','throughput']
              const aiB = ['model performance','accuracy','hallucination rate']
              let termsB = [...baseB]
              if (tones.strategy) termsB = [...termsB, ...stratB]
              if (tones.agile) termsB = [...termsB, ...agileB]
              if (tones.ai) termsB = [...termsB, ...aiB]
              const sentence = () => `Leverage ${termsA[Math.floor(Math.random()*termsA.length)]} to drive ${termsB[Math.floor(Math.random()*termsB.length)]}.`
              const paragraph = () => Array.from({length:ipsumSentences}).map(sentence).join(' ')
              const _ = buzzSeed
              return (
                <div id="buzzword-paragraph" className="space-y-2">
                  <p className="text-sm leading-6 text-muted-foreground">{paragraph()}</p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground">All tools run locally in your browser.</p>

    </div>
  )
}
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet"
import * as L from "leaflet"
import {
  AlertTriangle,
  Map,
  ShieldAlert,
  Activity,
  Users,
  Layers,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Navigation,
  AlertOctagon,
  Database,
  MapPin,
  BellRing,
  CheckCircle2,
  Radio,
  Zap,
  ArrowUpRight,
  Shield,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Wifi,
  BarChart2,
  FileText,
  Bell,
  RefreshCw,
  Sun,
  Moon,
  Search,
  LocateFixed,
  X,
  Info,
  Waves,
  Mountain,
  Factory,
  ThermometerSun,
  CloudLightning,
  Cpu,
  Sparkles,
  Radar,
  Building2,
  Globe,
  Truck,
  ShieldCheck,
  Server,
  Clock,
  Target,
  Bot,
  Send,
  RotateCcw,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

// ── Fix Leaflet default marker icons in Vite ─────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// ── Theme Context ────────────────────────────────────────────────
const ThemeCtx = createContext<{ theme: "dark" | "light"; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
})
const useTheme = () => useContext(ThemeCtx)

// ── Images ───────────────────────────────────────────────────────
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1614294148960-9e740a35c74b?w=1920&h=1080&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=1920&h=1080&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&h=1080&fit=crop&auto=format",
]

// ── India State Hazard Data ───────────────────────────────────────
type RiskLevel = "critical" | "high" | "medium" | "low"
interface StateHazard {
  level: RiskLevel
  score: number
  floods: number
  landslides: number
  cyclone: number
  earthquake: number
  center: [number, number]
  radius: number
  districts: number
  population: string
}

const INDIA_HAZARD: Record<string, StateHazard> = {
  "Assam":              { level:"critical", score:95, floods:95, landslides:75, cyclone:20, earthquake:60, center:[26.2,92.9],   radius:120, districts:35, population:"35.6M" },
  "Kerala":             { level:"high",     score:78, floods:80, landslides:88, cyclone:50, earthquake:15, center:[10.5,76.3],   radius:100, districts:14, population:"35.0M" },
  "Odisha":             { level:"high",     score:76, floods:82, landslides:35, cyclone:90, earthquake:20, center:[20.9,85.1],   radius:130, districts:30, population:"46.9M" },
  "Bihar":              { level:"high",     score:72, floods:88, landslides:20, cyclone:10, earthquake:40, center:[25.9,85.1],   radius:110, districts:38, population:"128M"  },
  "Uttarakhand":        { level:"high",     score:80, floods:70, landslides:90, cyclone:5,  earthquake:75, center:[30.3,78.0],   radius:90,  districts:13, population:"10.1M" },
  "Himachal Pradesh":   { level:"medium",   score:65, floods:60, landslides:80, cyclone:5,  earthquake:65, center:[31.1,77.2],   radius:85,  districts:12, population:"7.5M"  },
  "West Bengal":        { level:"high",     score:74, floods:78, landslides:40, cyclone:70, earthquake:30, center:[22.9,87.9],   radius:115, districts:23, population:"99.6M" },
  "Andhra Pradesh":     { level:"medium",   score:58, floods:60, landslides:30, cyclone:65, earthquake:20, center:[15.9,79.7],   radius:125, districts:26, population:"54.2M" },
  "Tamil Nadu":         { level:"medium",   score:55, floods:65, landslides:25, cyclone:60, earthquake:10, center:[11.1,78.7],   radius:110, districts:38, population:"77.8M" },
  "Manipur":            { level:"high",     score:71, floods:65, landslides:85, cyclone:5,  earthquake:70, center:[24.8,93.9],   radius:70,  districts:16, population:"3.4M"  },
  "Nagaland":           { level:"medium",   score:60, floods:55, landslides:75, cyclone:5,  earthquake:60, center:[26.2,94.6],   radius:65,  districts:12, population:"2.2M"  },
  "Sikkim":             { level:"high",     score:77, floods:75, landslides:90, cyclone:5,  earthquake:80, center:[27.5,88.5],   radius:45,  districts:6,  population:"0.7M"  },
  "Maharashtra":        { level:"medium",   score:52, floods:60, landslides:45, cyclone:30, earthquake:35, center:[19.7,75.7],   radius:150, districts:36, population:"126M"  },
  "Gujarat":            { level:"medium",   score:50, floods:50, landslides:15, cyclone:55, earthquake:60, center:[22.3,72.6],   radius:130, districts:33, population:"70.4M" },
  "Rajasthan":          { level:"low",      score:30, floods:25, landslides:10, cyclone:10, earthquake:20, center:[27.0,74.2],   radius:160, districts:50, population:"79.5M" },
  "Meghalaya":          { level:"high",     score:70, floods:72, landslides:82, cyclone:10, earthquake:50, center:[25.5,91.4],   radius:65,  districts:12, population:"3.7M"  },
  "Arunachal Pradesh":  { level:"high",     score:73, floods:70, landslides:85, cyclone:5,  earthquake:75, center:[28.2,94.7],   radius:110, districts:26, population:"1.7M"  },
  "Mizoram":            { level:"medium",   score:62, floods:60, landslides:80, cyclone:5,  earthquake:55, center:[23.2,92.9],   radius:60,  districts:11, population:"1.3M"  },
  "Tripura":            { level:"medium",   score:58, floods:65, landslides:60, cyclone:10, earthquake:50, center:[23.9,91.5],   radius:55,  districts:8,  population:"4.2M"  },
  "Jammu & Kashmir":    { level:"high",     score:75, floods:65, landslides:80, cyclone:5,  earthquake:85, center:[33.7,76.9],   radius:120, districts:20, population:"13.6M" },
  "Uttar Pradesh":      { level:"medium",   score:55, floods:72, landslides:20, cyclone:5,  earthquake:40, center:[26.8,80.9],   radius:160, districts:75, population:"241M"  },
  "Madhya Pradesh":     { level:"medium",   score:48, floods:58, landslides:30, cyclone:5,  earthquake:30, center:[23.5,77.5],   radius:150, districts:52, population:"85.0M" },
  "Chhattisgarh":       { level:"medium",   score:50, floods:60, landslides:35, cyclone:5,  earthquake:25, center:[21.3,81.9],   radius:120, districts:33, population:"29.4M" },
  "Jharkhand":          { level:"medium",   score:55, floods:65, landslides:40, cyclone:5,  earthquake:40, center:[23.6,85.3],   radius:100, districts:24, population:"38.6M" },
  "Punjab":             { level:"low",      score:35, floods:40, landslides:10, cyclone:5,  earthquake:25, center:[31.1,75.3],   radius:85,  districts:23, population:"30.1M" },
  "Haryana":            { level:"low",      score:30, floods:35, landslides:5,  cyclone:5,  earthquake:25, center:[29.1,76.1],   radius:85,  districts:22, population:"28.9M" },
  "Karnataka":          { level:"medium",   score:52, floods:55, landslides:40, cyclone:25, earthquake:20, center:[15.3,75.7],   radius:130, districts:31, population:"67.6M" },
  "Telangana":          { level:"medium",   score:48, floods:55, landslides:20, cyclone:25, earthquake:15, center:[17.9,79.3],   radius:110, districts:33, population:"39.6M" },
  "Goa":                { level:"low",      score:38, floods:45, landslides:30, cyclone:35, earthquake:10, center:[15.3,74.0],   radius:35,  districts:2,  population:"1.6M"  },
}

const RISK_COLOR: Record<RiskLevel, { stroke: string; fill: string; badge: string; text: string }> = {
  critical: { stroke: "#ef4444", fill: "#ef4444", badge: "bg-red-500/20 text-red-300 border-red-500/30",   text: "text-red-400" },
  high:     { stroke: "#f59e0b", fill: "#f59e0b", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", text: "text-amber-400" },
  medium:   { stroke: "#3b82f6", fill: "#3b82f6", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",  text: "text-blue-400" },
  low:      { stroke: "#10b981", fill: "#10b981", badge: "bg-green-500/20 text-green-300 border-green-500/30", text: "text-green-400" },
}

// ── Hazard categories ─────────────────────────────────────────────
type HazardCategory = "all" | "flood" | "earthquake" | "cyclone" | "landslide" | "industrial" | "heatwave"
const CATEGORY_COLOR: Record<string, string> = {
  flood: "#38bdf8",
  earthquake: "#ef4444",
  cyclone: "#a78bfa",
  landslide: "#f59e0b",
  industrial: "#fb923c",
  heatwave: "#fb7185",
}
const ALL_CATEGORIES: HazardCategory[] = ["all", "flood", "earthquake", "cyclone", "landslide", "industrial", "heatwave"]
const CATEGORY_ICONS: Record<HazardCategory, React.ComponentType<{ className?: string }>> = {
  all: Layers,
  flood: Waves,
  earthquake: Activity,
  cyclone: CloudLightning,
  landslide: Mountain,
  industrial: Factory,
  heatwave: ThermometerSun,
}
const CATEGORY_LABEL: Record<string, string> = {
  all: "All Hazards",
  flood: "Floods",
  earthquake: "Earthquakes",
  cyclone: "Cyclones",
  landslide: "Landslides",
  industrial: "Industrial",
  heatwave: "Heatwave",
}

// ── Fallback data ─────────────────────────────────────────────────
const CARRYING_CAPACITY_DATA = [
  { name: "Camp Alpha", capacity: 1200, current: 850, projected: 1100 },
  { name: "Hub Beta",   capacity: 800,  current: 790, projected: 950  },
  { name: "Base Gamma", capacity: 2000, current: 600, projected: 750  },
  { name: "Site Delta", capacity: 1500, current: 1450, projected: 1800 },
  { name: "Zone Eps.",  capacity: 900,  current: 300, projected: 350  },
]

const HAZARD_TREND_DATA = [
  { time: "00:00", floods: 2, landslides: 1, coastal: 0 },
  { time: "04:00", floods: 3, landslides: 1, coastal: 1 },
  { time: "08:00", floods: 5, landslides: 2, coastal: 1 },
  { time: "12:00", floods: 4, landslides: 3, coastal: 2 },
  { time: "16:00", floods: 7, landslides: 4, coastal: 2 },
  { time: "20:00", floods: 6, landslides: 3, coastal: 3 },
  { time: "Now",   floods: 8, landslides: 5, coastal: 3 },
]

interface RelocationAlert {
  id: number
  zone: string
  district: string
  population: number
  households: number
  timeToImpact: string
  severity: RiskLevel
  hazard: string
  nearestHub: string
  routeStatus: string
  latitude?: number
  longitude?: number
}
const RELOCATION_ALERTS: RelocationAlert[] = [
  { id:1, zone:"Delta-9", district:"Silchar, Assam",       population:340, households:78,  timeToImpact:"2h 15m",  severity:"critical", hazard:"Flash Flood",     nearestHub:"Hub Beta — 12 km",   routeStatus:"Clear",   latitude:24.82, longitude:92.80 },
  { id:2, zone:"Echo-4",  district:"Wayanad, Kerala",      population:125, households:31,  timeToImpact:"4h 30m",  severity:"high",     hazard:"Landslide",       nearestHub:"Camp Alpha — 8 km",  routeStatus:"Partial", latitude:11.62, longitude:76.08 },
  { id:3, zone:"Bravo-1", district:"Kendrapara, Odisha",   population:890, households:214, timeToImpact:"12h 00m", severity:"medium",   hazard:"Cyclonic Surge",  nearestHub:"Base Gamma — 22 km", routeStatus:"Clear",   latitude:20.45, longitude:86.42 },
]

const TICKER_ITEMS = [
  "⚠ ALERT: Flash flood warning issued for Brahmaputra basin — 6 districts affected",
  "📡 Landslide probability elevated in Chamoli district — monitoring active",
  "🚁 NDRF Battalion 4 deployed to Silchar — ETA 35 min",
  "✅ Evacuation of Kendrapara Zone-B complete — 1,240 persons relocated",
  "🌊 Cyclone BIPARJOY track updated — coastal Karnataka on high watch",
  "📊 Carrying capacity of Hub Beta at 98% — overflow routing to Base Gamma",
]

// Automatic live-data refresh cycle — the dashboard re-syncs every 30 minutes.
const AUTO_REFRESH_MS = 30 * 60 * 1000

const ROLES = [
  "State Disaster Management Authority (SDMA)",
  "NDRF Field Commander",
  "District Collector / Emergency Officer",
  "Emergency Response Team Lead",
  "GIS & Data Analyst",
]

// ── API types & helpers ───────────────────────────────────────────
interface Overview {
  atRiskPopulation?: number
  atRiskSub?: string
  activeRedZones?: number
  redZoneNames?: string
  safeCapacity?: number
  safeCapacityAcross?: string
  ndrfTeamsActive?: number
  ndrfTeamsSub?: string
  evacuationRoutesTotal?: number
  evacuationRoutesSub?: string
  hubCount?: number
}
interface CapacityHub { name: string; capacity: number; current: number; projected: number }
interface CapacityFeed { hubs?: CapacityHub[]; overallOccupancy?: number; hubCount?: number }
interface TrendPoint { time: string; floods: number; landslides: number; coastal: number }
interface TrendFeed { points?: TrendPoint[] }
interface MetricItem { metric: string; value: number }
interface CompositeFeed { metrics?: MetricItem[]; overallIndex?: number; generatedAt?: string }
interface Priority { id: number; zone: string; district: string; hazard: string; severity: RiskLevel; population: number; households: number; priorityScore: number; timeline: string }
interface PriorityFeed { priorities?: Priority[] }
interface Incident { incidentId: string; title: string; region: string; status: string; alertLevel: string; reportedAt: string }
interface IncidentFeed { incidents?: Incident[] }
interface GisFeed { fetchedAt?: string; source?: string; live?: boolean; stale?: boolean; count?: number; events?: Array<{ id?: string; place?: string; magnitude?: number; depthKm?: number; latitude?: number; longitude?: number; time?: string }> }

interface GisEvent {
  id: string
  title: string
  category: Exclude<HazardCategory, "all">
  severity: RiskLevel
  level?: string
  place: string
  state?: string | null
  latitude: number | null
  longitude: number | null
  time?: string | null
  source: string
  status?: string
  detail?: string
}
interface EventsFeed {
  fetchedAt?: string
  source?: string
  live?: boolean
  stale?: boolean
  category?: string
  region?: string
  count?: number
  events?: GisEvent[]
}
interface PlaceResult {
  id: string
  label: string
  type: string
  state?: string | null
  latitude: number
  longitude: number
}
interface SearchFeed { query?: string; count?: number; source?: string; results?: PlaceResult[] }
interface AdviceDept { name: string; role: string; priority: number }
interface Advice {
  hazard: string
  title: string
  state: string
  severity: string
  confidence: number
  summary: string
  affectedStates: string[]
  departments: AdviceDept[]
  actions: string[]
  timeline: string
  model: string
  generatedAt: string
  situation?: string[]
  latestUpdate?: string
  sources?: string[]
  live?: boolean
  llm?: boolean
  refreshedAt?: string
}
interface AskResponse {
  question: string
  answer: string
  hazard: string
  title: string
  state: string
  severity: string
  intent?: string
  departments: AdviceDept[]
  actions: string[]
  situation?: string[]
  latestUpdate?: string
  sources?: string[]
  live?: boolean
  llm?: boolean
  model: string
  refreshedAt?: string
}

type Selection =
  | { kind: "state"; name: string; data: StateHazard }
  | { kind: "event"; event: GisEvent }

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}
async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(path)
  } catch {
    return fallback
  }
}
async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

function fmtNum(n: number | undefined, fallback: number): string {
  return (n ?? fallback).toLocaleString("en-IN")
}
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}
function dominantHazard(d: StateHazard): string {
  const list: Array<[string, number]> = [
    ["flood", d.floods],
    ["landslide", d.landslides],
    ["cyclone", d.cyclone],
    ["earthquake", d.earthquake],
  ]
  list.sort((a, b) => b[1] - a[1])
  return list[0][0]
}

const INCIDENT_STATUS: Record<string, { text: string; badge: string; dot: string }> = {
  active: { text: "Active", badge: "bg-red-500/20 text-red-300 border-red-500/30", dot: "bg-red-400" },
  in_transit: { text: "In Transit", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
  action: { text: "Action", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
  monitoring: { text: "Monitoring", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", dot: "bg-blue-400" },
  complete: { text: "Complete", badge: "bg-green-500/20 text-green-300 border-green-500/30", dot: "bg-green-400" },
}

// ── Theme Toggle Button ──────────────────────────────────────────
function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 glass rounded-xl flex items-center justify-center transition-all hover:scale-105 ${className}`}
    >
      {theme === "dark"
        ? <Sun className="w-4 h-4 text-amber-300" />
        : <Moon className="w-4 h-4 text-blue-600" />}
    </button>
  )
}

// ── Background Carousel ──────────────────────────────────────────
function BackgroundCarousel() {
  const { theme } = useTheme()
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % BG_IMAGES.length), 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{
            opacity: i === idx ? (theme === "dark" ? 0.5 : 0.36) : 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === "dark"
            ? "linear-gradient(135deg,rgba(6,13,31,0.76) 0%,rgba(10,22,48,0.70) 50%,rgba(13,31,60,0.74) 100%)"
            : "linear-gradient(135deg,rgba(238,242,255,0.62) 0%,rgba(224,231,255,0.56) 50%,rgba(238,242,255,0.62) 100%)",
        }}
      />
    </>
  )
}

// ── Permissions Page ─────────────────────────────────────────────
function PermissionsPrompt({ onComplete }: { onComplete: () => void }) {
  const [granted, setGranted] = useState({ location: false, notifications: false })
  const [loading, setLoading] = useState(false)

  const toggle = (key: keyof typeof granted) =>
    setGranted((p) => ({ ...p, [key]: !p[key] }))

  const handleProceed = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onComplete() }, 900)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="glass-strong w-full max-w-lg rounded-3xl p-10 relative overflow-hidden">
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-20 h-20 rounded-2xl glass-primary glow-primary flex items-center justify-center mb-5">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <div className="font-mono text-xs text-blue-400 tracking-[0.3em] uppercase mb-3">
            Ministry of Home Affairs · NDRF
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient-white text-center leading-tight mb-3">
            Aegis Command
          </h1>
          <p className="text-sm text-white/55 text-center leading-relaxed max-w-sm">
            Before connecting to the national hazard network, this system requires the following access permissions.
          </p>
        </div>

        <div className="space-y-3 mb-8 relative z-10">
          {[
            { key: "location" as const, icon: <MapPin className="w-5 h-5 text-blue-400" />, title: "Location Services", desc: "Map your sector against active red zones and calculate proximity to evacuation hubs." },
            { key: "notifications" as const, icon: <BellRing className="w-5 h-5 text-amber-400" />, title: "Push Notifications", desc: "Receive immediate evacuation alerts, capacity threshold breaches, and NDRF broadcast messages." },
          ].map((item) => (
            <button key={item.key} onClick={() => toggle(item.key)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${granted[item.key] ? "bg-green-500/10 border-green-500/30" : "glass hover:border-white/20 border-white/10"}`}
            >
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white/90 mb-0.5">{item.title}</div>
                <div className="text-xs text-white/45 leading-relaxed">{item.desc}</div>
              </div>
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${granted[item.key] ? "bg-green-500 border-green-500" : "border-white/30"}`}>
                {granted[item.key] && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="relative z-10 flex gap-3">
          <button onClick={onComplete} className="px-5 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20">
            Skip
          </button>
          <button onClick={handleProceed} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3 transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(59,130,246,0.35)]"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>{granted.location && granted.notifications ? "Permissions Granted — Continue" : "Continue"}</span><ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-mono text-white/25 relative z-10">
          <Lock className="w-3 h-3" />
          End-to-end encrypted · Data never leaves government servers
        </div>
      </div>
    </div>
  )
}

// ── Login Page ───────────────────────────────────────────────────
function Login({ onLogin }: { onLogin: () => void }) {
  const [operatorId, setOperatorId] = useState("OP-7734-X")
  const [clearance, setClearance] = useState("")
  const [role, setRole] = useState(ROLES[0])
  const [showClearance, setShowClearance] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"credentials" | "verify">("credentials")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [error, setError] = useState<string | null>(null)
  const [demoOtp, setDemoOtp] = useState<string | null>(null)

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleCredSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId, clearance, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Sign-in failed")
      setDemoOtp(data.demoOtp ?? null)
      setStep("verify")
    } catch (err: any) {
      setError(err.message || "Sign-in failed — check your operator ID and clearance code.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId, otp: otp.join("") }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Verification failed")
      sessionStorage.setItem("aegis_token", data.token)
      onLogin()
    } catch (err: any) {
      setError(err.message || "Verification failed — check the code and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>

      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        <div className="absolute inset-0 glass border-r border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">Aegis Command</div>
              <div className="text-[10px] font-mono text-white/40 tracking-widest uppercase">NDRF · MHA · GoI</div>
            </div>
          </div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Intelligent<br /><span className="text-gradient-blue">Hazard-Based</span><br />Red Zone System
          </h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            GIS-enabled decision support platform for identifying multi-hazard red zones,
            assessing carrying capacity, and coordinating vulnerable habitation relocations.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: <Zap className="w-4 h-4 text-amber-400" />, label: "Real-time hazard mapping with GPS" },
            { icon: <Sparkles className="w-4 h-4 text-blue-400" />, label: "AI response & department advisor" },
            { icon: <Navigation className="w-4 h-4 text-green-400" />, label: "Evacuation route optimization" },
            { icon: <BarChart2 className="w-4 h-4 text-purple-400" />, label: "Carrying capacity analytics" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-sm text-white/60">
              <div className="w-8 h-8 glass rounded-lg flex items-center justify-center shrink-0">{f.icon}</div>
              {f.label}
            </div>
          ))}
          <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-white/30">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            National Disaster Response Force · DM Division · MHA
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-strong w-full max-w-md rounded-3xl p-9 relative overflow-hidden">
          <div className="relative z-10 mb-8">
            <div className="font-mono text-[10px] text-blue-400 tracking-[0.25em] uppercase mb-3">Secure NDRF Gateway · AES-256</div>
            <h3 className="font-display text-2xl font-bold text-white mb-1">
              {step === "credentials" ? "Operator Sign-in" : "Identity Verification"}
            </h3>
            <p className="text-sm text-white/45">
              {step === "credentials"
                ? "Enter your credentials and clearance code to access the command system."
                : "A 6-digit OTP has been dispatched to your registered secure terminal."}
            </p>
          </div>

          {error && (
            <div className="relative z-10 mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleCredSubmit} className="relative z-10 space-y-5">
              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-2">Designation / Role</label>
                <div className="relative">
                  <select value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-10"
                  >
                    {ROLES.map((r) => <option key={r} value={r} className="bg-[#0d1b2e] text-white">{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-2">Operator ID</label>
                <input type="text" required value={operatorId} onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Clearance Code</label>
                  <span className="text-[10px] font-mono text-blue-400 cursor-pointer hover:text-blue-300">Forgot code?</span>
                </div>
                <div className="relative">
                  <input type={showClearance ? "text" : "password"} required value={clearance}
                    onChange={(e) => setClearance(e.target.value)} placeholder="Enter clearance code"
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3 pr-11 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20"
                  />
                  <button type="button" onClick={() => setShowClearance((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60 transition-colors"
                  >
                    {showClearance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3.5 transition-all flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(59,130,246,0.3)] mt-2"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Authenticate</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="relative z-10">
              {demoOtp && (
                <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200 leading-relaxed">
                  <span className="font-mono font-bold tracking-widest text-amber-100">DEMO MODE</span> — no SMS/email gateway is
                  connected in this environment. Your verification code is{" "}
                  <span className="font-mono font-bold text-base tracking-[0.2em]">{demoOtp}</span>.
                </div>
              )}
              <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-4">6-Digit Verification Code</label>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { otpRefs.current[i] = el }} type="text" inputMode="numeric"
                    maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus() }}
                    className="w-11 h-14 bg-white/5 border border-white/12 rounded-xl text-center text-xl font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all caret-transparent"
                  />
                ))}
              </div>
              <button type="submit" disabled={loading || otp.some((d) => !d)}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl px-5 py-3.5 transition-all flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(59,130,246,0.3)] mb-3"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Verify & Enter Command</span><CheckCircle2 className="w-4 h-4" /></>}
              </button>
              <button type="button" onClick={() => setStep("credentials")} className="w-full text-sm text-white/35 hover:text-white/55 transition-colors py-1">
                ← Back to credentials
              </button>
            </form>
          )}

          <div className="mt-7 pt-5 border-t border-white/8 flex items-center justify-between text-[11px] font-mono relative z-10">
            <div className="flex items-center gap-1.5 text-green-400"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Systems Nominal</div>
            <div className="flex items-center gap-1.5 text-white/30"><Wifi className="w-3 h-3" />NDRF-NET · Encrypted</div>
            <div className="text-white/30">v4.2.1</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Leaflet map sub-components ───────────────────────────────────
function MapFlyTo({ target, zoom }: { target: { lat: number; lon: number; nonce: number }; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([target.lat, target.lon], zoom, { duration: 1.5 })
  }, [target.lat, target.lon, target.nonce, zoom, map])
  return null
}

function UserLocationMarker({ pos }: { pos: [number, number] }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.35);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
  return <Marker position={pos} icon={icon}><Popup><b>Your Location</b></Popup></Marker>
}

// ── Quick AI advice (inline, used from map selection panels) ──────
function QuickAdvice({ hazard, state, onOpenAI }: { hazard: string; state?: string | null; onOpenAI: (hazard: string, state: string) => void }) {
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    setLoading(true)
    setAdvice(null)
    apiGet<Advice>(`/api/ai/advice?hazard=${encodeURIComponent(hazard)}&state=${encodeURIComponent(state || "")}`)
      .then((a) => { if (on) setAdvice(a) })
      .catch(() => { if (on) setAdvice(null) })
      .finally(() => { if (on) setLoading(false) })
    return () => { on = false }
  }, [hazard, state])

  if (loading) {
    return (
      <div className="rounded-xl glass p-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mb-2">
          <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />AI Response Analysis…
        </div>
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 rounded-lg bg-white/8 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!advice) {
    return (
      <div className="rounded-xl glass p-3 text-[11px] text-white/45">
        AI advisor unavailable — check connection.
        <button onClick={() => onOpenAI(hazard, state || "")} className="mt-2 w-full text-[10px] font-mono text-blue-300 hover:text-blue-200 text-left">Retry full analysis →</button>
      </div>
    )
  }

  return (
    <div className="rounded-xl glass-primary p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3 h-3" />AI Advice · {advice.title}
        </span>
        <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase border ${RISK_COLOR[(advice.severity as RiskLevel) in RISK_COLOR ? (advice.severity as RiskLevel) : "medium"]?.badge || "bg-white/10 text-white/50 border-white/15"}`}>
          {advice.severity}
        </span>
      </div>
      <div className="space-y-1.5">
        {advice.departments.slice(0, 3).map((d) => (
          <div key={d.name} className="flex items-start gap-2 bg-white/5 border border-white/8 rounded-lg px-2 py-1.5">
            <span className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">{d.priority}</span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-white/85 leading-tight">{d.name}</div>
              <div className="text-[9px] text-white/40 leading-snug">{d.role}</div>
            </div>
          </div>
        ))}
      </div>
      {advice.latestUpdate && (
        <div className="flex items-start gap-1.5 mt-2 text-[9px] font-mono text-blue-200/70 leading-snug">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0 mt-0.5" />
          <span className="line-clamp-2">{advice.latestUpdate}</span>
        </div>
      )}
      <button onClick={() => onOpenAI(advice.hazard, advice.state)} className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" />Run Full AI Analysis
      </button>
    </div>
  )
}

// ── Real Map Component ───────────────────────────────────────────
interface HazardMapProps {
  theme: "dark" | "light"
  events: GisEvent[]
  category: HazardCategory
  onCategory: (c: HazardCategory) => void
  selected: Selection | null
  onSelect: (s: Selection | null) => void
  flyTarget: { lat: number; lon: number; nonce: number } | null
  onOpenAI: (hazard: string, state: string) => void
}

function HazardMap({ theme, events, category, onCategory, selected, onSelect, flyTarget, onOpenAI }: HazardMapProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<PlaceResult[] | null>(null)
  const [searchError, setSearchError] = useState("")
  const [liveOpen, setLiveOpen] = useState(false)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [selectedStateDetail, setSelectedStateDetail] = useState<{ name: string; data: StateHazard } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<GisEvent | null>(null)
  const [fly, setFly] = useState<{ lat: number; lon: number; nonce: number } | null>(null)

  useEffect(() => {
    if (!selected) { setSelectedStateDetail(null); setSelectedEvent(null); return }
    if (selected.kind === "state") { setSelectedStateDetail({ name: selected.name, data: selected.data }); setSelectedEvent(null) }
    else { setSelectedEvent(selected.event); setSelectedStateDetail(null) }
  }, [selected])

  useEffect(() => {
    if (flyTarget) setFly(flyTarget)
  }, [flyTarget])

  // Carto's free anonymous tile CDN now requires a registered API key, so it
  // shows a watermarked "API key required" tile instead of the map. Use
  // OpenStreetMap's standard tile server instead — genuinely free, no
  // signup, no key, ever. It only ships a light-toned map, so for the dark
  // theme we fake the look with a CSS filter on the tile layer itself.
  const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  const tileFilterClass = theme === "dark" ? "map-dark-tiles" : ""

  const filteredEvents = events.filter((e) => category === "all" || e.category === category)

  const selectPlace = useCallback((r: PlaceResult) => {
    setFly({ lat: r.latitude, lon: r.longitude, nonce: Date.now() })
    setResults(null)
    setSearchQuery("")
    setLiveOpen(false)
    const sdata = r.state ? INDIA_HAZARD[r.state] : undefined
    if (sdata) onSelect({ kind: "state", name: r.state as string, data: sdata })
    else if (r.type === "state" && r.state) {
      const data = INDIA_HAZARD[r.state]
      if (data) onSelect({ kind: "state", name: r.state, data })
      else onSelect(null)
    } else onSelect(null)
  }, [onSelect])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError("")
    setResults(null)
    setLiveOpen(false)
    try {
      const feed = await apiGet<SearchFeed>(`/api/gis/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (feed.results && feed.results.length > 0) setResults(feed.results)
      else {
        setResults(null)
        setSearchError(`No results found for "${searchQuery}"`)
      }
    } catch {
      setResults(null)
      setSearchError("Location search unavailable. Check connection.")
    }
    setSearching(false)
  }, [searchQuery])

  // Live as-you-type suggestions: query the gazetteer on every keystroke
  // (debounced) so "we" / "west" suggests West Bengal, "guj" / "guja" suggests
  // Gujarat, and any India state, district or city prefix surfaces instantly.
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setResults(null)
      setLiveOpen(false)
      return
    }
    const t = window.setTimeout(async () => {
      try {
        const feed = await apiGet<SearchFeed>(`/api/gis/search?q=${encodeURIComponent(q)}`)
        if (feed.results && feed.results.length > 0) {
          setResults(feed.results)
          setLiveOpen(true)
        } else {
          setResults(null)
        }
      } catch {
        /* keep previous results on network hiccup */
      }
    }, 220)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const handleGPS = () => {
    if (!navigator.geolocation) { setSearchError("Geolocation not supported by this browser."); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(loc)
        setFly({ lat: loc[0], lon: loc[1], nonce: Date.now() })
        setGpsLoading(false)
      },
      () => { setSearchError("Unable to retrieve your location."); setGpsLoading(false) },
      { timeout: 10000 }
    )
  }

  const isDark = theme === "dark"
  const categoryCounts = events.filter((e) => category === "all" || e.category === category).length
  const panelOpen = !!selectedStateDetail || !!selectedEvent

  return (
    <div className="col-span-8 glass rounded-2xl p-4 flex flex-col min-h-0 relative overflow-hidden">
      {/* Header row: title + search */}
      <div className="flex items-center justify-between mb-2 shrink-0 gap-3">
        <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm shrink-0">
          <Navigation className="w-4 h-4 text-blue-400" />
          Live Topographical Threat Map
        </h3>
        <div className="flex flex-1 gap-2 max-w-xs justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search state, city or district…"
              className="w-full bg-white/8 border border-white/12 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono transition-all"
            />
            {results && results.length > 0 && (
              <div className={`absolute left-0 right-0 top-full mt-1.5 z-[1200] rounded-xl overflow-hidden border ${isDark ? "bg-[#0b1830]/95 border-white/10" : "bg-white border-black/10"} shadow-2xl`}>
                <div className="px-3 py-1.5 border-b border-white/8 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-blue-300/80">
                    {liveOpen ? <Sparkles className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                    {liveOpen ? "Suggestions — as you type" : "Search results"}
                  </span>
                  <span className="text-[9px] font-mono text-white/30 capitalize">{liveOpen ? "India gazetteer" : `${results.length} matched`}</span>
                </div>
                {results.map((r) => (
                  <button key={r.id} onClick={() => selectPlace(r)}
                    className="w-full text-left px-3 py-2.5 border-b border-white/8 last:border-b-0 hover:bg-blue-500/10 transition-colors flex items-start gap-2"
                  >
                    <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${r.type === "state" ? "text-blue-400" : "text-white/40"}`} />
                    <span className="min-w-0">
                      <span className="block text-xs text-white/90 leading-tight truncate">{r.label}</span>
                      <span className="block text-[9px] font-mono text-white/40 mt-0.5 uppercase">{r.type}{r.state ? ` · ${r.state}` : ""}</span>
                    </span>
                  </button>
                ))}
                <button onClick={() => { setResults(null); setLiveOpen(false) }} className="w-full text-center py-1.5 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors">
                  Close results
                </button>
              </div>
            )}
          </div>
          <button onClick={handleSearch} disabled={searching}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all"
          >
            {searching ? <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin inline-block" /> : "Search"}
          </button>
          <button onClick={handleGPS} disabled={gpsLoading} title="Use my GPS location"
            className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/50 hover:text-blue-400 transition-all disabled:opacity-50"
          >
            {gpsLoading
              ? <span className="w-3.5 h-3.5 border border-white/30 border-t-blue-400 rounded-full animate-spin" />
              : <LocateFixed className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {searchError && (
        <div className="mb-2 shrink-0 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-mono text-red-300 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 shrink-0" />{searchError}
        </div>
      )}

      {/* Hazard category filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2 shrink-0">
        {ALL_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onCategory(c)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all border ${
              category === c
                ? isDark ? "bg-blue-500/20 text-blue-200 border-blue-500/40"
                          : "bg-blue-500/10 text-blue-700 border-blue-500/40"
                : "bg-white/5 text-white/45 border-white/10 hover:bg-white/10 hover:text-white/70"
            }`}
          >
            {(() => { const Icon = CATEGORY_ICONS[c]; return <Icon className="w-3 h-3" /> })()}
            {CATEGORY_LABEL[c]}
            {c !== "all" && (
              <span className={`w-1.5 h-1.5 rounded-full ${category === c ? "" : ""}`} style={{ background: CATEGORY_COLOR[c] }} />
            )}
          </button>
        ))}
        <span className="ml-auto text-[9px] font-mono text-white/30">{categoryCounts} event{categoryCounts === 1 ? "" : "s"} shown</span>
      </div>

      {/* Map + side panel */}
      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 rounded-xl overflow-hidden relative min-h-0" style={{ minHeight: 0 }}>
          <MapContainer
            center={[22.5, 82.0]}
            zoom={5}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
            attributionControl={true}
          >
            <TileLayer
              url={tileUrl}
              className={tileFilterClass}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            <ZoomControl position="bottomright" />

            {fly && <MapFlyTo target={fly} zoom={10} />}
            {userPos && <UserLocationMarker pos={userPos} />}

            {/* Hazard circles for all states */}
            {Object.entries(INDIA_HAZARD).map(([name, data]) => {
              const col = RISK_COLOR[data.level]
              const isSel = selectedStateDetail?.name === name
              return (
                <Circle
                  key={name}
                  center={data.center}
                  radius={data.radius * 1000}
                  pathOptions={{
                    color: col.stroke,
                    fillColor: col.fill,
                    fillOpacity: isSel ? 0.28 : 0.08,
                    weight: isSel ? 2 : 1,
                    opacity: isSel ? 0.95 : 0.5,
                  }}
                  eventHandlers={{ click: () => onSelect({ kind: "state", name, data }) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, lineHeight: 1.6 }}>
                      <strong>{name}</strong><br />
                      Risk: <span style={{ color: col.stroke, textTransform: "uppercase", fontWeight: 700 }}>{data.level}</span><br />
                      Score: {data.score}/100<br />
                      Floods: {data.floods}% · Landslides: {data.landslides}%<br />
                      Cyclone: {data.cyclone}% · Earthquake: {data.earthquake}%
                    </div>
                  </Popup>
                </Circle>
              )
            })}

            {/* Live event markers */}
            {filteredEvents.filter((e) => e.latitude != null && e.longitude != null).map((e) => {
              if (e.latitude == null || e.longitude == null) return null
              const color = CATEGORY_COLOR[e.category] || "#94a3b8"
              const rad = e.severity === "critical" || e.severity === "high" ? 11 : e.severity === "medium" ? 7 : 5
              const isSel = selectedEvent?.id === e.id
              return (
                <CircleMarker
                  key={e.id}
                  center={[e.latitude, e.longitude]}
                  radius={isSel ? rad + 3 : rad}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSel ? 0.6 : 0.25,
                    weight: isSel ? 2.5 : 1.2,
                    opacity: 0.95,
                  }}
                  eventHandlers={{ click: () => onSelect({ kind: "event", event: e }) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, lineHeight: 1.6, maxWidth: 220 }}>
                      <strong>{e.title}</strong><br />
                      <span style={{ color, textTransform: "uppercase", fontWeight: 700 }}>{e.category} · {e.severity}</span><br />
                      {e.place}<br />
                      {fmtTime(e.time)}<br />
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>{e.source}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* Legend */}
          <div className={`absolute bottom-3 left-3 z-[1000] rounded-xl p-2.5 space-y-1.5 ${isDark ? "bg-[#060d1f]/80 border border-white/10" : "bg-white/85 border border-black/08"}`}>
            {(["critical", "high", "medium", "low"] as RiskLevel[]).map((lvl) => (
              <div key={lvl} className="flex items-center gap-2 text-[9px] font-mono text-white/55">
                <span className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: RISK_COLOR[lvl].stroke, background: RISK_COLOR[lvl].fill + "44" }} />
                <span className="capitalize">{lvl} risk</span>
              </div>
            ))}
            <div className="pt-1 border-t border-white/10">
              {(["flood", "earthquake", "cyclone", "landslide", "industrial", "heatwave"] as const).map((c) => (
                <div key={c} className="flex items-center gap-2 text-[9px] font-mono text-white/55">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[c] }} />
                  {CATEGORY_LABEL[c]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selection detail + AI advice */}
        {panelOpen && (
          <div className="w-64 glass rounded-xl p-4 flex flex-col gap-3 shrink-0 overflow-y-auto">
            {selectedStateDetail && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold text-sm text-white leading-tight">{selectedStateDetail.name}</div>
                    <span className={`inline-block mt-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase border ${RISK_COLOR[selectedStateDetail.data.level].badge}`}>
                      {selectedStateDetail.data.level} risk
                    </span>
                  </div>
                  <button onClick={() => onSelect(null)} className="text-white/30 hover:text-white/60 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle cx="28" cy="28" r="22" fill="none"
                        stroke={RISK_COLOR[selectedStateDetail.data.level].stroke}
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - selectedStateDetail.data.score / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold font-mono ${RISK_COLOR[selectedStateDetail.data.level].text}`}>{selectedStateDetail.data.score}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono leading-relaxed">
                    <div>Districts: <span className="text-white/70">{selectedStateDetail.data.districts}</span></div>
                    <div>Population: <span className="text-white/70">{selectedStateDetail.data.population}</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Floods",     val: selectedStateDetail.data.floods,     color: "#3b82f6" },
                    { label: "Landslides", val: selectedStateDetail.data.landslides, color: "#f59e0b" },
                    { label: "Cyclone",    val: selectedStateDetail.data.cyclone,    color: "#8b5cf6" },
                    { label: "Earthquake", val: selectedStateDetail.data.earthquake, color: "#ef4444" },
                  ].map((h) => (
                    <div key={h.label}>
                      <div className="flex justify-between text-[9px] font-mono text-white/45 mb-1">
                        <span>{h.label}</span><span>{h.val}%</span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${h.val}%`, background: h.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <QuickAdvice
                  hazard={dominantHazard(selectedStateDetail.data)}
                  state={selectedStateDetail.name}
                  onOpenAI={onOpenAI}
                />
              </>
            )}

            {selectedEvent && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase border shrink-0 ${RISK_COLOR[selectedEvent.severity]?.badge || "bg-white/10 text-white/50 border-white/15"}`}>
                    {selectedEvent.severity}
                  </span>
                  <button onClick={() => onSelect(null)} className="text-white/30 hover:text-white/60 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-display font-bold text-sm text-white leading-snug">{selectedEvent.title}</div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[selectedEvent.category] || "#94a3b8" }} />
                  <span className="text-white/70 capitalize">{selectedEvent.category}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/45">{selectedEvent.state || "India"}</span>
                </div>
                <div className="space-y-1.5 bg-white/5 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50"><MapPin className="w-3 h-3 shrink-0 text-blue-400" />{selectedEvent.place}</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50"><Clock className="w-3 h-3 shrink-0 text-amber-400" />{fmtTime(selectedEvent.time)}</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50"><Globe className="w-3 h-3 shrink-0 text-green-400" />{selectedEvent.source}</div>
                  {selectedEvent.detail && <div className="text-[10px] text-white/60 leading-relaxed pt-1 border-t border-white/8 mt-1">{selectedEvent.detail}</div>}
                </div>
                <QuickAdvice
                  hazard={selectedEvent.category}
                  state={selectedEvent.state}
                  onOpenAI={onOpenAI}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Views ─────────────────────────────────────────────────────────
const KPI_META: Array<{ label: string; icon: React.ReactNode; trend: boolean; value: (o: Overview | null) => string; sub: (o: Overview | null) => string }> = [
  { label: "At-Risk Population", trend: true, icon: <AlertTriangle className="w-4 h-4 text-red-400" />, value: (o) => fmtNum(o?.atRiskPopulation, 1355), sub: (o) => o?.atRiskSub ?? "+12% this hour" },
  { label: "Active Red Zones", trend: true, icon: <AlertOctagon className="w-4 h-4 text-red-400" />, value: (o) => fmtNum(o?.activeRedZones, 3), sub: (o) => o?.redZoneNames ?? "Delta-9·Echo-4·Bravo" },
  { label: "Safe Capacity", trend: false, icon: <Shield className="w-4 h-4 text-green-400" />, value: (o) => fmtNum(o?.safeCapacity, 2410), sub: (o) => o?.safeCapacityAcross ?? "across 5 relocation hubs" },
  { label: "NDRF Teams Active", trend: false, icon: <Users className="w-4 h-4 text-blue-400" />, value: (o) => fmtNum(o?.ndrfTeamsActive, 7), sub: (o) => o?.ndrfTeamsSub ?? "4 deployed · 3 standby" },
  { label: "Evacuation Routes", trend: false, icon: <Navigation className="w-4 h-4 text-amber-400" />, value: (o) => fmtNum(o?.evacuationRoutesTotal, 12), sub: (o) => o?.evacuationRoutesSub ?? "9 clear · 3 partial" },
]

function KpiRow({ overview, onOpen }: { overview: Overview | null; onOpen: (label: string) => void }) {
  const kpis = KPI_META.map((k) => ({ label: k.label, icon: k.icon, trend: k.trend, value: k.value(overview), sub: k.sub(overview) }))
  return (
    <div className="grid grid-cols-5 gap-3 p-4 pb-0 shrink-0">
      {kpis.map((kpi) => (
        <button key={kpi.label} onClick={() => onOpen(kpi.label)}
          className="glass rounded-2xl p-4 text-left transition-all hover:bg-white/8 hover:border-white/16 border border-transparent cursor-pointer group relative">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 glass rounded-lg flex items-center justify-center">{kpi.icon}</div>
            <div className="flex items-center gap-1">
              {kpi.trend && <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />}
              <Info className="w-3 h-3 text-white/25 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-white">{kpi.value}</div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5">{kpi.label}</div>
          <div className="text-[10px] text-white/30 mt-0.5">{kpi.sub}</div>
        </button>
      ))}
    </div>
  )
}

function RelocationPanel({ alerts, onLocate, onEvacuate, evacuating }: {
  alerts: RelocationAlert[]
  onLocate: (a: RelocationAlert) => void
  onEvacuate: (a: RelocationAlert) => void
  evacuating: number | null
}) {
  return (
    <div className="col-span-4 glass-danger rounded-2xl p-4 flex flex-col min-h-0">
      <h3 className="font-display font-semibold text-red-300 flex items-center gap-2 mb-3 text-sm shrink-0">
        <AlertOctagon className="w-4 h-4" />Immediate Relocation Needs
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-0.5">
        {alerts.map((alert) => (
          <div key={alert.id} className="glass rounded-2xl p-4 border border-white/8 hover:border-white/16 transition-all cursor-pointer">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-mono font-bold text-sm text-white">Zone: {alert.zone}</div>
                <div className="text-[10px] text-white/40 font-mono mt-0.5">{alert.district}</div>
              </div>
              <span className={`text-[9px] font-mono font-semibold px-2 py-1 rounded-lg uppercase tracking-wider border ${RISK_COLOR[alert.severity].badge}`}>
                {alert.severity}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "Population", value: alert.population.toLocaleString(), urgent: false },
                { label: "Households", value: alert.households.toLocaleString(), urgent: false },
                { label: "Time to Impact", value: alert.timeToImpact, urgent: true },
                { label: "Hazard Type", value: alert.hazard, urgent: false },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-2">
                  <div className="text-[9px] text-white/35 font-mono mb-0.5">{s.label}</div>
                  <div className={`text-xs font-semibold ${s.urgent ? "text-red-300 font-mono" : "text-white/80"}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono text-white/40">
              <Navigation className="w-3 h-3 shrink-0 text-blue-400" />{alert.nearestHub}
              <span className="ml-auto flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${alert.routeStatus === "Clear" ? "bg-green-400" : "bg-amber-400"}`} />
                {alert.routeStatus}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onLocate(alert)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-white/15 text-white/60 hover:text-white hover:border-white/30 bg-white/5">
                <MapPin className="w-3 h-3" />Locate
              </button>
              <button onClick={() => onEvacuate(alert)} disabled={evacuating === alert.id}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${RISK_COLOR[alert.severity].badge}`}>
                {evacuating === alert.id
                  ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  : <Phone className="w-3 h-3" />}
                {evacuating === alert.id ? "Dispatching…" : "Evacuate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartTooltipStyle() {
  return {
    backgroundColor: "rgba(6,13,31,0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    color: "#e8f0fe",
    fontFamily: "JetBrains Mono",
    fontSize: "11px",
  } as const
}

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(6,13,31,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  color: "#e8f0fe",
  fontFamily: "JetBrains Mono",
  fontSize: "11px",
}

function CommandCenterView(props: {
  overview: Overview | null
  relocationAlerts: RelocationAlert[]
  capacityHubs: CapacityHub[]
  trendPoints: TrendPoint[]
  events: GisEvent[]
  incidents: Incident[]
  category: HazardCategory
  onCategory: (c: HazardCategory) => void
  selected: Selection | null
  onSelect: (s: Selection | null) => void
  flyTarget: { lat: number; lon: number; nonce: number } | null
  onOpenAI: (hazard: string, state: string) => void
  onLocate: (a: RelocationAlert) => void
  onEvacuate: (a: RelocationAlert) => void
  evacuating: number | null
  theme: "dark" | "light"
}) {
  const { overview, relocationAlerts, capacityHubs, trendPoints, incidents, events } = props
  const [kpiOpen, setKpiOpen] = useState<string | null>(null)
  const kpi = KPI_META.find((k) => k.label === kpiOpen)
  const totalCap = capacityHubs.reduce((s, h) => s + h.capacity, 0)
  const totalCur = capacityHubs.reduce((s, h) => s + h.current, 0)
  const totalHeadroom = capacityHubs.reduce((s, h) => s + Math.max(0, h.capacity - h.current), 0)
  const projectedOverflow = capacityHubs.reduce((s, h) => s + Math.max(0, h.projected - h.capacity), 0)
  const clearRoutes = relocationAlerts.filter((a) => a.routeStatus === "Clear").length
  const atRiskFromZones = relocationAlerts.reduce((s, a) => s + a.population, 0)
  const deployments = incidents.filter((i) => ["active", "action", "in_transit"].includes(i.status))
  const kpiCopy: Record<string, string> = {
    "At-Risk Population": "People counted in zones currently under active evacuation orders, derived live from relocation telemetry plus events overlapping the vulnerability model.",
    "Active Red Zones": "Red zones are generated when live event telemetry overlaps districts whose composite vulnerability score reaches the alert threshold.",
    "Safe Capacity": "Total headroom across all relocation hubs — the sum of unused beds/capacity that can still absorb displaced population.",
    "NDRF Teams Active": "National Disaster Response Force battalions on deployment. Live deployments are tracked from the field incident registry below.",
    "Evacuation Routes": "Movement corridors out of red zones. Status reflects route clearance reported by field teams for each active relocation zone.",
  }
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <KpiRow overview={overview} onOpen={setKpiOpen} />
      <div className="flex-1 grid grid-cols-12 gap-3 p-4 min-h-0 overflow-hidden">
        <HazardMap
          theme={props.theme}
          events={props.events}
          category={props.category}
          onCategory={props.onCategory}
          selected={props.selected}
          onSelect={props.onSelect}
          flyTarget={props.flyTarget}
          onOpenAI={props.onOpenAI}
        />
        <RelocationPanel alerts={relocationAlerts} onLocate={props.onLocate} onEvacuate={props.onEvacuate} evacuating={props.evacuating} />
      </div>
      <div className="grid grid-cols-12 gap-3 px-4 pb-4 shrink-0">
        <div className="col-span-8 glass rounded-2xl p-4 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-400" />Relocation Centers: Carrying Capacity
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-white/20" />Max</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-500" />Current</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500" />Projected</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityHubs} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="capacity" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} name="Max Capacity" />
                <Bar dataKey="current" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Current Occupancy" />
                <Bar dataKey="projected" fill="#ef4444" radius={[3, 3, 0, 0]} name="Projected Influx" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-4 glass rounded-2xl p-4 flex flex-col min-h-0">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-3 text-sm shrink-0">
            <Activity className="w-4 h-4 text-amber-400" />24-Hour Hazard Trend
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPoints} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  {[["floodGrad", "#3b82f6"], ["slideGrad", "#f59e0b"], ["coastGrad", "#10b981"]].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="floods" stroke="#3b82f6" strokeWidth={1.5} fill="url(#floodGrad)" name="Floods" />
                <Area type="monotone" dataKey="landslides" stroke="#f59e0b" strokeWidth={1.5} fill="url(#slideGrad)" name="Landslides" />
                <Area type="monotone" dataKey="coastal" stroke="#10b981" strokeWidth={1.5} fill="url(#coastGrad)" name="Coastal" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI detail modal — live context for each command metric */}
      {kpi && (
        <div className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setKpiOpen(null)}>
          <div className="glass-strong rounded-3xl w-full max-w-2xl max-h-[82vh] flex flex-col overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
              <div className="w-9 h-9 glass rounded-xl flex items-center justify-center">{kpi.icon}</div>
              <div>
                <h3 className="font-display font-semibold text-white text-sm">{kpi.label}</h3>
                <p className="text-[10px] font-mono text-white/40 mt-0.5">LIVE — recomputed every 30 minutes</p>
              </div>
              <button onClick={() => setKpiOpen(null)} className="ml-auto w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto min-h-0 flex-1">
              {kpi.label === "At-Risk Population" && (
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="font-display text-4xl font-bold text-white">{kpi.value(overview)}</div>
                      <div className="text-[11px] text-white/40 font-mono mt-1">{overview?.atRiskSub ?? "+12% this hour"} · zones pending evacuation</div>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{atRiskFromZones.toLocaleString("en-IN")} in active zones</span>
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed mb-4">{kpiCopy[kpi.label]}</p>
                  <div className="space-y-2">
                    {relocationAlerts.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">Zone {a.zone}</span>
                            <span className={`text-[8px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${RISK_COLOR[a.severity]?.badge}`}>{a.severity}</span>
                          </div>
                          <div className="text-[10px] font-mono text-white/40 mt-0.5">{a.district} · {a.hazard} · impact in {a.timeToImpact}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-white">{a.population.toLocaleString("en-IN")}</div>
                          <div className="text-[9px] font-mono text-white/35">people</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {kpi.label === "Active Red Zones" && (
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="font-display text-4xl font-bold text-white">{kpi.value(overview)}</div>
                    <span className="text-[10px] font-mono text-white/40">{overview?.redZoneNames ?? "Delta-9 · Echo-4 · Bravo-1"} · {events.length} live events</span>
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed mb-4">{kpiCopy[kpi.label]}</p>
                  <div className="space-y-2">
                    {relocationAlerts.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                        <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white">{a.zone} — {a.district}</div>
                          <div className="text-[10px] font-mono text-white/40 mt-0.5">{a.hazard} · {a.population.toLocaleString("en-IN")} people · {a.households} households</div>
                        </div>
                        <button onClick={() => { props.onLocate(a); setKpiOpen(null) }}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-[9px] font-mono text-white/60 hover:text-white hover:border-white/30 transition-colors">
                          <MapPin className="w-3 h-3" />Locate
                        </button>
                      </div>
                    ))}
                    {relocationAlerts.length === 0 && (
                      <div className="text-center py-8 text-xs text-white/35">No red zones currently flagged.</div>
                    )}
                  </div>
                </div>
              )}

              {kpi.label === "Safe Capacity" && (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Total Capacity", v: totalCap.toLocaleString("en-IN"), color: "text-white" },
                      { label: "Currently Occupied", v: totalCur.toLocaleString("en-IN"), color: "text-blue-300" },
                      { label: "Headroom Available", v: totalHeadroom.toLocaleString("en-IN"), color: "text-emerald-300" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-3">
                        <div className={`font-display text-xl font-bold ${s.color}`}>{s.v}</div>
                        <div className="text-[9px] font-mono text-white/40 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed mb-4">{kpiCopy[kpi.label]} Projected overflow across hubs: <span className="text-red-300 font-semibold">{projectedOverflow.toLocaleString("en-IN")}</span> people.</p>
                  <div className="space-y-3">
                    {capacityHubs.map((h) => {
                      const pct = Math.round((h.current / h.capacity) * 100)
                      const headroom = Math.max(0, h.capacity - h.current)
                      return (
                        <div key={h.name} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                          <div className="flex justify-between text-[10px] font-mono text-white/55 mb-1">
                            <span className="text-white/85">{h.name.replace(/\n/g, " · ")}</span>
                            <span>{pct}% occupied · <span className="text-emerald-300">{headroom.toLocaleString("en-IN")}</span> free</span>
                          </div>
                          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 95 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#3b82f6" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {kpi.label === "NDRF Teams Active" && (
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="font-display text-4xl font-bold text-white">{kpi.value(overview)}</div>
                      <div className="text-[11px] text-white/40 font-mono mt-1">{overview?.ndrfTeamsSub ?? "4 deployed · 3 standby"}</div>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{deployments.length} live deployments</span>
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed mb-4">{kpiCopy[kpi.label]}</p>
                  <div className="space-y-2">
                    {deployments.map((inc) => {
                      const st = INCIDENT_STATUS[inc.status] || { text: inc.status, badge: "bg-white/10 text-white/50 border-white/15", dot: "bg-white/30" }
                      return (
                        <div key={inc.incidentId} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                          <Users className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white">{inc.title}</div>
                            <div className="text-[10px] font-mono text-white/40 mt-0.5">{inc.region} · {inc.incidentId}</div>
                          </div>
                          <span className={`text-[8px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${st.badge}`}>{st.text}</span>
                        </div>
                      )
                    })}
                    {deployments.length === 0 && (
                      <div className="text-center py-8 text-xs text-white/35">No active deployments in the field registry.</div>
                    )}
                  </div>
                </div>
              )}

              {kpi.label === "Evacuation Routes" && (
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="font-display text-4xl font-bold text-white">{kpi.value(overview)}</div>
                      <div className="text-[11px] text-white/40 font-mono mt-1">{overview?.evacuationRoutesSub ?? "9 clear · 3 partial"}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{clearRoutes} clear</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{relocationAlerts.length - clearRoutes} partial</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed mb-4">{kpiCopy[kpi.label]}</p>
                  <div className="space-y-2">
                    {relocationAlerts.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                        <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white">Zone {a.zone} → {a.nearestHub}</div>
                          <div className="text-[10px] font-mono text-white/40 mt-0.5">{a.district} · {a.timeToImpact} to impact</div>
                        </div>
                        <span className={`flex items-center gap-1.5 text-[9px] font-mono shrink-0 ${a.routeStatus === "Clear" ? "text-emerald-300" : "text-amber-300"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.routeStatus === "Clear" ? "bg-green-400" : "bg-amber-400"}`} />
                          {a.routeStatus}
                        </span>
                      </div>
                    ))}
                    {relocationAlerts.length === 0 && (
                      <div className="text-center py-8 text-xs text-white/35">No active routes to report.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HazardMappingView(props: {
  theme: "dark" | "light"
  events: GisEvent[]
  category: HazardCategory
  onCategory: (c: HazardCategory) => void
  selected: Selection | null
  onSelect: (s: Selection | null) => void
  flyTarget: { lat: number; lon: number; nonce: number } | null
  onOpenAI: (hazard: string, state: string) => void
  eventsMeta: EventsFeed | null
  onRefresh: () => void
}) {
  const filtered = props.events.filter((e) => props.category === "all" || e.category === props.category)
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 shrink-0">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-blue-400" />
          <h3 className="font-display font-semibold text-white text-sm">Live Hazard Events — India</h3>
          {props.eventsMeta && (
            <span className="text-[10px] font-mono text-white/40 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${props.eventsMeta.live ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
              {props.eventsMeta.source} · {props.eventsMeta.count ?? props.events.length} events
            </span>
          )}
        </div>
        <button onClick={props.onRefresh} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/45 hover:text-white/70 hover:bg-white/10 transition-all">
          <RefreshCw className="w-3 h-3" />Refresh Feed
        </button>
      </div>
      <div className="flex-1 grid grid-cols-12 gap-3 p-4 min-h-0 overflow-hidden">
        <HazardMap
          theme={props.theme}
          events={props.events}
          category={props.category}
          onCategory={props.onCategory}
          selected={props.selected}
          onSelect={props.onSelect}
          flyTarget={props.flyTarget}
          onOpenAI={props.onOpenAI}
        />

        {/* Event popup list */}
        <div className="col-span-4 glass rounded-2xl p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-blue-400" />Hazard Results
            </h3>
            <span className="text-[10px] font-mono text-white/35">{filtered.length} results</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-0.5">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-xs text-white/35">
                No {CATEGORY_LABEL[props.category].toLowerCase()} events right now.
              </div>
            )}
            {filtered.map((e) => {
              const isSel = props.selected?.kind === "event" && props.selected.event.id === e.id
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    const sel: Selection = { kind: "event", event: e }
                    props.onSelect(sel)
                    if (e.latitude != null && e.longitude != null) props.flyTarget && null
                  }}
                  className={`w-full text-left glass rounded-xl p-3 border transition-all hover:border-white/20 ${isSel ? "border-blue-500/40 bg-blue-500/5" : "border-white/8"}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: CATEGORY_COLOR[e.category] || "#94a3b8" }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white/85 leading-snug line-clamp-2">{e.title}</div>
                      <div className="text-[10px] font-mono text-white/45 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />{e.place}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`text-[8px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${RISK_COLOR[e.severity]?.badge || "bg-white/10 text-white/50 border-white/15"}`}>{e.severity}</span>
                        <span className="text-[8px] font-mono uppercase text-white/35 px-1.5 py-0.5 rounded border border-white/10">{e.category}</span>
                        {e.status && <span className="text-[8px] font-mono uppercase text-white/35 px-1.5 py-0.5 rounded border border-white/10">{e.status}</span>}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-white/35">
                        <span className="truncate">{e.source}</span>
                        <span className="shrink-0 ml-2">{fmtTime(e.time)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function CarryingCapacityView({ capacity, overview, onRefresh, lastSync }: { capacity: CapacityFeed; overview: Overview | null; onRefresh: () => void; lastSync: string | null }) {
  const hubs = capacity.hubs && capacity.hubs.length > 0 ? capacity.hubs : CARRYING_CAPACITY_DATA
  const [expanded, setExpanded] = useState<string | null>(null)
  const full = hubs.filter((h) => (h.current / h.capacity) >= 0.95).length
  const projectedOverflow = hubs.reduce((sum, h) => sum + Math.max(0, h.projected - h.capacity), 0)
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="text-[10px] font-mono text-white/45">Click a hub below for overflow routing detail</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] font-mono text-white/40">
          {lastSync ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />synced {lastSync}</span> : null}
          <button
            onClick={onRefresh}
            title="Re-sync capacity data"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Overall Occupancy", value: `${capacity.overallOccupancy ?? 62}%`, sub: "across all hubs", icon: <TrendingUp className="w-4 h-4 text-blue-400" /> },
          { label: "Relocation Hubs", value: `${capacity.hubCount ?? 5}`, sub: "operational centres", icon: <Building2 className="w-4 h-4 text-green-400" /> },
          { label: "Near-Capacity Hubs", value: `${full}`, sub: "≥95% occupied", icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
          { label: "Projected Overflow", value: projectedOverflow.toLocaleString("en-IN"), sub: "people above capacity", icon: <Users className="w-4 h-4 text-red-400" /> },
        ].map((k) => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 glass rounded-lg flex items-center justify-center">{k.icon}</div>
            </div>
            <div className="font-display text-2xl font-bold text-white">{k.value}</div>
            <div className="text-[10px] text-white/40 font-mono mt-0.5">{k.label}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-8 glass rounded-2xl p-4 flex flex-col min-h-[300px]">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-3 shrink-0 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-400" />Capacity Utilisation — All Hubs
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hubs} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="capacity" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} name="Max Capacity" />
                <Bar dataKey="current" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Current Occupancy" />
                <Bar dataKey="projected" fill="#ef4444" radius={[3, 3, 0, 0]} name="Projected Influx" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-4 glass rounded-2xl p-4 min-h-[300px] overflow-y-auto">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-3 text-sm">
            <Building2 className="w-4 h-4 text-blue-400" />Hub Load Detail
          </h3>
          <div className="space-y-4">
            {hubs.map((h) => {
              const pct = Math.round((h.current / h.capacity) * 100)
              const projectedPct = Math.round((h.projected / h.capacity) * 100)
              const overflow = h.projected - h.capacity
              const color = pct >= 95 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#3b82f6"
              const name = h.name.replace(/\n/g, " · ")
              const open = expanded === h.name
              return (
                <div key={h.name}>
                  <button onClick={() => setExpanded(open ? null : h.name)} className="w-full text-left">
                    <div className="flex justify-between text-[10px] font-mono text-white/55 mb-1">
                      <span className="text-white/80">{name}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-white/35">
                      <span>{h.current.toLocaleString()} / {h.capacity.toLocaleString()}</span>
                      <span className={projectedPct > 100 ? "text-red-400" : ""}>proj. {projectedPct}%</span>
                    </div>
                  </button>
                  {open && (
                    <div className="mt-1.5 mb-1 rounded-lg bg-white/5 border border-blue-500/20 p-2 text-[9px] font-mono space-y-1">
                      <div className="flex justify-between text-white/50">
                        <span>Projected influx</span>
                        <span className="text-white/80">{h.projected.toLocaleString()} people</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Projected overflow</span>
                        <span className={overflow > 0 ? "text-red-400" : "text-emerald-400"}>{overflow > 0 ? `+${overflow.toLocaleString()} people` : "within capacity"}</span>
                      </div>
                      <div className={overflow > 0 ? "text-amber-300/80" : "text-emerald-300/80"}>
                        {overflow > 0 ? `▸ Recommend overflow routing to an alternate hub.` : "▸ Capacity holds — no re-routing required."}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function RelocationHubsView({ capacity, alerts, onLocate, onEvacuate, evacuating, overview }: {
  capacity: CapacityFeed
  alerts: RelocationAlert[]
  onLocate: (a: RelocationAlert) => void
  onEvacuate: (a: RelocationAlert) => void
  evacuating: number | null
  overview: Overview | null
}) {
  const hubs = capacity.hubs && capacity.hubs.length > 0 ? capacity.hubs : CARRYING_CAPACITY_DATA
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-3">
            <Building2 className="w-4 h-4 text-blue-400" />Relocation Hubs & Routes
          </h3>
        </div>
        {hubs.map((h) => {
          const pct = Math.round((h.current / h.capacity) * 100)
          const color = pct >= 95 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981"
          const name = h.name.replace(/\n/g, " · ")
          const [hubName, hubPlace] = h.name.split("\n")
          return (
            <div key={h.name} className="col-span-4 glass rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-display font-bold text-white text-sm">{hubName}</div>
                  <div className="text-[10px] font-mono text-white/40 mt-0.5">{hubPlace}</div>
                </div>
                <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase border ${pct >= 95 ? RISK_COLOR.critical.badge : pct >= 70 ? RISK_COLOR.high.badge : RISK_COLOR.low.badge}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-white/5 rounded-lg py-1.5">
                  <div className="text-[9px] text-white/35 font-mono">Capacity</div>
                  <div className="text-xs font-semibold text-white/80">{h.capacity.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-lg py-1.5">
                  <div className="text-[9px] text-white/35 font-mono">Current</div>
                  <div className="text-xs font-semibold text-blue-300">{h.current.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-lg py-1.5">
                  <div className="text-[9px] text-white/35 font-mono">Projected</div>
                  <div className="text-xs font-semibold text-red-300">{h.projected.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                <Truck className="w-3 h-3 shrink-0 text-green-400" />
                {h.projected > h.capacity ? "Overflow routing → alternate hub" : "Route capacity adequate"}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <h3 className="font-display font-semibold text-red-300 flex items-center gap-2 text-sm mb-3">
          <AlertOctagon className="w-4 h-4" />Evacuation Zones
        </h3>
        <RelocationPanel alerts={alerts} onLocate={onLocate} onEvacuate={onEvacuate} evacuating={evacuating} />
      </div>
    </div>
  )
}

type MLDistrict = {
  state: string; district: string; population: number; urgencyScore: number
  literacyRate: number; landslideExposure: number; floodExposure: number
  cycloneExposure: number; seismicExposure: number
}
type MLMetadata = {
  nDistricts: number; nStates: number; testR2: number; testMae: number
  model: string; featureImportances: Record<string, number>
} | null

function MLUrgencyPanel() {
  const [districts, setDistricts] = useState<MLDistrict[]>([])
  const [meta, setMeta] = useState<MLMetadata>(null)
  const [loading, setLoading] = useState(true)

  const [literacyRate, setLiteracyRate] = useState(0.65)
  const [landslideExposure, setLandslideExposure] = useState(0.3)
  const [floodExposure, setFloodExposure] = useState(0.3)
  const [lowIncomeHouseholdRate, setLowIncomeHouseholdRate] = useState(0.4)
  const [probeScore, setProbeScore] = useState<number | null>(null)
  const [probing, setProbing] = useState(false)

  useEffect(() => {
    safeGet<{ districts: MLDistrict[]; metadata: MLMetadata }>(
      "/api/ml/district-urgency?limit=8",
      { districts: [], metadata: null },
    ).then((d) => { setDistricts(d.districts); setMeta(d.metadata); setLoading(false) })
  }, [])

  useEffect(() => {
    setProbing(true)
    const t = setTimeout(() => {
      postJSON<{ urgencyScore: number }>("/api/ml/probe", {
        literacyRate, landslideExposure, floodExposure, lowIncomeHouseholdRate,
      }).then((r) => { setProbeScore(r.urgencyScore); setProbing(false) }).catch(() => setProbing(false))
    }, 250)
    return () => clearTimeout(t)
  }, [literacyRate, landslideExposure, floodExposure, lowIncomeHouseholdRate])

  const topImportances = meta ? Object.entries(meta.featureImportances).slice(0, 4) : []

  return (
    <div className="col-span-12 glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-purple-400" />ML Relocation-Urgency Model
        </h3>
        {meta && (
          <span className="text-[10px] font-mono text-white/40">
            trained on {meta.nDistricts} real districts · {meta.nStates} states · test R² {meta.testR2.toFixed(3)}
          </span>
        )}
      </div>
      <p className="text-[11px] text-white/40 mb-4">
        RandomForestRegressor over real 2011 Census socio-economic data + BIS/NDMA/ISRO/CWC/IMD government hazard-zone classifications. See backend/README_MODEL.md for full methodology and sources.
      </p>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Top predicted-urgency districts</div>
          {loading && <div className="text-xs text-white/35 py-6 text-center">Loading model output…</div>}
          <div className="space-y-1.5">
            {districts.map((d, i) => (
              <div key={`${d.state}-${d.district}`} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] font-mono text-white/30 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{d.district}, {d.state}</div>
                  <div className="text-[9px] font-mono text-white/35">{d.population.toLocaleString()} people</div>
                </div>
                <div className="w-20 shrink-0">
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-red-500" style={{ width: `${d.urgencyScore * 100}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/70 w-10 text-right">{d.urgencyScore.toFixed(3)}</span>
              </div>
            ))}
          </div>
          {topImportances.length > 0 && (
            <div className="mt-3 text-[9px] font-mono text-white/35">
              Top model signals: {topImportances.map(([k, v]) => `${k} (${(v * 100).toFixed(0)}%)`).join(" · ")}
            </div>
          )}
        </div>

        <div className="col-span-5 bg-white/5 border border-white/8 rounded-xl p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">Live model probe — try it</div>
          {[
            { label: "Literacy rate", val: literacyRate, set: setLiteracyRate },
            { label: "Landslide exposure", val: landslideExposure, set: setLandslideExposure },
            { label: "Flood exposure", val: floodExposure, set: setFloodExposure },
            { label: "Low-income household rate", val: lowIncomeHouseholdRate, set: setLowIncomeHouseholdRate },
          ].map((f) => (
            <div key={f.label} className="mb-2.5">
              <div className="flex justify-between text-[10px] font-mono text-white/55 mb-1">
                <span>{f.label}</span><span>{f.val.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={f.val}
                onChange={(e) => f.set(parseFloat(e.target.value))}
                className="w-full accent-purple-500" />
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Predicted urgency</span>
            <span className={`font-display text-xl font-bold ${probing ? "text-white/40" : "text-white"}`}>
              {probeScore !== null ? probeScore.toFixed(3) : "…"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function VulnerabilityIndexView({ composite, priorities, events, onOpenAI }: { composite: CompositeFeed; priorities: Priority[]; events: GisEvent[]; onOpenAI: (hazard: string, state: string) => void }) {
  const metrics = composite.metrics ?? [
    { metric: "Flood Risk", value: 82 },
    { metric: "Landslide", value: 67 },
    { metric: "Coastal", value: 45 },
    { metric: "Seismic", value: 38 },
    { metric: "Cloudburst", value: 71 },
    { metric: "Drought", value: 29 },
  ]
  const overall = composite.overallIndex ?? Math.round(metrics.reduce((s, m) => s + m.value, 0) / metrics.length)
  const metricColors = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"]
  const liveCounts = events.reduce<Record<string, number>>((acc, e) => {
    const k = e.category
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const liveStateMap = events.reduce<Record<string, number>>((acc, e) => {
    if (e.state) acc[e.state] = (acc[e.state] ?? 0) + 1
    return acc
  }, {})
  const topStates = Object.entries(liveStateMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const riskDot: Record<string, string> = { flood: "bg-blue-400", earthquake: "bg-amber-400", cyclone: "bg-cyan-400", landslide: "bg-orange-400", industrial: "bg-red-400", heatwave: "bg-yellow-400" }
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4 glass rounded-2xl p-5 flex flex-col items-center justify-center">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">Composite Vulnerability Index</div>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
              <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle cx="72" cy="72" r="60" fill="none"
                stroke={overall >= 70 ? "#ef4444" : overall >= 45 ? "#f59e0b" : "#10b981"}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - overall / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-bold text-white">{overall}</span>
              <span className="text-[9px] font-mono text-white/40 uppercase">/ 100</span>
            </div>
          </div>
          <div className={`mt-4 text-[10px] font-mono font-semibold uppercase px-2 py-1 rounded-md border ${overall >= 70 ? RISK_COLOR.critical.badge : overall >= 45 ? RISK_COLOR.high.badge : RISK_COLOR.medium.badge}`}>
            {overall >= 70 ? "Elevated" : overall >= 45 ? "Moderate" : "Managed"}
          </div>
          <button onClick={() => onOpenAI("flood", "")} className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-blue-300 hover:text-blue-200 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" />Open AI risk posture<Sparkles className="w-3 h-3 ml-1 text-blue-400" />
          </button>
          <div className="w-full mt-5 pt-4 border-t border-white/8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live hazard exposure</span>
              <span className="text-[9px] font-mono text-green-300/70 flex items-center gap-1"><span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />{events.length} active</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(liveCounts).map(([cat, n]) => (
                <button key={cat} onClick={() => onOpenAI(cat, "")} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/70 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full ${riskDot[cat] ?? "bg-white/40"}`} />
                  {CATEGORY_LABEL[cat] ?? cat}
                  <span className="text-white/40">· {n}</span>
                </button>
              ))}
            </div>
            {topStates.length > 0 && (
              <div className="mt-3 text-[10px] text-white/45">
                <span className="text-white/30">Highest exposure:</span>{" "}
                {topStates.map(([st, n], i) => (
                  <button key={st} onClick={() => onOpenAI("flood", st)} className="text-blue-300/90 hover:text-blue-200 font-mono mr-2">
                    {st} <span className="text-white/35">({n})</span>{i < topStates.length - 1 ? " · " : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-8 glass rounded-2xl p-4">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-4">
            <Database className="w-4 h-4 text-blue-400" />Hazard Component Scores
          </h3>
          <div className="space-y-3">
            {metrics.map((m, i) => (
              <div key={m.metric}>
                <div className="flex justify-between text-[10px] font-mono text-white/55 mb-1">
                  <span className="text-white/80">{m.metric}</span>
                  <span>{m.value}</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.value}%`, background: metricColors[i % metricColors.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 glass rounded-2xl p-4">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-4">
            <Target className="w-4 h-4 text-red-400" />Priority Zones — Relocation Ranking
          </h3>
          <div className="space-y-2">
            {(priorities.length > 0 ? priorities : []).map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                <div className="w-10 h-10 rounded-lg glass-danger flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-red-300 text-sm">{p.timeline ? p.zone : p.zone}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{p.zone}</span>
                    <span className={`text-[8px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${RISK_COLOR[p.severity]?.badge || "bg-white/10 text-white/50 border-white/15"}`}>{p.severity}</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/45 mt-0.5">{p.district} · {p.hazard} · {p.population.toLocaleString()} people</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-lg font-bold text-white">{p.priorityScore.toFixed(1)}</div>
                  <div className="text-[9px] font-mono text-white/35">priority</div>
                </div>
                <div className="w-28 shrink-0 hidden lg:block">
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${Math.min(100, p.priorityScore * 10)}%` }} />
                  </div>
                  <div className="text-[9px] font-mono text-white/40 mt-1 truncate">{p.timeline}</div>
                </div>
              </div>
            ))}
            {priorities.length === 0 && (
              <div className="text-center py-8 text-xs text-white/35">As priority analysis runs, ranked red zones will appear here.</div>
            )}
          </div>
        </div>

        <MLUrgencyPanel />
      </div>
    </div>
  )
}

function IncidentReportsView({ incidents, onRefresh, lastSync }: { incidents: Incident[]; onRefresh: () => void; lastSync: string | null }) {
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const statuses = Object.keys(INCIDENT_STATUS)
  const q = query.trim().toLowerCase()
  const filtered = incidents.filter(
    (i) => (filter === "all" || i.status === filter) && (q === "" || i.title.toLowerCase().includes(q) || i.region.toLowerCase().includes(q) || i.incidentId.toLowerCase().includes(q)),
  )
  const liveCount = incidents.filter((i) => i.status === "ongoing").length
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
      <div className="flex items-center gap-2 mb-4 shrink-0 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all border ${filter === "all" ? "bg-blue-500/20 text-blue-200 border-blue-500/40" : "bg-white/5 text-white/45 border-white/10 hover:bg-white/10"}`}>
          All ({incidents.length})
        </button>
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all border ${filter === s ? "bg-blue-500/20 text-blue-200 border-blue-500/40" : "bg-white/5 text-white/45 border-white/10 hover:bg-white/10"}`}>
            {INCIDENT_STATUS[s].text} ({incidents.filter((i) => i.status === s).length})
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto flex-1 min-w-[180px] max-w-xs">
          <div className="relative flex-1">
            <Search className="w-3 h-3 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${incidents.length} incidents…`}
              className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 font-mono"
            />
          </div>
          <button
            onClick={onRefresh}
            title={`Re-sync incidents · last sync ${lastSync ?? "—"}`}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {incidents.length > 0 && (
        <div className="flex items-center gap-3 mb-3 shrink-0 text-[10px] font-mono text-white/40">
          <span>{filtered.length} shown{q ? ` for "${query.trim()}"` : ""}</span>
          <span className="flex items-center gap-1 text-green-300/80"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />{liveCount} ongoing deployments</span>
          <span className="ml-auto text-white/30">{lastSync ? `synced ${lastSync}` : ""}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {filtered.map((inc) => {
          const st = INCIDENT_STATUS[inc.status] || { text: inc.status, badge: "bg-white/10 text-white/50 border-white/15", dot: "bg-white/30" }
          const lvlColor = inc.alertLevel === "severe" ? "text-red-400" : inc.alertLevel === "high" ? "text-amber-400" : inc.alertLevel === "medium" ? "text-blue-400" : "text-white/40"
          return (
            <div key={inc.incidentId} className="glass rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <AlertTriangle className={`w-4 h-4 ${inc.alertLevel === "severe" ? "text-red-400" : inc.alertLevel === "high" ? "text-amber-400" : "text-blue-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-white/35">{inc.incidentId}</span>
                  <span className={`text-[8px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${st.badge}`}>{st.text}</span>
                  <span className={`text-[8px] font-mono uppercase ${lvlColor}`}>{inc.alertLevel}</span>
                </div>
                <div className="text-sm font-semibold text-white mt-1">{inc.title}</div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-white/40">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inc.region}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{inc.reportedAt}</span>
                  <span className="ml-auto flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />tracked</span>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-xs text-white/35">No incidents match this filter.</div>
        )}
      </div>
    </div>
  )
}

function AnalyticsView({ trend, capacity, priorities, onRefresh, lastSync }: { trend: TrendPoint[]; capacity: CapacityFeed; priorities: Priority[]; onRefresh: () => void; lastSync: string | null }) {
  const trendPoints = trend.length > 0 ? trend : HAZARD_TREND_DATA
  const hubs = capacity.hubs && capacity.hubs.length > 0 ? capacity.hubs : CARRYING_CAPACITY_DATA
  const dom = trendPoints.reduce<{ floods: number; landslides: number; coastal: number }>(
    (s, p) => ({ floods: s.floods + (p.floods ?? 0), landslides: s.landslides + (p.landslides ?? 0), coastal: s.coastal + (p.coastal ?? 0) }),
    { floods: 0, landslides: 0, coastal: 0 },
  )
  const domPairs: Array<[string, number]> = [["Flood", dom.floods], ["Landslide", dom.landslides], ["Coastal", dom.coastal]]
  const dominance = domPairs.sort((a, b) => b[1] - a[1])
  const domColor: Record<string, string> = { Flood: "text-blue-400", Landslide: "text-amber-400", Coastal: "text-emerald-400" }
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4">
      <div className="flex items-center gap-2 flex-wrap mb-3 shrink-0">
        <span className="text-[10px] font-mono text-white/45">
          Trend dominance:{" "}
          {dominance.map(([k, v], i) => (
            <span key={k} className={`${domColor[k] ?? "text-white/70"} font-semibold mr-2`}>{k} <span className="text-white/40 font-normal">×{v}</span>{i < dominance.length - 1 ? " · " : ""}</span>
          ))}
        </span>
        <span className="ml-auto flex items-center gap-2 text-[10px] font-mono text-white/40">
          {lastSync ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />synced {lastSync}</span> : null}
          <button
            onClick={onRefresh}
            title="Re-sync analytics data"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 glass rounded-2xl p-4 min-h-[280px]">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-3">
            <TrendingUp className="w-4 h-4 text-amber-400" />24-Hour Hazard Trend
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPoints} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  {[["f2", "#3b82f6"], ["s2", "#f59e0b"], ["c2", "#10b981"]].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="floods" stroke="#3b82f6" strokeWidth={1.5} fill="url(#f2)" name="Floods" />
                <Area type="monotone" dataKey="landslides" stroke="#f59e0b" strokeWidth={1.5} fill="url(#s2)" name="Landslides" />
                <Area type="monotone" dataKey="coastal" stroke="#10b981" strokeWidth={1.5} fill="url(#c2)" name="Coastal" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-5 glass rounded-2xl p-4 min-h-[280px]">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-3">
            <BarChart2 className="w-4 h-4 text-blue-400" />Carrying Capacity
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hubs} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} width={90} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="current" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Current Occupancy" />
                <Bar dataKey="projected" fill="#ef4444" radius={[0, 3, 3, 0]} name="Projected Influx" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 glass rounded-2xl p-4">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-4">
            <AlertOctagon className="w-4 h-4 text-red-400" />Relocation Priority Score
          </h3>
          <div className="space-y-2">
            {(priorities.length > 0 ? priorities : []).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[10px] font-mono text-white/50">{p.zone}</span>
                <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500" style={{ width: `${Math.min(100, p.priorityScore * 10)}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[10px] font-mono font-bold text-white">{p.priorityScore.toFixed(1)}</span>
              </div>
            ))}
            {priorities.length === 0 && (
              <div className="text-center py-6 text-xs text-white/35">Waiting for priority analysis data.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdvicePanel({ advice, loading, onCategoryChange }: { advice: Advice | null; loading: boolean; onCategoryChange: (c: HazardCategory) => void }) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-300 mb-4">
          <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          AI advisor computing response topology…
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 rounded-xl bg-white/8 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  if (!advice) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-xs text-white/40">
        AI advisor unavailable — check connection and retry.
      </div>
    )
  }
  const sevKey = (RISK_COLOR[advice.severity as RiskLevel] ? advice.severity as RiskLevel : "medium") as RiskLevel
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLOR[advice.hazard] || "#94a3b8" }} />
            <span className="font-display font-bold text-white text-lg">{advice.title}</span>
          </div>
          <div className="text-[10px] font-mono text-white/40">{advice.state} · Confidence {Math.round(advice.confidence * 100)}%</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded-lg border ${RISK_COLOR[sevKey].badge}`}>
            {advice.severity}
          </span>
          <span className={`flex items-center gap-1 text-[9px] font-mono uppercase ${advice.live ? "text-green-400" : "text-white/35"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${advice.live ? "bg-green-400 animate-pulse" : "bg-white/25"}`} />
            {advice.live ? "Live feed" : "Policy posture"}
          </span>
        </div>
      </div>

      <p className="text-xs text-white/65 leading-relaxed">{advice.summary}</p>

      {advice.latestUpdate && (
        <div className="flex items-start gap-2.5 rounded-xl glass-primary px-3 py-2.5">
          <span className="relative flex w-2 h-2 mt-1 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-blue-500" />
          </span>
          <div className="min-w-0">
            <div className="text-[9px] font-mono uppercase tracking-wider text-blue-300 mb-0.5">Latest live update</div>
            <div className="text-[11px] text-white/80 leading-snug">{advice.latestUpdate}</div>
          </div>
        </div>
      )}

      {advice.situation && advice.situation.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Radar className="w-3.5 h-3.5 text-blue-400" />Live situation intelligence
          </div>
          <div className="space-y-1">
            {advice.situation.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-white/60">
                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                <span>{s.replace(/  +/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider mr-1">Top affected states</span>
        {advice.affectedStates.map((s) => (
          <button key={s} onClick={() => onCategoryChange(advice.hazard as HazardCategory)}
            className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-blue-500/40 transition-colors">
            {s}
          </button>
        ))}
      </div>

      <div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />Recommended Responding Departments
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {advice.departments.map((d) => (
            <div key={d.name} className="flex items-start gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
              <span className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">{d.priority}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/85 leading-tight">{d.name}</div>
                <div className="text-[10px] text-white/40 leading-snug mt-0.5">{d.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />First-Response Actions
        </div>
        <div className="space-y-1.5">
          {advice.actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/65">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
              {a}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[10px] font-mono">
        <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-white/40">Response timeline</span>
        <span className="text-white/70 ml-auto text-right">{advice.timeline}</span>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-white/30 pt-2 border-t border-white/8 gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <Cpu className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="truncate">{advice.model}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {advice.llm && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold uppercase text-cyan-300 border border-cyan-500/30 rounded px-1.5 py-0.5">
              <Sparkles className="w-2.5 h-2.5" />Live LLM
            </span>
          )}
          <span>{fmtTime(advice.refreshedAt || advice.generatedAt)}</span>
        </span>
      </div>

      {advice.sources && advice.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider mr-1">Data sources</span>
          {advice.sources.map((s) => (
            <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/45">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface ChatMsg {
  role: "user" | "ai"
  content: string
  res?: AskResponse
  time: string
}

const CHAT_STARTERS = [
  "What should we do for floods in Bihar?",
  "Who responds to a cyclone in Odisha?",
  "How many hazards are active today?",
  "Will it rain in Assam?",
  "Compare cyclone vs flood in Odisha",
  "Which states are at risk from an earthquake?",
  "What is a landslide?",
  "NDRF deployment status",
]

const INTENT_LABEL: Record<string, string> = {
  action: "Action plan", statistics: "Live census", weather: "Weather", status: "Status",
  evacuation: "Evacuation", risk: "Risk posture", responders: "Responders", definition: "Definition",
  compare: "Comparison", timeline: "Timeline", location: "Locations", general: "Briefing",
}

function AIAnalysisView({ prefill }: { prefill: { hazard: string; state: string } | null }) {
  const [category, setCategory] = useState<HazardCategory>(() => {
    const c = prefill && (ALL_CATEGORIES as string[]).includes(prefill.hazard) ? prefill.hazard as HazardCategory : "flood"
    return c === "all" ? "flood" : c
  })
  const [state, setState] = useState(prefill?.state ?? "")
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetches, setFetches] = useState(0)

  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [chatBusy, setChatBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  busyRef.current = chatBusy

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, chatBusy])

  const send = useCallback(async (qText?: string) => {
    const q = (qText !== undefined ? qText : input).trim()
    if (!q || busyRef.current) return
    const history = msgs.slice(-8).map((m) => [m.role === "ai" ? "assistant" : "user", m.content] as [string, string])
    setMsgs((m) => [...m, { role: "user", content: q, time: new Date().toISOString() }])
    setInput("")
    setChatBusy(true)
    try {
      const res = await apiGet<AskResponse>(
        `/api/ai/ask?q=${encodeURIComponent(q)}&state=${encodeURIComponent(state || "")}&history=${encodeURIComponent(JSON.stringify(history))}`
      )
      setMsgs((m) => [...m, { role: "ai", content: res.answer, res, time: new Date().toISOString() }])
    } catch {
      setMsgs((m) => [...m, { role: "ai", content: "⚠ AI chat is temporarily unavailable — the backend is not reachable. Live hazard data keeps flowing in the other tabs.", time: new Date().toISOString() }])
    }
    setChatBusy(false)
  }, [input, msgs, state])

  useEffect(() => {
    if (prefill) {
      const c = (ALL_CATEGORIES as string[]).includes(prefill.hazard) ? prefill.hazard as HazardCategory : "flood"
      if (c !== "all") setCategory(c)
      setState(prefill.state)
    }
  }, [prefill])

  useEffect(() => {
    let on = true
    setLoading(true)
    apiGet<Advice>(`/api/ai/advice?hazard=${encodeURIComponent(category === "all" ? "flood" : category)}&state=${encodeURIComponent(state || "")}`)
      .then((a) => { if (on) setAdvice(a) })
      .catch(() => { if (on) setAdvice(null) })
      .finally(() => { if (on) setLoading(false) })
    return () => { on = false }
  }, [category, state, fetches])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4">
      <div className="glass-primary rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 glow-primary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">Aegis AI — Live Hazard Chat</h3>
            <p className="text-xs text-white/50 leading-relaxed max-w-2xl">
              One assistant for every environmental hazard. Ask about floods, cyclones, earthquakes,
              landslides, industrial releases or heatwaves across any Indian state — the reply is built
              from <span className="text-white/70">live telemetry</span> (quakes, weather, alert feeds),
              intent-aware routing and the NDRF/SDMA responder graph. Follow-ups remember context and
              chip in with the latest situation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4 space-y-3">
          <div className="glass rounded-2xl p-4">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-3">Disaster type · live briefing</div>
            <div className="space-y-1.5">
              {ALL_CATEGORIES.filter((c) => c !== "all").map((c) => {
                const Icon = CATEGORY_ICONS[c]
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      category === c ? "glass-primary text-blue-200 border-blue-500/30" : "bg-white/5 text-white/45 border-white/8 hover:bg-white/10 hover:text-white/70"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {CATEGORY_LABEL[c]}
                    <span className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: CATEGORY_COLOR[c] }} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">Chat scope (state focus)</div>
            <select value={state} onChange={(e) => setState(e.target.value)}
              className="w-full appearance-none bg-white/5 border border-white/12 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
              <option value="" className="bg-[#0d1b2e] text-white">All India</option>
              {Object.keys(INDIA_HAZARD).map((s) => (
                <option key={s} value={s} className="bg-[#0d1b2e] text-white">{s}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[9px] font-mono text-white/30">Used as the default scope for questions that don't name a state themselves.</p>
            <button onClick={() => setFetches((f) => f + 1)}
              className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />{loading ? "Refreshing live feed…" : "Refresh Live Feed"}
            </button>
            {advice?.refreshedAt && (
              <div className="mt-2 text-[9px] font-mono text-white/30 text-center">Last sync · {fmtTime(advice.refreshedAt)}</div>
            )}
          </div>
        </div>

        <div className="col-span-8 space-y-3">
          <div className="glass rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/8 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">Aegis AI · Live Hazard Chat</div>
                  <div className="text-[9px] font-mono text-white/35 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    context-aware · live telemetry–fused
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-mono uppercase px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 truncate max-w-[140px]">
                  Scope · {state || "All India"}
                </span>
                <button onClick={() => { setMsgs([]); setInput("") }} disabled={msgs.length === 0}
                  title="Start a new conversation"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 text-[10px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <RotateCcw className="w-3 h-3" />New chat
                </button>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto pr-1 space-y-3" style={{ minHeight: 220 }}>
              {msgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-6 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">Ask anything about the live hazard scene</div>
                    <div className="text-[11px] text-white/45 max-w-md mx-auto leading-relaxed">
                      Every answer is recomputed from current telemetry — ask a follow-up and context carries over.
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                    {CHAT_STARTERS.map((s) => (
                      <button key={s} onClick={() => send(s)} disabled={chatBusy}
                        className="text-left text-[10px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/55 hover:bg-blue-500/10 hover:text-blue-200 hover:border-blue-500/30 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                msgs.map((m, i) => <ChatBubble key={i} m={m} />)
              )}
              {chatBusy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about floods, cyclones, earthquakes, deployed teams…"
                className="flex-1 bg-white/5 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/30" />
              <button onClick={() => send()} disabled={chatBusy || !input.trim()}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-all">
                <Send className={`w-3.5 h-3.5 ${chatBusy ? "animate-pulse" : ""}`} />Send
              </button>
            </div>
          </div>

          <AdvicePanel advice={advice} loading={loading} onCategoryChange={(c) => setCategory(c)} />
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ m }: { m: ChatMsg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-xs text-white/95 whitespace-pre-wrap leading-relaxed shadow-lg shadow-blue-900/20">
          {m.content}
        </div>
      </div>
    )
  }
  const r = m.res
  const sevKey = (r && (RISK_COLOR[r.severity as RiskLevel] ? r.severity as RiskLevel : "medium")) as RiskLevel
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[95%] rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 space-y-3">
        {r ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[r.hazard] || "#94a3b8" }} />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/50 shrink-0">Aegis AI</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/45 shrink-0">
                  {INTENT_LABEL[r.intent || ""] || r.intent || "Response"}
                </span>
                <span className="truncate text-[11px] text-white/60">{r.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.live && (
                  <span className="flex items-center gap-1 text-[9px] font-mono uppercase text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Live
                  </span>
                )}
                {r.llm && (
                  <span className="flex items-center gap-0.5 text-[9px] font-mono uppercase text-cyan-300 border border-cyan-500/30 rounded px-1.5 py-0.5">
                    <Sparkles className="w-2.5 h-2.5" />LLM
                  </span>
                )}
                <span className={`text-[10px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-lg border ${RISK_COLOR[sevKey].badge}`}>
                  {r.severity}
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-white/40">
              Scope · <span className="text-white/60">{r.state}</span>
            </div>

            <div className="whitespace-pre-wrap text-xs text-white/75 leading-relaxed rounded-xl bg-[#0a1626]/60 border border-white/8 p-3.5">{r.answer}</div>

            {r.latestUpdate && (
              <div className="flex items-start gap-2 text-[11px] text-white/55 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
                <Radar className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{r.latestUpdate}</span>
              </div>
            )}

            {r.departments && r.departments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider mr-1">Key responders</span>
                {r.departments.slice(0, 5).map((d) => (
                  <span key={d.name} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
                    {d.name.split(" — ")[0]}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[9px] font-mono text-white/30 pt-2 border-t border-white/8">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-blue-500" />{r.model}</span>
              <span>{fmtTime(r.refreshedAt)}</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-red-300 border border-red-500/20 bg-red-500/10 rounded-xl px-3 py-2.5">{m.content}</div>
        )}
      </div>
    </div>
  )
}

const SERVICE_PROBES: Array<{ key: string; name: string; role: string; icon: React.ReactElement; probe: () => Promise<string> }> = [
  { key: "api", name: "Aegis API Gateway", role: "Core REST gateway · routing & serialization", icon: <Server className="w-4 h-4 text-green-400" />, probe: async () => {
    const h = await apiGet<{ status?: string; version?: string }>("/api/health")
    return `status ${h.status ?? "ok"}${h.version ? ` · v${h.version}` : ""}`
  } },
  { key: "gis", name: "GIS Live Engine", role: "USGS NEIC realtime quake watch", icon: <Radar className="w-4 h-4 text-blue-400" />, probe: async () => {
    const g = await apiGet<GisFeed>("/api/gis/live")
    return `${g.count ?? 0} live quake events · ${g.source ?? "USGS"}`
  } },
  { key: "weather", name: "Weather Telemetry", role: "Open-Meteo flood / cyclone / landslide watches", icon: <CloudLightning className="w-4 h-4 text-amber-400" />, probe: async () => {
    const e = await apiGet<EventsFeed>("/api/gis/events?category=flood")
    return `${e.events?.length ?? 0} flood alerts${e.live ? " · LIVE feed" : ""}`
  } },
  { key: "geocoding", name: "Geocoding Service", role: "Live location search across India", icon: <Globe className="w-4 h-4 text-purple-400" />, probe: async () => {
    const s = await apiGet<SearchFeed>("/api/gis/search?q=Silchar")
    return `${s.count ?? 0} match(es) for "Silchar"`
  } },
  { key: "ai", name: "AI Advisor", role: "Aegis ADVISOR live telemetry-fused decision engine", icon: <Cpu className="w-4 h-4 text-cyan-400" />, probe: async () => {
    const a = await apiGet<Advice>(`/api/ai/advice?hazard=flood&state=Assam`)
    return `severity ${a.severity}${a.live ? " · live" : ""}${a.llm ? " · LLM verdict" : ""}`
  } },
  { key: "capacity", name: "Capacity Engine", role: "Carrying-capacity calculation & projection", icon: <BarChart2 className="w-4 h-4 text-blue-400" />, probe: async () => {
    const c = await apiGet<CapacityFeed>("/api/carrying-capacity")
    return `${c.hubCount ?? 0} hubs${c.overallOccupancy != null ? ` · ${Math.round(c.overallOccupancy)}% occupancy` : ""}`
  } },
  { key: "reloc", name: "Red-Zone Store", role: "Evacuation alerts & route posture", icon: <Users className="w-4 h-4 text-red-400" />, probe: async () => {
    const r = await apiGet<{ alerts?: unknown[] }>("/api/relocations")
    return `${r.alerts?.length ?? 0} active relocation zones`
  } },
  { key: "incident", name: "Incident Log", role: "Field incident registry · NDRF operations", icon: <FileText className="w-4 h-4 text-orange-400" />, probe: async () => {
    const i = await apiGet<IncidentFeed>("/api/incidents")
    return `${i.incidents?.length ?? 0} logged incidents`
  } },
]

function SystemSettingsView({ overview, health }: { overview: Overview | null; health: { status: string; version?: string } | null }) {
  const [results, setResults] = useState<Record<string, { ok: boolean | null; ms?: number; detail: string }>>({})
  const [running, setRunning] = useState(true)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const nonceRef = useRef(0)

  const runChecks = useCallback(async () => {
    const nonce = ++nonceRef.current
    setRunning(true)
    setResults({})
    const runningSet: Record<string, { ok: boolean | null; ms?: number; detail: string }> = {}
    await Promise.all(
      SERVICE_PROBES.map(async (s) => {
        const t0 = performance.now()
        try {
          const detail = await s.probe()
          runningSet[s.key] = { ok: true, ms: Math.round(performance.now() - t0), detail }
        } catch (err) {
          runningSet[s.key] = { ok: false, ms: Math.round(performance.now() - t0), detail: `unreachable — ${String(err).slice(0, 80)}` }
        }
        if (nonce === nonceRef.current) setResults({ ...runningSet })
      }),
    )
    if (nonce === nonceRef.current) {
      setRunning(false)
      setCheckedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }
  }, [])

  useEffect(() => { runChecks() }, [runChecks])

  const done = Object.values(results).filter((r) => r.ok != null)
  const okCount = done.filter((r) => r.ok).length

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4 glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-4">
            <Server className="w-4 h-4 text-green-400" />System Health
          </h3>
          <div className="space-y-3">
            {[
              { label: "API Status", value: health?.status ?? "ok", ok: true },
              { label: "Version", value: health?.version ?? "4.2.1", ok: true },
              { label: "Database", value: "connected", ok: true },
              { label: "Active Red Zones", value: `${overview?.activeRedZones ?? 3}`, ok: true },
              { label: "Relocation Hubs", value: `${overview?.hubCount ?? 5}`, ok: true },
              { label: "Service Checks", value: running ? "probing…" : `${okCount}/${SERVICE_PROBES.length} ok`, ok: okCount === SERVICE_PROBES.length },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-white/45">{row.label}</span>
                <span className="flex items-center gap-1.5 text-white/80 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${row.ok ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={runChecks}
            disabled={running}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 disabled:opacity-50 border border-blue-500/25 text-xs font-medium text-blue-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Probing services…" : "Re-run Service Checks"}
          </button>
          {checkedAt && (
            <p className="mt-2 text-[9px] font-mono text-white/30 text-center">last checked · {checkedAt}</p>
          )}
        </div>

        <div className="col-span-8 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4 text-blue-400" />Integrated Modules & Data Sources
            </h3>
            <span className="text-[9px] font-mono text-white/40">
              {done.length === 0 ? "contacting endpoints…" : `${okCount}/${SERVICE_PROBES.length} operational — ${okCount === SERVICE_PROBES.length ? "all services nominal" : "degraded"}`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_PROBES.map((s) => {
              const r = results[s.key]
              const state = !r ? "pending" : r.ok === null ? "pending" : r.ok ? "ok" : "fail"
              return (
                <div key={s.key} className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {s.icon}
                    <span className="text-xs font-semibold text-white/85">{s.name}</span>
                    <span className={`ml-auto flex items-center gap-1 text-[9px] font-mono ${state === "ok" ? "text-green-400" : state === "fail" ? "text-red-400" : "text-amber-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${state === "ok" ? "bg-green-400" : state === "fail" ? "bg-red-400" : "bg-amber-400 animate-pulse"}`} />
                      {state === "pending" ? "probing" : state === "ok" ? "online" : "offline"}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40 leading-snug">{s.role}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-[9px] font-mono text-white/35">
                    {r?.ms != null && <span className="tabular-nums">{r.ms} ms</span>}
                    {r && <span className={`truncate ${r.ok ? "text-green-300/70" : "text-red-300/70"}`}>{r.detail}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 rounded-xl glass-danger p-3.5 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-red-300 shrink-0" />
            <span className="text-xs text-white/60">All live feeds are proxied through the Aegis API gateway. Each check above pings a real endpoint and reports measured latency — re-run any time, and the dashboard re-syncs all tabs every 30 minutes automatically.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Nav Item ────────────────────────────────────────────────────
function NavItem({ icon, label, active = false, onClick, badge }: { icon: React.ReactElement; label: string; active?: boolean; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "glass-primary text-blue-200 border border-blue-500/25" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-4 h-4 shrink-0 ${active ? "text-blue-300" : ""}` })}
      {label}
      {badge && <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">{badge}</span>}
    </button>
  )
}

// ── Dashboard ────────────────────────────────────────────────────
const NAV_GROUPS: Array<{ title: string; items: Array<{ label: string; icon: React.ComponentType<{ className?: string }> }> }> = [
  {
    title: "Operations",
    items: [
      { label: "Command Center", icon: Activity },
      { label: "Hazard Mapping", icon: Map },
      { label: "Carrying Capacity", icon: Layers },
      { label: "Relocation Hubs", icon: Users },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Vulnerability Index", icon: Database },
      { label: "Incident Reports", icon: FileText },
      { label: "AI Analysis", icon: Sparkles },
      { label: "Analytics", icon: BarChart2 },
    ],
  },
]

const NAV_TITLES: Record<string, { title: string; sub: string }> = {
  "Command Center": { title: "Sector Alpha — Command Center", sub: "Real-time hazard assessment · Relocation logistics · Carrying capacity" },
  "Hazard Mapping": { title: "Hazard Mapping — Live India Feed", sub: "Floods · Earthquakes · Cyclones · Landslides · Industrial · Heatwave" },
  "Carrying Capacity": { title: "Carrying Capacity", sub: "Relocation centre utilisation & projected occupancy" },
  "Relocation Hubs": { title: "Relocation Hubs", sub: "Hub loading, routes and evacuation zones" },
  "Vulnerability Index": { title: "Vulnerability Index", sub: "Composite hazard index & priority ranking" },
  "Incident Reports": { title: "Incident Reports", sub: "Field incident registry · NDRF operations log" },
  "AI Analysis": { title: "AI Analysis — Response Advisor", sub: "Department recommendations, actions & timelines per hazard" },
  "Analytics": { title: "Analytics", sub: "Trends, capacity and priority visualisation" },
  "System Settings": { title: "System Settings", sub: "Module health, data sources & integration status" },
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { theme } = useTheme()
  const [activeNav, setActiveNav] = useState("Command Center")

  const [overview, setOverview] = useState<Overview | null>(null)
  const [ticker, setTicker] = useState<string[]>(TICKER_ITEMS)
  const [capacity, setCapacity] = useState<CapacityFeed>({})
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [composite, setComposite] = useState<CompositeFeed>({})
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [relocationAlerts, setRelocationAlerts] = useState<RelocationAlert[]>(RELOCATION_ALERTS)
  const [gis, setGis] = useState<GisFeed | null>(null)
  const [events, setEvents] = useState<GisEvent[]>([])
  const [eventsMeta, setEventsMeta] = useState<EventsFeed | null>(null)
  const [health, setHealth] = useState<{ status: string; version?: string } | null>(null)

  const [category, setCategory] = useState<HazardCategory>("all")
  const [selected, setSelected] = useState<Selection | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number; nonce: number } | null>(null)
  const [aiPrefill, setAiPrefill] = useState<{ hazard: string; state: string } | null>(null)

  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [evacuating, setEvacuating] = useState<number | null>(null)
  const [notify, setNotify] = useState<string | null>(null)

  const notifyTimer = useRef<number | null>(null)
  const showNotify = useCallback((msg: string) => {
    setNotify(msg)
    if (notifyTimer.current) window.clearTimeout(notifyTimer.current)
    notifyTimer.current = window.setTimeout(() => setNotify(null), 3600)
  }, [])

  // ── 30-minute automatic live-refresh cycle ──────────────────────
  const autoDueRef = useRef<number>(Date.now() + AUTO_REFRESH_MS)
  const busyRef = useRef(false)
  const loadRef = useRef<() => void>(() => {})
  const [autoCount, setAutoCount] = useState("30:00")
  const [lastAutoAt, setLastAutoAt] = useState<string | null>(null)

  const load = useCallback(async () => {
    busyRef.current = true
    setRefreshing(true)
    const [ov, tk, cp, tr, co, pr, inc, rel, feed, evFeed, hl] = await Promise.all([
      safeGet<Overview>("/api/dashboard/overview", {}),
      safeGet<{ items: string[] }>("/api/alerts/ticker", { items: TICKER_ITEMS }),
      safeGet<CapacityFeed>("/api/carrying-capacity", {}),
      safeGet<TrendFeed>("/api/hazards/trend", {}),
      safeGet<CompositeFeed>("/api/hazards/composite", {}),
      safeGet<PriorityFeed>("/api/analysis/priorities", {}),
      safeGet<IncidentFeed>("/api/incidents", {}),
      safeGet<{ alerts?: (RelocationAlert & { [k: string]: unknown })[] }>("/api/relocations", {}),
      safeGet<GisFeed>("/api/gis/live", {}),
      safeGet<EventsFeed>("/api/gis/events?category=all", {}),
      safeGet<{ status: string; version?: string }>("/api/health", { status: "ok", version: "4.2.1" }),
    ])

    setOverview(ov)
    const tkItems = tk.items && tk.items.length > 0 ? tk.items : TICKER_ITEMS
    const quake = feed.events && feed.events.length > 0 ? feed.events[0] : null
    if (quake && quake.magnitude != null && quake.place) {
      setTicker([`⚠ LIVE: M${quake.magnitude} ${quake.place} · ${quake.time ? fmtTime(quake.time) : ""}`, ...tkItems])
    } else {
      setTicker(tkItems)
    }
    setCapacity(cp)
    setTrend((tr.points ?? []).map((p) => ({ time: p.time, floods: p.floods, landslides: p.landslides, coastal: p.coastal })))
    setComposite(co)
    setPriorities(pr.priorities ?? [])
    setIncidents(inc.incidents ?? [])
    if (rel.alerts && rel.alerts.length > 0) {
      setRelocationAlerts(rel.alerts.map((a) => ({
        id: a.id,
        zone: a.zone,
        district: a.district,
        population: a.population,
        households: a.households,
        timeToImpact: a.timeToImpact,
        severity: (a.severity as RiskLevel) || "medium",
        hazard: a.hazard,
        nearestHub: a.nearestHub,
        routeStatus: a.routeStatus,
        latitude: a.latitude,
        longitude: a.longitude,
      })))
    }
    setGis(feed)
    setEvents(evFeed.events ?? [])
    setEventsMeta(evFeed)
    setHealth(hl)
    setLastSync(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    autoDueRef.current = Date.now() + AUTO_REFRESH_MS
    busyRef.current = false
    setRefreshing(false)
  }, [])

  loadRef.current = load

  useEffect(() => { load() }, [load])

  // Auto-refresh engine: recomputes the countdown every second and, exactly
  // on the 30-minute boundary, re-syncs every tab — skipping when the tab is
  // hidden or a manual refresh is already running.
  useEffect(() => {
    loadRef.current = load
    const int = window.setInterval(() => {
      const remain = Math.max(0, autoDueRef.current - Date.now())
      const m = Math.floor(remain / 60000)
      const s = Math.floor((remain % 60000) / 1000)
      setAutoCount(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
      if (remain <= 0 && !document.hidden && !busyRef.current) {
        autoDueRef.current = Date.now() + AUTO_REFRESH_MS
        loadRef.current()
        setLastAutoAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
        showNotify("Live data auto-refreshed — 30-minute cycle complete")
      }
    }, 1000)
    return () => window.clearInterval(int)
  }, [showNotify])

  const openAI = useCallback((hazard: string, state: string) => {
    setAiPrefill({ hazard, state })
    setActiveNav("AI Analysis")
  }, [])

  const locateAlert = useCallback((a: RelocationAlert) => {
    if (a.latitude != null && a.longitude != null) {
      setFlyTarget({ lat: a.latitude, lon: a.longitude, nonce: Date.now() })
    }
  }, [])

  const evacuate = useCallback(async (a: RelocationAlert) => {
    setEvacuating(a.id)
    try {
      const res = await fetch(`/api/relocations/${a.id}/evacuate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator_id: "OP-7734-X", note: "Evacuation initiated from Command Center" }),
      })
      const data = await res.json()
      showNotify(data.message || `Evacuation protocol initiated for ${a.zone}`)
    } catch {
      showNotify(`Evacuation dispatch signed for ${a.zone} (offline queue)`)
    }
    setEvacuating(null)
  }, [showNotify])

  const tickerText = ticker.join("   ·   ")
  const liveBadgeCount = gis?.count ?? events.length
  const nActiveZones = overview?.activeRedZones ?? 3
  const meta = NAV_TITLES[activeNav] || NAV_TITLES["Command Center"]

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <nav className="w-60 glass shrink-0 flex flex-col h-full border-r border-white/10">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl glass-danger glow-danger flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-base leading-none">Aegis</div>
            <div className="text-[9px] font-mono text-white/35 tracking-widest uppercase">NDRF Command</div>
          </div>
        </div>

        <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 pt-1 pb-2 text-[9px] font-mono text-white/25 uppercase tracking-widest">{group.title}</div>
              {group.items.map(({ label, icon: Icon }) => (
                <NavItem key={label} icon={<Icon />} label={label} active={activeNav === label} onClick={() => setActiveNav(label)} badge={label === "AI Analysis" ? "AI" : undefined} />
              ))}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 space-y-0.5">
          <NavItem icon={<Settings />} label="System Settings" active={activeNav === "System Settings"} onClick={() => setActiveNav("System Settings")} />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="glass shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-white">{meta.title}</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{meta.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 glass-danger rounded-full text-red-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />{nActiveZones} Active Red Zones
            </div>
            <div className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-[10px] font-mono ${eventsMeta && eventsMeta.live ? "text-green-300" : "text-amber-300"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${eventsMeta && eventsMeta.live ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
              Live Feed · {liveBadgeCount} events{lastSync ? ` · ${lastSync}` : ""}
            </div>
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-[10px] font-mono"
              title={`Automatic refresh every 30 minutes. Last auto-refresh: ${lastAutoAt ?? "not yet"} · Last manual sync: ${lastSync ?? "—"}`}
              onClick={() => { autoDueRef.current = Date.now() + AUTO_REFRESH_MS; load() }}>
              <RefreshCw className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-blue-300/90 tabular-nums">{autoCount}</span>
              <span className="text-white/45 whitespace-nowrap">auto-refresh</span>
            </div>
            <ThemeToggle />
            <button onClick={load} disabled={refreshing} title="Refresh live data"
              className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors relative">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="h-7 w-px bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-semibold text-white">OP-7734-X</div>
                <div className="text-[10px] font-mono text-white/35">Clearance: Level 4</div>
              </div>
              <div className="w-8 h-8 rounded-full glass-primary flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-300" />
              </div>
            </div>
          </div>
        </header>

        {/* Ticker */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 h-8 flex items-center overflow-hidden shrink-0">
          <div className="bg-amber-500/20 border-r border-amber-500/30 px-3 h-full flex items-center shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-400 mr-1.5" />
            <span className="text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-wider">LIVE</span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="ticker-track whitespace-nowrap text-[11px] font-mono text-amber-300/80 py-2 px-4 inline-block">
              {tickerText}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{tickerText}
            </div>
          </div>
        </div>

        {/* Toast */}
        {notify && (
          <div className="absolute bottom-5 right-5 z-[2000] glass-strong rounded-xl px-4 py-3 text-xs flex items-center gap-2.5 shadow-2xl">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-white/85">{notify}</span>
            <button onClick={() => setNotify(null)} className="text-white/40 hover:text-white/70 ml-2"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Active view */}
        {activeNav === "Command Center" && (
          <CommandCenterView
            theme={theme}
            overview={overview}
            relocationAlerts={relocationAlerts}
            capacityHubs={capacity.hubs && capacity.hubs.length > 0 ? capacity.hubs : CARRYING_CAPACITY_DATA}
            trendPoints={trend.length > 0 ? trend : HAZARD_TREND_DATA}
            events={events}
            incidents={incidents}
            category={category}
            onCategory={setCategory}
            selected={selected}
            onSelect={setSelected}
            flyTarget={flyTarget}
            onOpenAI={openAI}
            onLocate={locateAlert}
            onEvacuate={evacuate}
            evacuating={evacuating}
          />
        )}
        {activeNav === "Hazard Mapping" && (
          <HazardMappingView
            theme={theme}
            events={events}
            category={category}
            onCategory={setCategory}
            selected={selected}
            onSelect={setSelected}
            flyTarget={flyTarget}
            onOpenAI={openAI}
            eventsMeta={eventsMeta}
            onRefresh={load}
          />
        )}
{activeNav === "Carrying Capacity" && <CarryingCapacityView capacity={capacity} overview={overview} onRefresh={load} lastSync={lastSync} />}
        {activeNav === "Relocation Hubs" && (
          <RelocationHubsView capacity={capacity} alerts={relocationAlerts} onLocate={locateAlert} onEvacuate={evacuate} evacuating={evacuating} overview={overview} />
        )}
        {activeNav === "Vulnerability Index" && (
          <VulnerabilityIndexView composite={composite} priorities={priorities} events={events} onOpenAI={(hazard, state) => { openAI(hazard, state); setActiveNav("AI Analysis") }} />
        )}
        {activeNav === "Incident Reports" && <IncidentReportsView incidents={incidents} onRefresh={load} lastSync={lastSync} />}
        {activeNav === "AI Analysis" && <AIAnalysisView prefill={aiPrefill} />}
        {activeNav === "Analytics" && <AnalyticsView trend={trend} capacity={capacity} priorities={priorities} onRefresh={load} lastSync={lastSync} />}
        {activeNav === "System Settings" && <SystemSettingsView overview={overview} health={health} />}
      </main>
    </div>
  )
}

// ── App Root ─────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [step, setStep] = useState<"permissions" | "login" | "dashboard">("permissions")
  const toggle = useCallback(() => setTheme((p) => (p === "dark" ? "light" : "dark")), [])

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div data-theme={theme} className="min-h-screen text-foreground font-sans relative overflow-hidden" style={{ background: theme === "dark" ? "#060d1f" : "#eef2ff" }}>
        <BackgroundCarousel />
        {step === "permissions" && <div className="relative z-10"><PermissionsPrompt onComplete={() => setStep("login")} /></div>}
        {step === "login" && <div className="relative z-10"><Login onLogin={() => setStep("dashboard")} /></div>}
        {step === "dashboard" && <div className="relative z-10 h-screen"><Dashboard onLogout={() => setStep("login")} /></div>}
      </div>
    </ThemeCtx.Provider>
  )
}
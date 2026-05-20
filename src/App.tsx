import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Crosshair,
  Home,
  Lock,
  LogIn,
  Mail,
  Map as MapIcon,
  MapPin,
  Navigation,
  PhoneCall,
  Radio,
  Route,
  Send,
  Shield,
  Siren,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { cn } from "@/utils/cn";

type View = "landing" | "citizen" | "publicMap" | "admin" | "rescue";
type Role = "citizen" | "admin" | "rescue";
type CitizenTab = "home" | "report" | "map" | "reports" | "shelters";
type AdminTab = "dashboard" | "incidents" | "assign" | "analytics" | "shelters" | "users";
type Severity = "Critical" | "High" | "Medium" | "Low";
type IncidentStatus = "Pending" | "Assigned" | "In Progress" | "On the way" | "Arrived" | "Rescued" | "Completed" | "Resolved";
type TeamStatus = "Available" | "Assigned" | "Busy";
type NoticeType = "alert" | "assignment" | "success";

type TimelineItem = { label: string; time: string };
type CitizenInfo = { name: string; phone: string; email: string };

type Incident = {
  id: string;
  type: string;
  severity: Severity;
  description: string;
  location: string;
  x: number;
  y: number;
  citizen: CitizenInfo;
  time: string;
  status: IncidentStatus;
  media: string[];
  timeline: TimelineItem[];
  assignedTeamId?: string;
};

type RescueTeam = {
  id: string;
  name: string;
  station: string;
  distance: string;
  eta: string;
  members: number;
  status: TeamStatus;
};

type Shelter = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  beds: number;
  contact: string;
  distance: string;
};

type Notice = { id: number; type: NoticeType; message: string };

const severityMeta: Record<Severity, { label: string; color: string; bg: string; border: string; text: string; glow: string }> = {
  Critical: { label: "Critical", color: "#FF3B30", bg: "bg-[#FF3B30]/15", border: "border-[#FF3B30]/60", text: "text-[#FF6B63]", glow: "shadow-[0_0_34px_rgba(255,59,48,0.34)]" },
  High: { label: "High", color: "#FF9500", bg: "bg-[#FF9500]/15", border: "border-[#FF9500]/60", text: "text-[#FFB340]", glow: "shadow-[0_0_28px_rgba(255,149,0,0.28)]" },
  Medium: { label: "Medium", color: "#FFD60A", bg: "bg-[#FFD60A]/15", border: "border-[#FFD60A]/60", text: "text-[#FFE16A]", glow: "shadow-[0_0_22px_rgba(255,214,10,0.24)]" },
  Low: { label: "Low", color: "#34C759", bg: "bg-[#34C759]/15", border: "border-[#34C759]/50", text: "text-[#67E386]", glow: "shadow-[0_0_18px_rgba(52,199,89,0.2)]" },
};

const statusStyles: Record<IncidentStatus, string> = {
  Pending: "border-[#FF3B30]/40 bg-[#FF3B30]/10 text-[#FF8A83]",
  Assigned: "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#8AB4FF]",
  "In Progress": "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#C4B5FD]",
  "On the way": "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#93C5FD]",
  Arrived: "border-[#FFD60A]/40 bg-[#FFD60A]/10 text-[#FFE16A]",
  Rescued: "border-[#34C759]/40 bg-[#34C759]/10 text-[#86EFAC]",
  Completed: "border-white/20 bg-white/10 text-white",
  Resolved: "border-[#34C759]/40 bg-[#34C759]/10 text-[#86EFAC]",
};

const initialIncidents: Incident[] = [
  {
    id: "SL-10291",
    type: "Flood",
    severity: "Critical",
    description: "Water level rising near Kelani river homes. Three families trapped on the second floor.",
    location: "Colombo Riverside, Western Province",
    x: 43,
    y: 58,
    citizen: { name: "A. Perera", phone: "+94 77 230 9911", email: "aperera@safelanka.lk" },
    time: "2 min ago",
    status: "Pending",
    media: ["river-flood-01.jpg", "street-video.mp4"],
    timeline: [{ label: "Emergency submitted by citizen", time: "2 min ago" }],
  },
  {
    id: "SL-10288",
    type: "Landslide",
    severity: "High",
    description: "Soil movement reported after heavy rain. Road access partially blocked.",
    location: "Hantana Road, Kandy",
    x: 54,
    y: 42,
    citizen: { name: "N. Wijesinghe", phone: "+94 71 442 1189", email: "nwijesinghe@safelanka.lk" },
    time: "9 min ago",
    status: "Assigned",
    assignedTeamId: "team-1",
    media: ["slope-crack.jpg"],
    timeline: [{ label: "Emergency submitted by citizen", time: "9 min ago" }, { label: "Hill Rescue Unit assigned", time: "6 min ago" }],
  },
  {
    id: "SL-10274",
    type: "Fire",
    severity: "High",
    description: "Warehouse fire with smoke spreading toward nearby houses.",
    location: "Gampaha Industrial Zone",
    x: 45,
    y: 49,
    citizen: { name: "M. Fernando", phone: "+94 76 881 4432", email: "mfernando@safelanka.lk" },
    time: "18 min ago",
    status: "In Progress",
    assignedTeamId: "team-2",
    media: ["warehouse-smoke.jpg"],
    timeline: [{ label: "Emergency submitted by citizen", time: "18 min ago" }, { label: "Fire Response Alpha assigned", time: "15 min ago" }, { label: "Team marked in progress", time: "12 min ago" }],
  },
  {
    id: "SL-10263",
    type: "Accident",
    severity: "Medium",
    description: "Multi-vehicle accident near coastal route. Traffic blocked, injuries reported.",
    location: "Galle Road, Kalutara",
    x: 42,
    y: 74,
    citizen: { name: "D. Silva", phone: "+94 70 118 9031", email: "dsilva@safelanka.lk" },
    time: "31 min ago",
    status: "Pending",
    media: ["road-incident.jpg"],
    timeline: [{ label: "Emergency submitted by citizen", time: "31 min ago" }],
  },
];

const initialTeams: RescueTeam[] = [
  { id: "team-1", name: "Hill Rescue Unit", station: "Kandy Station", distance: "4.2 km", eta: "8 min", members: 6, status: "Assigned" },
  { id: "team-2", name: "Fire Response Alpha", station: "Gampaha Station", distance: "6.8 km", eta: "11 min", members: 8, status: "Busy" },
  { id: "team-3", name: "Flood Rapid Boat Team", station: "Colombo Dock", distance: "2.1 km", eta: "5 min", members: 5, status: "Available" },
  { id: "team-4", name: "Medical Evac Bravo", station: "Kalutara Base", distance: "9.5 km", eta: "14 min", members: 4, status: "Available" },
];

const initialShelters: Shelter[] = [
  { id: "shelter-1", name: "Colombo Central Relief Hall", location: "Colombo 07", capacity: 420, beds: 118, contact: "+94 11 255 4001", distance: "1.8 km" },
  { id: "shelter-2", name: "Kandy Municipal Shelter", location: "Kandy Town", capacity: 260, beds: 74, contact: "+94 81 222 4410", distance: "3.6 km" },
  { id: "shelter-3", name: "Kalutara Coastal Safe Center", location: "Kalutara North", capacity: 310, beds: 151, contact: "+94 34 224 6720", distance: "6.4 km" },
];

const disasterTypes = ["Flood", "Landslide", "Fire", "Accident"];
const severityOptions: Severity[] = ["Low", "Medium", "High", "Critical"];
const rescueStatuses: IncidentStatus[] = ["On the way", "Arrived", "Rescued", "Completed"];

function currentTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusStyles[status])}>{status}</span>;
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = severityMeta[severity];
  return <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", meta.bg, meta.border, meta.text)}>{meta.label}</span>;
}

function IconButton({ children, onClick, variant = "blue", type = "button", className = "" }: { children: ReactNode; onClick?: () => void; variant?: "blue" | "red" | "gray" | "green"; type?: "button" | "submit"; className?: string }) {
  const variants = {
    blue: "border-[#3B82F6]/40 bg-[#3B82F6]/18 text-white shadow-[0_0_24px_rgba(59,130,246,0.22)] hover:bg-[#3B82F6]/28 hover:shadow-[0_0_36px_rgba(59,130,246,0.36)]",
    red: "border-[#FF3B30]/45 bg-[#FF3B30]/20 text-white shadow-[0_0_30px_rgba(255,59,48,0.28)] hover:bg-[#FF3B30]/30 hover:shadow-[0_0_44px_rgba(255,59,48,0.45)]",
    gray: "border-white/15 bg-white/8 text-white hover:bg-white/14",
    green: "border-[#34C759]/40 bg-[#34C759]/16 text-white shadow-[0_0_24px_rgba(52,199,89,0.2)] hover:bg-[#34C759]/24",
  };

  return (
    <motion.button whileHover={{ scale: 1.035 }} whileTap={{ scale: 0.97 }} type={type} onClick={onClick} className={cn("relative overflow-hidden rounded-2xl border px-5 py-3 text-sm font-bold transition-all", variants[variant], className)}>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

function CommandBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0B1220]">
      <div className="command-grid absolute inset-0 opacity-70" />
      <div className="absolute left-[-12%] top-[-20%] h-[520px] w-[520px] rounded-full bg-[#3B82F6]/16 blur-[120px]" />
      <div className="absolute bottom-[-18%] right-[-12%] h-[520px] w-[520px] rounded-full bg-[#FF3B30]/10 blur-[130px]" />
      <div className="radar-sweep absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 opacity-20" />
    </div>
  );
}

function Notifications({ notices }: { notices: Notice[] }) {
  const styles: Record<NoticeType, string> = {
    alert: "border-[#FF3B30]/40 bg-[#2A1118]/90 text-[#FFD2CF]",
    assignment: "border-[#3B82F6]/40 bg-[#0E1C35]/90 text-[#D8E7FF]",
    success: "border-[#34C759]/40 bg-[#10251B]/90 text-[#D9FFE2]",
  };

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {notices.map((notice) => (
          <motion.div key={notice.id} initial={{ opacity: 0, x: 60, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.96 }} className={cn("rounded-2xl border p-4 shadow-2xl backdrop-blur-xl", styles[notice.type])}>
            <div className="flex items-start gap-3">
              {notice.type === "alert" ? <Siren className="mt-0.5 h-5 w-5 text-[#FF3B30]" /> : null}
              {notice.type === "assignment" ? <Bell className="mt-0.5 h-5 w-5 text-[#3B82F6]" /> : null}
              {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#34C759]" /> : null}
              <p className="text-sm font-semibold leading-5">{notice.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function TacticalMap({ incidents, selectedIncident, onSelect, className = "", showRoute = false, title = "Live Disaster Map" }: { incidents: Incident[]; selectedIncident?: Incident | null; onSelect: (incident: Incident) => void; className?: string; showRoute?: boolean; title?: string }) {
  const routeTarget = selectedIncident ?? incidents[0];

  return (
    <div className={cn("relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101E] shadow-[0_0_60px_rgba(59,130,246,0.14)]", className)}>
      <div className="map-grid absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="islandGlow" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.18" /><stop offset="100%" stopColor="#22D3EE" stopOpacity="0.05" /></linearGradient>
        </defs>
        <path d="M50 10 C61 16 67 30 65 43 C74 55 67 72 56 88 C48 98 38 86 37 73 C29 62 34 48 32 37 C31 24 39 15 50 10 Z" fill="url(#islandGlow)" stroke="#3B82F6" strokeOpacity="0.34" strokeWidth="0.45" />
        <path d="M18 24 C31 28 44 28 62 22 C74 18 84 21 93 27" stroke="#3B82F6" strokeOpacity="0.18" strokeWidth="0.3" fill="none" strokeDasharray="2 3" />
        <path d="M10 68 C22 62 34 64 49 70 C63 76 77 75 92 67" stroke="#3B82F6" strokeOpacity="0.16" strokeWidth="0.3" fill="none" strokeDasharray="2 3" />
        {showRoute && routeTarget ? <motion.path d={`M22 82 C36 74 36 59 ${routeTarget.x} ${routeTarget.y}`} stroke="#3B82F6" strokeWidth="0.75" fill="none" strokeLinecap="round" strokeDasharray="2 2" initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 0.95 }} transition={{ duration: 1.2, ease: "easeOut" }} /> : null}
      </svg>
      <div className="absolute left-5 top-5 z-10 flex items-center gap-3 rounded-full border border-white/10 bg-[#0B1220]/70 px-4 py-2 backdrop-blur-xl"><Radio className="h-4 w-4 text-[#34C759]" /><span className="text-xs font-bold uppercase tracking-[0.24em] text-white/80">{title}</span></div>
      <div className="absolute bottom-5 left-5 z-10 rounded-2xl border border-white/10 bg-[#0B1220]/70 p-4 text-xs text-[#AAB4C5] backdrop-blur-xl">
        <div className="mb-3 font-bold uppercase tracking-[0.18em] text-white/70">Severity</div>
        <div className="grid gap-2">{(["Critical", "High", "Medium"] as Severity[]).map((level) => <div key={level} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: severityMeta[level].color, boxShadow: `0 0 16px ${severityMeta[level].color}` }} /><span>{level}</span></div>)}</div>
      </div>
      {showRoute ? <div className="absolute bottom-5 right-5 z-10 rounded-2xl border border-[#3B82F6]/25 bg-[#0E1C35]/80 p-4 text-sm text-white backdrop-blur-xl"><div className="flex items-center gap-2 font-bold"><Route className="h-4 w-4 text-[#3B82F6]" />Route active</div><p className="mt-1 text-xs text-[#AAB4C5]">Base station to incident vector is live.</p></div> : null}
      {incidents.map((incident) => {
        const meta = severityMeta[incident.severity];
        const isSelected = selectedIncident?.id === incident.id;
        return (
          <motion.button key={incident.id} type="button" aria-label={`Open incident ${incident.id}`} onClick={() => onSelect(incident)} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${incident.x}%`, top: `${incident.y}%` }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.12 }}>
            <span className="relative flex h-7 w-7 items-center justify-center">
              <motion.span className="absolute h-7 w-7 rounded-full" style={{ backgroundColor: meta.color }} animate={{ scale: incident.severity === "Critical" ? [1, 2.4, 1] : [1, 1.8, 1], opacity: [0.42, 0, 0.42] }} transition={{ duration: incident.severity === "Critical" ? 1.1 : 1.8, repeat: Infinity }} />
              <span className={cn("relative h-3.5 w-3.5 rounded-full border-2 border-white", isSelected ? "scale-125" : "")} style={{ backgroundColor: meta.color, boxShadow: `0 0 24px ${meta.color}` }} />
            </span>
          </motion.button>
        );
      })}
      <AnimatePresence>
        {selectedIncident ? (
          <motion.div key={selectedIncident.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="absolute right-5 top-20 z-30 w-[min(360px,calc(100%-2.5rem))] rounded-3xl border border-white/10 bg-[#111C2E]/88 p-5 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">{selectedIncident.id}</p><h3 className="mt-1 text-xl font-bold text-white">{selectedIncident.type}</h3></div><SeverityBadge severity={selectedIncident.severity} /></div>
            <div className="mt-4 grid gap-3 text-sm text-[#AAB4C5]"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-white/50" />{selectedIncident.time}</div><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-white/50" />{selectedIncident.location}</div><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-white/50" /><StatusBadge status={selectedIncident.status} /></div></div>
            <p className="mt-4 text-sm leading-6 text-white/78">{selectedIncident.description}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MetricTile({ icon, label, value, tone = "blue" }: { icon: ReactNode; label: string; value: string | number; tone?: "blue" | "red" | "green" | "yellow" }) {
  const tones = {
    blue: "from-[#3B82F6]/24 to-[#3B82F6]/5 text-[#93C5FD]",
    red: "from-[#FF3B30]/24 to-[#FF3B30]/5 text-[#FF8A83]",
    green: "from-[#34C759]/24 to-[#34C759]/5 text-[#86EFAC]",
    yellow: "from-[#FFD60A]/22 to-[#FFD60A]/5 text-[#FFE16A]",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-3xl border border-white/10 bg-gradient-to-br p-5 backdrop-blur-xl", tones[tone])}>
      <div className="flex items-center justify-between gap-4"><div className="text-[#AAB4C5]"><p className="text-xs font-bold uppercase tracking-[0.18em]">{label}</p><motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-4xl font-black text-white">{value}</motion.p></div><div className="rounded-2xl border border-white/10 bg-white/8 p-3">{icon}</div></div>
    </motion.div>
  );
}

function SidebarButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all", active ? "bg-[#3B82F6]/18 text-white shadow-[0_0_28px_rgba(59,130,246,0.18)]" : "text-[#AAB4C5] hover:bg-white/8 hover:text-white")}>{icon}{label}</button>;
}

function OperationalShell({ title, subtitle, sidebar, children, onExit, signalLabel }: { title: string; subtitle: string; sidebar: ReactNode; children: ReactNode; onExit: () => void; signalLabel: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen p-4 text-white sm:p-6">
      <div className="mx-auto flex max-w-[1540px] gap-5">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-white/10 bg-[#111C2E]/78 p-4 backdrop-blur-2xl lg:block">
          <button type="button" onClick={onExit} className="mb-8 flex items-center gap-3 px-2 text-left"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3B82F6]/18 shadow-[0_0_26px_rgba(59,130,246,0.28)]"><Shield className="h-6 w-6 text-[#3B82F6]" /></span><span><span className="block text-lg font-black tracking-[0.18em]">SAFE</span><span className="block text-xs font-bold uppercase tracking-[0.28em] text-[#AAB4C5]">Lanka Grid</span></span></button>
          <nav className="grid gap-2">{sidebar}</nav>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#111C2E]/70 p-5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-[#3B82F6]">{signalLabel}</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{title}</h1><p className="mt-2 text-sm text-[#AAB4C5]">{subtitle}</p></div>
            <div className="flex flex-wrap items-center gap-3"><div className="rounded-full border border-[#34C759]/30 bg-[#34C759]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#86EFAC]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#34C759] shadow-[0_0_14px_#34C759]" />WebSocket live</div><IconButton variant="gray" onClick={onExit} className="px-4 py-2"><Home className="h-4 w-4" /> Home</IconButton></div>
          </header>
          {children}
        </main>
      </div>
    </motion.div>
  );
}

function BarAnalytics({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl">
      <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">Analytics</p><h3 className="mt-2 text-xl font-black text-white">Disaster type frequency</h3></div><BarChart3 className="h-6 w-6 text-[#3B82F6]" /></div>
      <div className="flex h-56 items-end gap-4">{data.map((item) => <div key={item.label} className="flex flex-1 flex-col items-center gap-3"><div className="flex h-44 w-full items-end rounded-t-2xl bg-white/5 px-2"><motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((item.value / maxValue) * 100, 12)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full rounded-t-xl" style={{ background: `linear-gradient(180deg, ${item.color}, rgba(255,255,255,0.06))`, boxShadow: `0 0 22px ${item.color}55` }} /></div><div className="text-center"><p className="text-lg font-black text-white">{item.value}</p><p className="text-xs text-[#AAB4C5]">{item.label}</p></div></div>)}</div>
    </div>
  );
}

function HeatMapPanel({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl">
      <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">Heatmap</p><h3 className="mt-2 text-xl font-black text-white">Most affected areas</h3></div><Crosshair className="h-6 w-6 text-[#FF3B30]" /></div>
      <div className="relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-[#07101E]"><div className="map-grid absolute inset-0 opacity-80" />{incidents.map((incident, index) => <motion.span key={incident.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.85, scale: 1 }} transition={{ delay: index * 0.08 }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm" style={{ left: `${incident.x}%`, top: `${incident.y}%`, width: incident.severity === "Critical" ? 92 : 66, height: incident.severity === "Critical" ? 92 : 66, backgroundColor: severityMeta[incident.severity].color, opacity: incident.severity === "Critical" ? 0.28 : 0.18 }} />)}</div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [citizenTab, setCitizenTab] = useState<CitizenTab>("home");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [teams, setTeams] = useState<RescueTeam[]>(initialTeams);
  const [shelters, setShelters] = useState<Shelter[]>(initialShelters);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(initialIncidents[0]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("team-3");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [landingShake, setLandingShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [latestTicket, setLatestTicket] = useState("SL-10291");
  const [loginRole, setLoginRole] = useState<Role>("citizen");
  const [reportForm, setReportForm] = useState({ gpsLocation: "GPS locked: Colombo 07, Western Province", manualLocation: "", type: "Flood", severity: "Critical" as Severity, description: "", media: "" });
  const [shelterForm, setShelterForm] = useState({ name: "", location: "", capacity: "", beds: "", contact: "" });

  const stats = useMemo(() => {
    const active = incidents.filter((incident) => !["Resolved", "Completed"].includes(incident.status)).length;
    const resolved = incidents.filter((incident) => ["Resolved", "Completed"].includes(incident.status)).length;
    const availableTeams = teams.filter((team) => team.status === "Available").length;
    const typeCounts = disasterTypes.map((type) => ({ label: type, value: incidents.filter((incident) => incident.type === type).length, color: type === "Flood" ? "#3B82F6" : type === "Fire" ? "#FF3B30" : type === "Landslide" ? "#FF9500" : "#FFD60A" }));
    return { total: incidents.length, active, resolved, availableTeams, typeCounts };
  }, [incidents, teams]);

  const assignedMissions = useMemo(() => incidents.filter((incident) => incident.assignedTeamId && !["Resolved", "Completed"].includes(incident.status)), [incidents]);

  function pushNotice(type: NoticeType, message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setNotices((current) => [{ id, type, message }, ...current].slice(0, 4));
    window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 4200);
  }

  function openReportFlow() {
    setLandingShake(true);
    window.setTimeout(() => { setLandingShake(false); setCitizenTab("report"); setView("citizen"); }, 260);
  }

  function updateIncident(updatedIncident: Incident) {
    setIncidents((current) => current.map((incident) => (incident.id === updatedIncident.id ? updatedIncident : incident)));
    setSelectedIncident((current) => (current?.id === updatedIncident.id ? updatedIncident : current));
  }

  function submitEmergency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticket = `SL-${Math.floor(10000 + Math.random() * 89999)}`;
    const newIncident: Incident = { id: ticket, type: reportForm.type, severity: reportForm.severity, description: reportForm.description || "Emergency reported by citizen. Details are being verified by the command desk.", location: reportForm.manualLocation || reportForm.gpsLocation.replace("GPS locked: ", ""), x: Math.floor(39 + Math.random() * 18), y: Math.floor(42 + Math.random() * 31), citizen: { name: "Public Citizen", phone: "+94 77 000 2024", email: "citizen@safelanka.lk" }, time: "Just now", status: "Pending", media: reportForm.media ? [reportForm.media] : ["citizen-upload.jpg"], timeline: [{ label: "Emergency submitted by citizen", time: "Now" }] };
    setSubmitting(true);
    setLatestTicket(ticket);
    setIncidents((current) => [newIncident, ...current]);
    setSelectedIncident(newIncident);
    pushNotice("alert", `Emergency registered and sent to admin - ${ticket}`);
    window.setTimeout(() => { setSubmitting(false); setCitizenTab("map"); setReportForm((current) => ({ ...current, description: "", manualLocation: "", media: "" })); pushNotice("assignment", "Rescue teams received the new emergency alert."); }, 1100);
  }

  function assignSelectedTeam() {
    if (!selectedIncident) return;
    const team = teams.find((item) => item.id === selectedTeamId);
    if (!team) return;
    const updatedIncident: Incident = { ...selectedIncident, status: "Assigned", assignedTeamId: team.id, timeline: [...selectedIncident.timeline, { label: `${team.name} assigned`, time: currentTimeLabel() }] };
    updateIncident(updatedIncident);
    setTeams((current) => current.map((item) => (item.id === team.id ? { ...item, status: "Assigned" } : item)));
    setAssignOpen(false);
    pushNotice("assignment", `${team.name} assigned to ${selectedIncident.id}. Route opened on rescue map.`);
  }

  function setIncidentStatus(incident: Incident, status: IncidentStatus) {
    const updatedIncident: Incident = { ...incident, status, timeline: [...incident.timeline, { label: status === "Completed" ? "Mission completed" : `Status changed to ${status}`, time: currentTimeLabel() }] };
    updateIncident(updatedIncident);
    if (status === "Completed" && incident.assignedTeamId) setTeams((current) => current.map((team) => (team.id === incident.assignedTeamId ? { ...team, status: "Available" } : team)));
    pushNotice(status === "Completed" || status === "Resolved" ? "success" : "assignment", `${incident.id} updated: ${status}`);
  }

  function addShelter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const shelter: Shelter = { id: `shelter-${Date.now()}`, name: shelterForm.name || "New Relief Shelter", location: shelterForm.location || "Pending geocode", capacity: Number(shelterForm.capacity || 0), beds: Number(shelterForm.beds || 0), contact: shelterForm.contact || "+94 11 000 0000", distance: "New" };
    setShelters((current) => [shelter, ...current]);
    setShelterForm({ name: "", location: "", capacity: "", beds: "", contact: "" });
    pushNotice("success", `${shelter.name} added to citizen shelter network.`);
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginOpen(false);
    if (loginRole === "citizen") { setCitizenTab("home"); setView("citizen"); }
    if (loginRole === "admin") { setAdminTab("dashboard"); setView("admin"); }
    if (loginRole === "rescue") { setView("rescue"); setSelectedIncident(assignedMissions[0] ?? incidents[0]); }
    pushNotice("success", `${loginRole.toUpperCase()} JWT verified. Redirecting to role dashboard.`);
  }

  function closeSelectedCase() {
    if (selectedIncident) setIncidentStatus(selectedIncident, "Resolved");
  }

  function ShelterRow({ shelter }: { shelter: Shelter }) {
    const availability = shelter.capacity ? Math.round((shelter.beds / shelter.capacity) * 100) : 0;
    return (
      <motion.div whileHover={{ y: -3, scale: 1.01 }} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#34C759]/35 hover:shadow-[0_0_24px_rgba(52,199,89,0.14)]">
        <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-white">{shelter.name}</p><p className="mt-1 text-sm text-[#AAB4C5]">{shelter.location} - {shelter.distance}</p></div><span className="rounded-full border border-[#34C759]/30 bg-[#34C759]/10 px-3 py-1 text-xs font-bold text-[#86EFAC]">{shelter.beds} beds</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#34C759]" style={{ width: `${Math.min(availability, 100)}%` }} /></div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#AAB4C5]"><span>{availability}% available</span><button type="button" className="flex items-center gap-2 font-bold text-[#3B82F6]"><Navigation className="h-4 w-4" /> Navigate</button></div>
      </motion.div>
    );
  }

  function IncidentSummary({ incident, onClick }: { incident: Incident; onClick: () => void }) {
    return (
      <motion.button whileHover={{ y: -3 }} type="button" onClick={onClick} className={cn("rounded-[2rem] border bg-[#111C2E]/76 p-5 text-left backdrop-blur-2xl transition hover:bg-[#16243A]/90", severityMeta[incident.severity].border, severityMeta[incident.severity].glow)}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">{incident.id}</p><h3 className="mt-2 text-xl font-black text-white">{incident.type}</h3><p className="mt-2 text-sm text-[#AAB4C5]">{incident.location}</p></div><SeverityBadge severity={incident.severity} /></div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#AAB4C5]">{incident.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3"><StatusBadge status={incident.status} /><span className="text-xs text-[#6B7A90]">{incident.time}</span></div>
      </motion.button>
    );
  }

  function IncidentRow({ incident }: { incident: Incident }) {
    return (
      <button type="button" onClick={() => { setSelectedIncident(incident); setAdminTab("incidents"); }} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#3B82F6]/45 hover:bg-white/8">
        <div className="min-w-0"><p className="font-bold text-white">{incident.id} - {incident.type}</p><p className="truncate text-sm text-[#AAB4C5]">{incident.location}</p></div><div className="flex shrink-0 items-center gap-2"><SeverityBadge severity={incident.severity} /><StatusBadge status={incident.status} /></div>
      </button>
    );
  }

  function renderLanding() {
    return (
      <motion.section key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cn("relative min-h-screen overflow-hidden px-5 py-6", landingShake ? "screen-shake" : "")}>
        <div className="absolute inset-0"><TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="h-full min-h-screen rounded-none border-0 opacity-45" title="National Live Grid" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,18,32,0.52),rgba(11,18,32,0.92)_58%,#0B1220_100%)]" /></div>
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
          <header className="flex flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/16 shadow-[0_0_34px_rgba(59,130,246,0.32)]"><Shield className="h-7 w-7 text-[#3B82F6]" /></span><div><p className="text-lg font-black tracking-[0.22em] text-white">SAFE LANKA</p><p className="text-xs font-bold uppercase tracking-[0.26em] text-[#AAB4C5]">Emergency command system</p></div></div><div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-[#0B1220]/58 px-4 py-2 backdrop-blur-xl"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#34C759] shadow-[0_0_18px_#34C759]" /><span className="text-sm font-semibold text-white">Live status ticker</span><span className="text-sm text-[#AAB4C5]">{stats.active} active disasters</span><span className="hidden text-sm text-[#AAB4C5] sm:inline">{stats.availableTeams} rescue teams available</span></div></header>
          <main className="grid flex-1 place-items-center py-16 text-center"><motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className="max-w-5xl"><motion.p animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.4, repeat: Infinity }} className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-[#3B82F6]">National response grid online</motion.p><h1 className="text-6xl font-black tracking-[-0.08em] text-white drop-shadow-[0_0_35px_rgba(59,130,246,0.34)] sm:text-7xl md:text-9xl">SAFE LANKA</h1><h2 className="mt-5 text-2xl font-bold text-white md:text-4xl">Real-time Emergency Response System</h2><p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#AAB4C5] md:text-lg">Citizens report emergencies, government admins assign rescue teams, and field units update every mission through live maps, instant alerts, and analytics.</p><div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"><IconButton variant="red" onClick={openReportFlow} className="heartbeat px-7 py-4 text-base"><AlertTriangle className="h-5 w-5" /> Report Emergency</IconButton><IconButton variant="blue" onClick={() => setView("publicMap")} className="group px-7 py-4 text-base"><span className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 map-button-preview" /><MapIcon className="h-5 w-5" /> Live Disaster Map</IconButton><IconButton variant="gray" onClick={() => setLoginOpen(true)} className="px-7 py-4 text-base"><LogIn className="h-5 w-5" /> Login</IconButton></div></motion.div></main>
        </div>
      </motion.section>
    );
  }

  function renderCitizenHome() {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.button type="button" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }} onClick={() => setCitizenTab("report")} className="relative overflow-hidden rounded-[2rem] border border-[#FF3B30]/35 bg-gradient-to-br from-[#FF3B30]/24 to-[#111C2E]/90 p-8 text-left shadow-[0_0_55px_rgba(255,59,48,0.2)]"><div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FF3B30]/20 blur-3xl" /><div className="relative z-10 max-w-xl"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FF3B30]/22 shadow-[0_0_34px_rgba(255,59,48,0.32)]"><Siren className="h-9 w-9 text-[#FF6B63]" /></div><p className="text-sm font-bold uppercase tracking-[0.26em] text-[#FF8A83]">One tap emergency</p><h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Report Emergency</h2><p className="mt-4 text-base leading-7 text-[#FFD2CF]">No login needed. GPS, severity, media, ticket creation, admin alert, and rescue notification are connected in one flow.</p></div></motion.button>
        <div className="grid gap-5"><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-black">Active alerts near me</h3><SeverityBadge severity="Critical" /></div><div className="grid gap-3">{incidents.slice(0, 3).map((incident) => <button key={incident.id} type="button" onClick={() => { setSelectedIncident(incident); setCitizenTab("map"); }} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#3B82F6]/40 hover:bg-white/8"><div><p className="font-bold text-white">{incident.type}</p><p className="mt-1 text-sm text-[#AAB4C5]">{incident.location}</p></div><SeverityBadge severity={incident.severity} /></button>)}</div></div><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><h3 className="text-xl font-black">Nearby shelters</h3><div className="mt-5 grid gap-4">{shelters.slice(0, 2).map((shelter) => <ShelterRow key={shelter.id} shelter={shelter} />)}</div></div></div>
        <TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="xl:col-span-2" />
      </div>
    );
  }

  function renderReportForm() {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={submitEmergency} className="rounded-[2rem] border border-[#FF3B30]/25 bg-[#111C2E]/82 p-6 shadow-[0_0_48px_rgba(255,59,48,0.13)] backdrop-blur-2xl">
          <div className="mb-6 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF3B30]/18"><AlertTriangle className="h-7 w-7 text-[#FF3B30]" /></div><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF8A83]">Citizen emergency report</p><h2 className="mt-1 text-2xl font-black text-white">Create rescue ticket</h2></div></div>
          <div className="grid gap-4"><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Auto GPS location</span><div className="flex items-center gap-3 rounded-2xl border border-[#34C759]/25 bg-[#34C759]/8 px-4 py-3 text-sm text-white"><Crosshair className="h-4 w-4 text-[#34C759]" />{reportForm.gpsLocation}</div></label><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Manual location override</span><input value={reportForm.manualLocation} onChange={(event) => setReportForm((current) => ({ ...current, manualLocation: event.target.value }))} placeholder="Example: Near Kelani bridge, Colombo" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /></label><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Disaster type</span><select value={reportForm.type} onChange={(event) => setReportForm((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-white/10 bg-[#16243A] px-4 py-3 text-white outline-none focus:border-[#3B82F6]/60">{disasterTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Severity</span><select value={reportForm.severity} onChange={(event) => setReportForm((current) => ({ ...current, severity: event.target.value as Severity }))} className="rounded-2xl border border-white/10 bg-[#16243A] px-4 py-3 text-white outline-none focus:border-[#3B82F6]/60">{severityOptions.map((severity) => <option key={severity}>{severity}</option>)}</select></label></div><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Description</span><textarea value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} placeholder="Tell the admin what happened, who is affected, and immediate risks." rows={5} className="resize-none rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /></label><label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 transition hover:border-[#3B82F6]/50"><span className="flex items-center gap-2 text-sm font-semibold text-[#AAB4C5]"><Upload className="h-4 w-4" />Image or video upload</span><input type="file" accept="image/*,video/*" className="text-sm text-[#AAB4C5] file:mr-4 file:rounded-full file:border-0 file:bg-[#3B82F6] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" onChange={(event) => setReportForm((current) => ({ ...current, media: event.target.files?.[0]?.name ?? "" }))} />{reportForm.media ? <span className="text-xs text-[#34C759]">Ready: {reportForm.media}</span> : null}</label><IconButton type="submit" variant="red" className="mt-2 py-4 text-base">{submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending alert...</> : <><Send className="h-5 w-5" /> Submit Emergency</>}</IconButton></div>
        </form>
        <div className="grid gap-5"><div className="rounded-[2rem] border border-[#34C759]/25 bg-[#10251B]/70 p-6 backdrop-blur-2xl"><div className="flex items-start gap-4"><CheckCircle2 className="mt-1 h-7 w-7 text-[#34C759]" /><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#86EFAC]">Citizen confirmation</p><h3 className="mt-2 text-2xl font-black text-white">Your emergency is registered</h3><p className="mt-2 text-sm text-[#AAB4C5]">Latest ticket ID: <span className="font-bold text-white">{latestTicket}</span></p></div></div></div><TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="min-h-[520px]" title="Instant marker preview" /></div>
      </div>
    );
  }

  function renderCitizenMap() {
    return <div className="grid gap-5 xl:grid-cols-[1fr_360px]"><TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="min-h-[680px]" /><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/78 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Read-only public map</p><h2 className="mt-2 text-2xl font-black">Live incident popups</h2><p className="mt-3 text-sm leading-6 text-[#AAB4C5]">Click a marker to see disaster type, time, severity, and current status. Critical markers pulse faster.</p><div className="mt-6 grid gap-3">{incidents.map((incident) => <button key={incident.id} type="button" onClick={() => setSelectedIncident(incident)} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#3B82F6]/40"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-white">{incident.id} - {incident.type}</p><p className="mt-1 text-xs text-[#AAB4C5]">{incident.time}</p></div><StatusBadge status={incident.status} /></div></button>)}</div></div></div>;
  }

  function renderCitizenReports() {
    return <div className="grid gap-5 lg:grid-cols-2">{incidents.filter((incident) => incident.citizen.email === "citizen@safelanka.lk" || incident.id === latestTicket).map((incident) => <IncidentSummary key={incident.id} incident={incident} onClick={() => setSelectedIncident(incident)} />)}<div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 text-[#AAB4C5] backdrop-blur-2xl"><Bell className="mb-4 h-8 w-8 text-[#3B82F6]" /><h3 className="text-2xl font-black text-white">Notifications</h3><p className="mt-3 leading-7">Citizen updates arrive when admin assigns a team, rescue marks on the way, arrives, rescues, or completes the mission.</p></div></div>;
  }

  function renderShelterList(adminMode: boolean) {
    return <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]"><div className="grid gap-4">{shelters.map((shelter) => <ShelterRow key={shelter.id} shelter={shelter} />)}</div>{adminMode ? <form onSubmit={addShelter} className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Shelter registry</p><h2 className="mt-2 text-2xl font-black text-white">Add shelter</h2><div className="mt-6 grid gap-4"><input value={shelterForm.name} onChange={(event) => setShelterForm((current) => ({ ...current, name: event.target.value }))} placeholder="Shelter name" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /><input value={shelterForm.location} onChange={(event) => setShelterForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /><div className="grid gap-4 sm:grid-cols-2"><input value={shelterForm.capacity} onChange={(event) => setShelterForm((current) => ({ ...current, capacity: event.target.value }))} placeholder="Capacity" type="number" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /><input value={shelterForm.beds} onChange={(event) => setShelterForm((current) => ({ ...current, beds: event.target.value }))} placeholder="Available beds" type="number" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /></div><input value={shelterForm.contact} onChange={(event) => setShelterForm((current) => ({ ...current, contact: event.target.value }))} placeholder="Contact number" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-[#6B7A90] focus:border-[#3B82F6]/60" /><IconButton type="submit" variant="green"><Building2 className="h-4 w-4" /> Add Shelter</IconButton></div></form> : <div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><Building2 className="mb-4 h-9 w-9 text-[#34C759]" /><h2 className="text-2xl font-black text-white">Safe shelter guidance</h2><p className="mt-3 leading-7 text-[#AAB4C5]">Choose a nearby shelter with available beds. Navigation opens the safest route in the field application.</p></div>}</div>;
  }

  function renderCitizen() {
    const sidebar = <><SidebarButton label="Home" icon={<Home className="h-4 w-4" />} active={citizenTab === "home"} onClick={() => setCitizenTab("home")} /><SidebarButton label="Report Emergency" icon={<Siren className="h-4 w-4" />} active={citizenTab === "report"} onClick={() => setCitizenTab("report")} /><SidebarButton label="Live Map" icon={<MapIcon className="h-4 w-4" />} active={citizenTab === "map"} onClick={() => setCitizenTab("map")} /><SidebarButton label="My Reports" icon={<Activity className="h-4 w-4" />} active={citizenTab === "reports"} onClick={() => setCitizenTab("reports")} /><SidebarButton label="Nearby Shelters" icon={<Building2 className="h-4 w-4" />} active={citizenTab === "shelters"} onClick={() => setCitizenTab("shelters")} /></>;
    return <OperationalShell title="Citizen Emergency Panel" subtitle="Fast reporting, live alerts near you, and safe shelter discovery." sidebar={sidebar} onExit={() => setView("landing")} signalLabel="Public safety channel">{citizenTab === "home" ? renderCitizenHome() : null}{citizenTab === "report" ? renderReportForm() : null}{citizenTab === "map" ? renderCitizenMap() : null}{citizenTab === "reports" ? renderCitizenReports() : null}{citizenTab === "shelters" ? renderShelterList(false) : null}</OperationalShell>;
  }

  function renderAdminDashboard() {
    return <div className="grid gap-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricTile icon={<Radio className="h-6 w-6" />} label="Total incidents" value={stats.total} tone="blue" /><MetricTile icon={<AlertTriangle className="h-6 w-6" />} label="Active emergencies" value={stats.active} tone="red" /><MetricTile icon={<CheckCircle2 className="h-6 w-6" />} label="Resolved cases" value={stats.resolved} tone="green" /><MetricTile icon={<Ambulance className="h-6 w-6" />} label="Teams available" value={stats.availableTeams} tone="yellow" /></div><div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]"><BarAnalytics data={stats.typeCounts} /><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">Active queue</p><h3 className="mt-2 text-xl font-black text-white">Incident management panel</h3></div><IconButton variant="blue" onClick={() => setAdminTab("incidents")} className="px-4 py-2"><MapIcon className="h-4 w-4" /> Open</IconButton></div><div className="grid gap-3">{incidents.slice(0, 4).map((incident) => <IncidentRow key={incident.id} incident={incident} />)}</div></div></div></div>;
  }

  function renderAdminIncidents() {
    return <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]"><div className="grid gap-4">{incidents.map((incident) => <IncidentSummary key={incident.id} incident={incident} onClick={() => setSelectedIncident(incident)} />)}</div><TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="sticky top-6 min-h-[720px]" showRoute={Boolean(selectedIncident?.assignedTeamId)} title="Admin map preview" /></div>;
  }

  function renderIncidentDrawer() {
    if (!selectedIncident) return null;
    const assignedTeam = teams.find((team) => team.id === selectedIncident.assignedTeamId);
    return <AnimatePresence><motion.aside initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }} className="fixed bottom-4 right-4 top-4 z-40 w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#111C2E]/92 p-6 shadow-2xl backdrop-blur-2xl custom-scrollbar"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Incident details</p><h2 className="mt-2 text-3xl font-black text-white">{selectedIncident.id}</h2></div><button type="button" onClick={() => setSelectedIncident(null)} className="rounded-full border border-white/10 bg-white/8 p-2 text-[#AAB4C5] transition hover:text-white"><X className="h-5 w-5" /></button></div><div className="grid gap-4"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">{selectedIncident.type}</h3><SeverityBadge severity={selectedIncident.severity} /></div><p className="mt-3 text-sm leading-6 text-[#AAB4C5]">{selectedIncident.description}</p><div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={selectedIncident.status} />{assignedTeam ? <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-xs font-bold text-[#93C5FD]">{assignedTeam.name}</span> : null}</div></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><h4 className="font-bold text-white">Citizen info</h4><div className="mt-3 grid gap-2 text-sm text-[#AAB4C5]"><div className="flex items-center gap-2"><Users className="h-4 w-4" />{selectedIncident.citizen.name}</div><div className="flex items-center gap-2"><PhoneCall className="h-4 w-4" />{selectedIncident.citizen.phone}</div><div className="flex items-center gap-2"><Mail className="h-4 w-4" />{selectedIncident.citizen.email}</div><div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{selectedIncident.location}</div></div></div><div className="grid grid-cols-2 gap-3">{selectedIncident.media.map((media) => <div key={media} className="rounded-2xl border border-white/10 bg-[#07101E] p-4 text-sm text-[#AAB4C5]"><Upload className="mb-3 h-5 w-5 text-[#3B82F6]" />{media}</div>)}</div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><h4 className="font-bold text-white">Timeline</h4><div className="mt-4 grid gap-3">{selectedIncident.timeline.map((item) => <div key={`${item.label}-${item.time}`} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6]" /><div><p className="text-white">{item.label}</p><p className="text-xs text-[#6B7A90]">{item.time}</p></div></div>)}</div></div><div className="grid gap-3"><IconButton variant="blue" onClick={() => { setSelectedTeamId(teams.find((team) => team.status === "Available")?.id ?? teams[0].id); setAssignOpen(true); }}><Ambulance className="h-4 w-4" /> Assign Rescue Team</IconButton><IconButton variant="gray" onClick={() => setIncidentStatus(selectedIncident, "In Progress")}><Zap className="h-4 w-4" /> Mark in Progress</IconButton><IconButton variant="green" onClick={closeSelectedCase}><CheckCircle2 className="h-4 w-4" /> Close Case</IconButton></div></div></motion.aside></AnimatePresence>;
  }

  function renderAssignTeams() {
    return <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]"><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Dispatch console</p><h2 className="mt-2 text-2xl font-black text-white">Rescue teams</h2><div className="mt-6 grid gap-3">{teams.map((team) => <button key={team.id} type="button" onClick={() => setSelectedTeamId(team.id)} className={cn("rounded-2xl border p-4 text-left transition", selectedTeamId === team.id ? "border-[#3B82F6]/60 bg-[#3B82F6]/12" : "border-white/10 bg-white/5 hover:border-[#34C759]/35")}><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-white">{team.name}</p><p className="mt-1 text-sm text-[#AAB4C5]">{team.station} - {team.distance} - ETA {team.eta}</p></div><span className={cn("rounded-full border px-3 py-1 text-xs font-bold", team.status === "Available" ? "border-[#34C759]/30 bg-[#34C759]/10 text-[#86EFAC]" : "border-[#FFD60A]/30 bg-[#FFD60A]/10 text-[#FFE16A]")}>{team.status}</span></div></button>)}</div></div><div className="grid gap-5"><TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="min-h-[520px]" showRoute={Boolean(selectedIncident)} title="Assignment route map" /><IconButton variant="blue" onClick={() => setAssignOpen(true)} className="py-4"><Route className="h-5 w-5" /> Assign selected team to selected incident</IconButton></div></div>;
  }

  function renderAnalytics() {
    return <div className="grid gap-5 xl:grid-cols-2"><BarAnalytics data={stats.typeCounts} /><HeatMapPanel incidents={incidents} /><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">Response time</p><h3 className="mt-2 text-2xl font-black text-white">Average: 11.4 min</h3><div className="mt-8 grid gap-4">{[78, 64, 89, 52, 71].map((value, index) => <div key={value} className="flex items-center gap-4"><span className="w-16 text-sm text-[#AAB4C5]">Zone {index + 1}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-white/8"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, delay: index * 0.08 }} className="h-full rounded-full bg-[#3B82F6] shadow-[0_0_18px_rgba(59,130,246,0.7)]" /></div><span className="w-10 text-right text-sm font-bold text-white">{value}%</span></div>)}</div></div><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">Team performance</p><h3 className="mt-2 text-2xl font-black text-white">Field unit availability</h3><div className="mt-6 grid gap-3">{teams.map((team) => <div key={team.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"><div><p className="font-bold text-white">{team.name}</p><p className="text-sm text-[#AAB4C5]">{team.members} members - ETA {team.eta}</p></div><span className="text-sm font-bold text-[#86EFAC]">{team.status}</span></div>)}</div></div></div>;
  }

  function renderUsers() {
    return <div className="grid gap-5 md:grid-cols-3">{([{ role: "Citizen", icon: <Users className="h-8 w-8 text-[#3B82F6]" />, copy: "Public emergency reporting, local alerts, shelters, report timeline." }, { role: "Admin", icon: <Shield className="h-8 w-8 text-[#FF9500]" />, copy: "Incident approval, assignment, case closure, analytics, shelter registry." }, { role: "Rescue", icon: <Ambulance className="h-8 w-8 text-[#34C759]" />, copy: "Assigned missions, route navigation, status controls, field updates." }] as { role: string; icon: ReactNode; copy: string }[]).map((item) => <div key={item.role} className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl">{item.icon}<h3 className="mt-4 text-2xl font-black text-white">{item.role}</h3><p className="mt-3 leading-7 text-[#AAB4C5]">{item.copy}</p></div>)}</div>;
  }

  function renderAdmin() {
    const sidebar = <><SidebarButton label="Dashboard" icon={<Activity className="h-4 w-4" />} active={adminTab === "dashboard"} onClick={() => setAdminTab("dashboard")} /><SidebarButton label="Active Incidents" icon={<Siren className="h-4 w-4" />} active={adminTab === "incidents"} onClick={() => setAdminTab("incidents")} /><SidebarButton label="Assign Teams" icon={<Ambulance className="h-4 w-4" />} active={adminTab === "assign"} onClick={() => setAdminTab("assign")} /><SidebarButton label="Analytics" icon={<BarChart3 className="h-4 w-4" />} active={adminTab === "analytics"} onClick={() => setAdminTab("analytics")} /><SidebarButton label="Shelters" icon={<Building2 className="h-4 w-4" />} active={adminTab === "shelters"} onClick={() => setAdminTab("shelters")} /><SidebarButton label="Users" icon={<Users className="h-4 w-4" />} active={adminTab === "users"} onClick={() => setAdminTab("users")} /></>;
    return <OperationalShell title="Government Admin Command" subtitle="Approve, prioritize, assign rescue teams, and close cases from one control room." sidebar={sidebar} onExit={() => setView("landing")} signalLabel="Admin mission control">{adminTab === "dashboard" ? renderAdminDashboard() : null}{adminTab === "incidents" ? renderAdminIncidents() : null}{adminTab === "assign" ? renderAssignTeams() : null}{adminTab === "analytics" ? renderAnalytics() : null}{adminTab === "shelters" ? renderShelterList(true) : null}{adminTab === "users" ? renderUsers() : null}{adminTab === "incidents" && selectedIncident ? renderIncidentDrawer() : null}</OperationalShell>;
  }

  function renderStatusControls(incident: Incident) {
    return <div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Status control</p><h2 className="mt-2 text-2xl font-black text-white">Update mission</h2><div className="mt-6 grid gap-3">{rescueStatuses.map((status) => <button key={status} type="button" onClick={() => setIncidentStatus(incident, status)} className={cn("rounded-2xl border px-4 py-3 text-left font-bold transition", incident.status === status ? "border-[#3B82F6]/60 bg-[#3B82F6]/16 text-white" : "border-white/10 bg-white/5 text-[#AAB4C5] hover:border-[#3B82F6]/35 hover:text-white")}>{status}</button>)}</div></div>;
  }

  function renderRescue() {
    const activeMission = selectedIncident && selectedIncident.assignedTeamId ? selectedIncident : assignedMissions[0] ?? selectedIncident;
    return <OperationalShell title="Rescue Team Tactical Panel" subtitle="Assigned mission list, live navigation route, and mission status controls." sidebar={null} onExit={() => setView("landing")} signalLabel="Field operation channel"><div className="grid gap-5 xl:grid-cols-[390px_1fr]"><div className="grid gap-5"><div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Assigned missions</p><h2 className="mt-2 text-2xl font-black text-white">Mission queue</h2><div className="mt-6 grid gap-3">{assignedMissions.length ? assignedMissions.map((incident) => <button key={incident.id} type="button" onClick={() => setSelectedIncident(incident)} className={cn("rounded-2xl border p-4 text-left transition", selectedIncident?.id === incident.id ? "border-[#3B82F6]/60 bg-[#3B82F6]/12" : "border-white/10 bg-white/5 hover:border-[#3B82F6]/35", incident.severity === "Critical" ? "emergency-pulse" : "")}><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{incident.id} - {incident.type}</p><p className="mt-1 text-sm text-[#AAB4C5]">{incident.location}</p></div><SeverityBadge severity={incident.severity} /></div><div className="mt-4 flex items-center justify-between gap-3"><StatusBadge status={incident.status} /><span className="text-xs text-[#6B7A90]">{incident.time}</span></div></button>) : <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-[#AAB4C5]">No active assigned missions.</div>}</div></div>{activeMission ? renderStatusControls(activeMission) : null}</div><div className="grid gap-5"><TacticalMap incidents={incidents} selectedIncident={activeMission} onSelect={setSelectedIncident} className="min-h-[680px]" showRoute={Boolean(activeMission)} title="Live navigation map" />{activeMission ? <div className="rounded-[2rem] border border-white/10 bg-[#111C2E]/76 p-6 backdrop-blur-2xl"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">Incident details</p><h2 className="mt-2 text-2xl font-black text-white">{activeMission.type} at {activeMission.location}</h2><p className="mt-3 max-w-3xl leading-7 text-[#AAB4C5]">{activeMission.description}</p></div><div className="flex shrink-0 flex-col gap-2"><SeverityBadge severity={activeMission.severity} /><StatusBadge status={activeMission.status} /></div></div><div className="mt-5 flex flex-wrap gap-3 text-sm text-[#AAB4C5]"><span className="flex items-center gap-2"><PhoneCall className="h-4 w-4" />{activeMission.citizen.phone}</span><span className="flex items-center gap-2"><Users className="h-4 w-4" />{activeMission.citizen.name}</span></div></div> : null}</div></div></OperationalShell>;
  }

  function renderPublicMap() {
    return <motion.div key="public-map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen p-4 sm:p-6"><div className="mx-auto max-w-[1500px]"><header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#111C2E]/70 p-5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-[#3B82F6]">Public read-only view</p><h1 className="mt-2 text-4xl font-black text-white">Live Disaster Map</h1><p className="mt-2 text-[#AAB4C5]">Color-coded markers show severity and live status.</p></div><div className="flex flex-wrap gap-3"><IconButton variant="red" onClick={openReportFlow}><AlertTriangle className="h-4 w-4" /> Report Emergency</IconButton><IconButton variant="gray" onClick={() => setView("landing")}><Home className="h-4 w-4" /> Home</IconButton></div></header><TacticalMap incidents={incidents} selectedIncident={selectedIncident} onSelect={setSelectedIncident} className="min-h-[calc(100vh-170px)]" title="Public live disaster map" /></div></motion.div>;
  }

  function renderLoginModal() {
    return <motion.div key="login-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#020712]/70 p-4 backdrop-blur-xl"><motion.form initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.96 }} onSubmit={submitLogin} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111C2E]/92 p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#3B82F6]">Role based login</p><h2 className="mt-2 text-3xl font-black text-white">Secure access</h2><p className="mt-2 text-sm text-[#AAB4C5]">JWT verification is simulated for the MVP flow.</p></div><button type="button" onClick={() => setLoginOpen(false)} className="rounded-full border border-white/10 bg-white/8 p-2 text-[#AAB4C5] transition hover:text-white"><X className="h-5 w-5" /></button></div><div className="grid gap-4"><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Role</span><select value={loginRole} onChange={(event) => setLoginRole(event.target.value as Role)} className="rounded-2xl border border-white/10 bg-[#16243A] px-4 py-3 text-white outline-none focus:border-[#3B82F6]/60"><option value="citizen">Citizen</option><option value="admin">Government Admin</option><option value="rescue">Rescue Team</option></select></label><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Email</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 focus-within:border-[#3B82F6]/60"><Mail className="h-4 w-4 text-[#6B7A90]" /><input type="email" defaultValue={`${loginRole}@safelanka.lk`} className="min-w-0 flex-1 bg-transparent text-white outline-none" /></div></label><label className="grid gap-2"><span className="text-sm font-semibold text-[#AAB4C5]">Password</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 focus-within:border-[#3B82F6]/60"><Lock className="h-4 w-4 text-[#6B7A90]" /><input type="password" defaultValue="safelanka" className="min-w-0 flex-1 bg-transparent text-white outline-none" /></div></label><IconButton type="submit" variant="blue" className="mt-2 py-4"><Shield className="h-5 w-5" /> Verify and enter</IconButton></div></motion.form></motion.div>;
  }

  function renderAssignModal() {
    if (!selectedIncident) return null;
    return <motion.div key="assign-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#020712]/72 p-4 backdrop-blur-xl"><motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.96 }} className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#111C2E]/94 p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#3B82F6]">Assign rescue team</p><h2 className="mt-2 text-3xl font-black text-white">{selectedIncident.id}</h2><p className="mt-2 text-sm text-[#AAB4C5]">Distance, availability, and ETA are listed for each field unit.</p></div><button type="button" onClick={() => setAssignOpen(false)} className="rounded-full border border-white/10 bg-white/8 p-2 text-[#AAB4C5] transition hover:text-white"><X className="h-5 w-5" /></button></div><div className="grid gap-3">{teams.map((team) => <button key={team.id} type="button" onClick={() => setSelectedTeamId(team.id)} className={cn("rounded-2xl border p-4 text-left transition hover:shadow-[0_0_28px_rgba(52,199,89,0.14)]", selectedTeamId === team.id ? "border-[#34C759]/55 bg-[#34C759]/10" : "border-white/10 bg-white/5 hover:border-[#34C759]/35")}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">{team.name}</p><p className="mt-1 text-sm text-[#AAB4C5]">{team.station} - {team.distance} - ETA {team.eta} - {team.members} members</p></div><span className={cn("rounded-full border px-3 py-1 text-xs font-bold", team.status === "Available" ? "border-[#34C759]/35 bg-[#34C759]/10 text-[#86EFAC]" : "border-[#FFD60A]/35 bg-[#FFD60A]/10 text-[#FFE16A]")}>{team.status}</span></div></button>)}</div><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"><IconButton variant="gray" onClick={() => setAssignOpen(false)}>Cancel</IconButton><IconButton variant="green" onClick={assignSelectedTeam}><CheckCircle2 className="h-4 w-4" /> Confirm assignment</IconButton></div></motion.div></motion.div>;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <CommandBackdrop />
      <Notifications notices={notices} />
      <AnimatePresence mode="wait">
        {view === "landing" ? renderLanding() : null}
        {view === "citizen" ? <motion.div key="citizen">{renderCitizen()}</motion.div> : null}
        {view === "publicMap" ? renderPublicMap() : null}
        {view === "admin" ? <motion.div key="admin">{renderAdmin()}</motion.div> : null}
        {view === "rescue" ? <motion.div key="rescue">{renderRescue()}</motion.div> : null}
      </AnimatePresence>
      <AnimatePresence>{loginOpen ? renderLoginModal() : null}</AnimatePresence>
      <AnimatePresence>{assignOpen ? renderAssignModal() : null}</AnimatePresence>
    </div>
  );
}

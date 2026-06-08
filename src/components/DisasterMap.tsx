import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, Clock3, MapPin, Radio, Route, Layers } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { RESCUE_BASE_STATION, SRI_LANKA_CENTER } from "@/utils/incidents";

export interface MapIncident {
  id: string;
  type: string;
  severity: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  time: string;
  status: string;
}

export interface MapShelter {
  id: string;
  name: string;
  location: string;
  capacity: number;
  beds: number;
  contact: string;
  latitude?: number;
  longitude?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#FF3B30",
  High: "#FF9500",
  Medium: "#FFD60A",
  Low: "#34C759",
};

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function createMarkerIcon(color: string, selected: boolean, critical: boolean, isShelter = false) {
  const size = selected ? 24 : 18;
  const pulse = critical
    ? `<span style="position:absolute;inset:-8px;border-radius:9999px;background:${color};opacity:0.35;animation:pulse 1.2s ease-in-out infinite"></span>`
    : "";

  let iconInner = `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;border:2px solid white;background:${color};box-shadow:0 0 18px ${color}"></span>`;
  
  if (isShelter) {
    iconInner = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;background:${color};box-shadow:0 0 18px ${color};color:white;"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`;
  }

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${size}px;height:${size}px">${pulse}${iconInner}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitMapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      map.setView([SRI_LANKA_CENTER.lat, SRI_LANKA_CENTER.lng], 7);
      return;
    }
    if (positions.length === 1) {
      map.setView(positions[0], 11);
      return;
    }
    map.fitBounds(positions, { padding: [56, 56], maxZoom: 12 });
  }, [map, positions.length]); // Optimize: Only re-fit bounds when the number of markers changes, not on detail updates

  return null;
}

function FocusSelectedIncident({
  incident,
}: {
  incident: MapIncident | null | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (!incident) return;
    map.flyTo([incident.latitude, incident.longitude], Math.max(map.getZoom(), 11), {
      duration: 0.8,
    });
  }, [incident?.id, incident?.latitude, incident?.longitude, map]); // Optimize: Depend on coordinates/id to avoid flyTo loops on state syncs

  return null;
}

export function DisasterMap({
  incidents,
  shelters = [],
  selectedIncident,
  onSelect,
  className = "",
  showRoute = false,
  title = "Live Disaster Map",
  compact = false,
  showDetailPanel = true,
}: {
  incidents: MapIncident[];
  shelters?: MapShelter[];
  selectedIncident?: MapIncident | null;
  onSelect: (incident: MapIncident) => void;
  className?: string;
  showRoute?: boolean;
  title?: string;
  compact?: boolean;
  showDetailPanel?: boolean;
}) {
  const [showIncidents, setShowIncidents] = useState(true);
  const [showShelters, setShowShelters] = useState(true);

  const activeIncidents = useMemo(() => {
    return showIncidents ? incidents : [];
  }, [incidents, showIncidents]);

  const activeShelters = useMemo(() => {
    return showShelters ? shelters : [];
  }, [shelters, showShelters]);

  const positions = useMemo(() => {
    const list: [number, number][] = [];
    activeIncidents.forEach((inc) => list.push([inc.latitude, inc.longitude]));
    activeShelters.forEach((sh) => {
      if (sh.latitude != null && sh.longitude != null) {
        list.push([sh.latitude, sh.longitude]);
      }
    });
    return list;
  }, [activeIncidents, activeShelters]);

  const routeTarget = selectedIncident ?? incidents[0];
  const routePositions = showRoute && routeTarget
    ? [
        [RESCUE_BASE_STATION.lat, RESCUE_BASE_STATION.lng] as [number, number],
        [routeTarget.latitude, routeTarget.longitude] as [number, number],
      ]
    : [];

  return (
    <div
      className={cn(
        "relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101E] shadow-[0_0_60px_rgba(59,130,246,0.14)]",
        className,
      )}
    >
      <MapContainer
        center={[SRI_LANKA_CENTER.lat, SRI_LANKA_CENTER.lng]}
        zoom={7}
        scrollWheelZoom
        className="h-full min-h-[inherit] w-full rounded-[2rem]"
        style={{ minHeight: "inherit", background: "#07101E" }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitMapBounds positions={positions} />
        <FocusSelectedIncident incident={selectedIncident} />

        {routePositions.length === 2 ? (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: "#3B82F6", weight: 4, opacity: 0.85, dashArray: "8 10" }}
          />
        ) : null}

        {/* Rescue Base Station Marker */}
        <Marker
          position={[RESCUE_BASE_STATION.lat, RESCUE_BASE_STATION.lng]}
          icon={createMarkerIcon("#3B82F6", false, false)}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-[#3B82F6]">📡 Rescue Base Station</p>
              <p className="text-xs text-white/70">Colombo Operations Hub</p>
            </div>
          </Popup>
        </Marker>

        {/* Disaster Incident Markers */}
        {activeIncidents.map((inc) => {
          const color = SEVERITY_COLORS[inc.severity] ?? "#3B82F6";
          const selected = selectedIncident?.id === inc.id;
          return (
            <Marker
              key={inc.id}
              position={[inc.latitude, inc.longitude]}
              icon={createMarkerIcon(color, selected, inc.severity === "Critical")}
              eventHandlers={{ click: () => onSelect(inc) }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-[#FF3B30]">{inc.id} — {inc.type}</p>
                  <p className="font-medium text-white">{inc.location}</p>
                  <p className="text-xs uppercase tracking-wide opacity-80">{inc.severity} · {inc.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Safe Shelter Markers */}
        {activeShelters.map((sh) => {
          if (sh.latitude == null || sh.longitude == null) return null;
          const availPercent = sh.capacity ? Math.round((sh.beds / sh.capacity) * 100) : 0;
          return (
            <Marker
              key={sh.id}
              position={[sh.latitude, sh.longitude]}
              icon={createMarkerIcon("#10B981", false, false, true)}
            >
              <Popup>
                <div className="space-y-1.5 text-sm">
                  <p className="font-bold text-[#10B981] flex items-center gap-1">🏠 {sh.name}</p>
                  <p className="text-white font-medium">{sh.location}</p>
                  <div className="text-xs space-y-0.5 text-white/80">
                    <p>இருக்கைகள்: {sh.beds} / {sh.capacity} காலியாக உள்ளது ({availPercent}%)</p>
                    {sh.contact && <p className="text-white/60">தொலைபேசி: {sh.contact}</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {!compact ? (
        <>
          {/* Map Title Tag */}
          <div className="pointer-events-none absolute left-5 top-5 z-[500] flex items-center gap-3 rounded-full border border-white/10 bg-[#0B1220]/80 px-4 py-2 backdrop-blur-xl">
            <Radio className="h-4 w-4 text-[#34C759]" />
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-white/80">{title}</span>
          </div>

          {/* Interactive Layer Filters */}
          <div className="absolute right-5 top-5 z-[500] flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0B1220]/85 p-3 text-xs backdrop-blur-xl shadow-2xl pointer-events-auto min-w-[170px]">
            <div className="mb-1.5 flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#3B82F6]">
              <Layers className="h-3.5 w-3.5" />
              <span>வரைபடம் (Map Layers)</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white transition py-0.5">
              <input 
                type="checkbox" 
                checked={showIncidents} 
                onChange={(e) => setShowIncidents(e.target.checked)} 
                className="rounded border-white/20 bg-white/5 text-[#3B82F6] focus:ring-0 focus:ring-offset-0 cursor-pointer" 
              />
              <span>விபத்துக்கள் (Incidents)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white transition py-0.5">
              <input 
                type="checkbox" 
                checked={showShelters} 
                onChange={(e) => setShowShelters(e.target.checked)} 
                className="rounded border-white/20 bg-white/5 text-[#10B981] focus:ring-0 focus:ring-offset-0 cursor-pointer" 
              />
              <span>தங்குமிடங்கள் (Shelters)</span>
            </label>
          </div>

          {/* Map Severity Legends */}
          <div className="pointer-events-none absolute bottom-5 left-5 z-[500] rounded-2xl border border-white/10 bg-[#0B1220]/85 p-4 text-xs text-[#AAB4C5] backdrop-blur-xl">
            <div className="mb-3 font-bold uppercase tracking-[0.18em] text-white/70">Severity Levels</div>
            <div className="grid gap-2">
              {(["Critical", "High", "Medium"] as const).map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[level], boxShadow: `0 0 16px ${SEVERITY_COLORS[level]}` }}
                  />
                  <span>{level}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shadow-[0_0_16px_#10B981]" />
                <span className="text-white/80">Safe Shelter (தங்குமிடம்)</span>
              </div>
            </div>
          </div>

          {showRoute ? (
            <div className="pointer-events-none absolute bottom-5 right-5 z-[500] rounded-2xl border border-[#3B82F6]/25 bg-[#0E1C35]/80 p-4 text-sm text-white backdrop-blur-xl">
              <div className="flex items-center gap-2 font-bold">
                <Route className="h-4 w-4 text-[#3B82F6]" />
                Route active
              </div>
              <p className="mt-1 text-xs text-[#AAB4C5]">Colombo base to target location.</p>
            </div>
          ) : null}
        </>
      ) : null}

      {showDetailPanel && !compact ? (
        <AnimatePresence>
          {selectedIncident ? (
            <motion.div
              key={selectedIncident.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="pointer-events-none absolute right-5 top-32 z-[500] w-[min(360px,calc(100%-2.5rem))] rounded-3xl border border-white/10 bg-[#111C2E]/88 p-5 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3B82F6]">{selectedIncident.id}</p>
                  <h3 className="mt-1 text-xl font-bold text-white">{selectedIncident.type}</h3>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: `${SEVERITY_COLORS[selectedIncident.severity]}66`,
                    color: SEVERITY_COLORS[selectedIncident.severity],
                  }}
                >
                  {selectedIncident.severity}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-[#AAB4C5]">
                <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-white/50" />{selectedIncident.time}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-white/50" />{selectedIncident.location}</div>
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-white/50" />{selectedIncident.status}</div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/78">{selectedIncident.description}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
}

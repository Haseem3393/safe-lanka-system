export const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };
export const RESCUE_BASE_STATION = { lat: 6.9271, lng: 79.8612 };

const LAT_MIN = 5.9;
const LAT_MAX = 9.9;
const LNG_MIN = 79.7;
const LNG_MAX = 81.9;

function hashKey(key: string): number {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 1000;
  return hash;
}

export function resolveIncidentCoords(
  lat?: number,
  lng?: number,
  fallbackKey = "default",
): { lat: number; lng: number } {
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }

  const hash = hashKey(fallbackKey);
  return {
    lat: SRI_LANKA_CENTER.lat + ((hash % 100) - 50) * 0.018,
    lng: SRI_LANKA_CENTER.lng + ((Math.floor(hash / 100) % 100) - 50) * 0.018,
  };
}

export function coordsToMapPosition(lat?: number, lng?: number, fallbackKey?: string): { x: number; y: number } {
  const coords = resolveIncidentCoords(lat, lng, fallbackKey);
  const x = ((coords.lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = ((LAT_MAX - coords.lat) / (LAT_MAX - LAT_MIN)) * 100;
  return {
    x: Math.min(88, Math.max(12, x)),
    y: Math.min(88, Math.max(12, y)),
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fromBackendStatus = (s: string) =>
  s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export interface ApiIncidentItem {
  id?: number;
  public_id: string;
  type?: { name: string };
  severity: string;
  description?: string;
  location?: { text?: string; latitude?: number; longitude?: number };
  reporter?: { name?: string; email?: string };
  timestamps?: { created_at: string };
  status: string;
  assigned_team?: { id: number };
}

export interface MappedIncident {
  id: string;
  apiId?: number;
  type: string;
  severity: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
  citizen: { name: string; phone: string; email: string };
  time: string;
  status: string;
  media: string[];
  timeline: { label: string; time: string }[];
  assignedTeamId?: string;
}

export function mapIncidentFromApi(
  it: ApiIncidentItem,
  options?: { publicView?: boolean },
): MappedIncident {
  const createdAt = it.timestamps?.created_at;
  const createdLabel = createdAt ? new Date(createdAt).toLocaleString() : "Unknown";
  const { lat, lng } = resolveIncidentCoords(it.location?.latitude, it.location?.longitude, it.public_id);
  const { x, y } = coordsToMapPosition(lat, lng, it.public_id);

  return {
    id: it.public_id,
    apiId: it.id,
    type: it.type?.name ?? "Unknown",
    severity: capitalize(it.severity),
    description: it.description ?? "",
    location: it.location?.text ?? "",
    latitude: lat,
    longitude: lng,
    x,
    y,
    citizen: options?.publicView
      ? { name: "Citizen", phone: "", email: "" }
      : {
          name: it.reporter?.name ?? "Unknown",
          phone: "",
          email: it.reporter?.email ?? "",
        },
    time: createdLabel,
    status: fromBackendStatus(it.status),
    media: [],
    timeline: [{ label: "Incident created", time: createdLabel }],
    assignedTeamId: it.assigned_team?.id?.toString(),
  };
}

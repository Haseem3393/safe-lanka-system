import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("safe_lanka_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("safe_lanka_token");
      localStorage.removeItem("safe_lanka_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string) =>
    api.post("/auth/register", {
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation,
    }),

  me: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),
};

// ─── Incidents ───────────────────────────────────────────────────────────
export const incidentApi = {
  list: (params?: Record<string, unknown>) => {
    const user = getStoredUser();
    const prefix = getRolePrefix(user?.roles);
    return api.get(`/${prefix}/incidents`, { params });
  },

  show: (id: number) => {
    const user = getStoredUser();
    const prefix = getRolePrefix(user?.roles);
    return api.get(`/${prefix}/incidents/${id}`);
  },

  create: (data: {
    incident_type_id: number;
    severity: string;
    description?: string;
    location_text: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const user = getStoredUser();
    const prefix = getRolePrefix(user?.roles);
    return api.post(`/${prefix}/incidents`, data);
  },

  assign: (id: number, rescueTeamId: number, note?: string) =>
    api.post(`/admin/incidents/${id}/assign`, { rescue_team_id: rescueTeamId, note }),

  updateStatus: (id: number, status: string, note?: string) => {
    const user = getStoredUser();
    const prefix = user?.roles?.includes("rescue") ? "rescue" : "admin";
    return api.post(`/${prefix}/incidents/${id}/status`, { status, note });
  },

  uploadMedia: (id: number, file: File) => {
    const user = getStoredUser();
    const prefix = getRolePrefix(user?.roles);
    const form = new FormData();
    form.append("file", file);
    return api.post(`/${prefix}/incidents/${id}/media`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── Rescue Teams ────────────────────────────────────────────────────────
export const rescueTeamApi = {
  list: (status?: string) => api.get("/rescue-teams", { params: status ? { status } : {} }),
};

// ─── Rescue Team Members ─────────────────────────────────────────────────
export const rescueTeamMemberApi = {
  list: (rescueTeamId?: number) =>
    api.get("/rescue-team-members", { params: rescueTeamId ? { rescue_team_id: rescueTeamId } : {} }),
};

// ─── Shelters ────────────────────────────────────────────────────────────
export const shelterApi = {
  list: (params?: Record<string, unknown>) => api.get("/shelters", { params }),

  show: (id: number) => api.get(`/shelters/${id}`),

  create: (data: {
    name: string;
    location_text: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    available_beds: number;
    contact_phone?: string;
  }) => api.post("/admin/shelters", data),

  update: (id: number, data: Record<string, unknown>) => api.put(`/admin/shelters/${id}`, data),

  destroy: (id: number) => api.delete(`/admin/shelters/${id}`),
};

// ─── Stats ───────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get("/stats"),
};

// ─── Users (admin) ───────────────────────────────────────────────────────
export const userApi = {
  create: (data: { name: string; email: string; phone?: string; password: string; role: string }) =>
    api.post("/admin/users", data),
};

// ─── Incident Types ──────────────────────────────────────────────────────
// Fallback mapping for frontend form selects → backend incident_type_id
export const INCIDENT_TYPE_MAP: Record<string, number> = {
  Flood: 1,
  Landslide: 2,
  Fire: 3,
  Accident: 4,
};

// ─── Helpers ─────────────────────────────────────────────────────────────
function getStoredUser(): { roles?: string[] } | null {
  try {
    const raw = localStorage.getItem("safe_lanka_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRolePrefix(roles?: string[]): string {
  if (!roles || roles.length === 0) return "citizen";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("rescue")) return "rescue";
  return "citizen";
}

export default api;

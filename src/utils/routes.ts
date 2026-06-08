export type Page = "landing" | "citizen" | "admin" | "rescue" | "publicMap";
export type CitizenTab = "home" | "report" | "map" | "reports" | "shelters";
export type AppRole = "admin" | "rescue" | "citizen";

export const PAGE_PATHS: Record<Page, string> = {
  landing: "/",
  citizen: "/citizen",
  admin: "/admin",
  rescue: "/rescue",
  publicMap: "/map",
};

export function pageFromPath(path: string): Page {
  if (path.startsWith("/citizen")) return "citizen";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/rescue")) return "rescue";
  if (path.startsWith("/map")) return "publicMap";
  return "landing";
}

export function getRequiredRole(page: Page): AppRole | null {
  if (page === "admin") return "admin";
  if (page === "rescue") return "rescue";
  if (page === "citizen") return "citizen";
  return null;
}

export function homePageForRole(role: string | null): Page {
  if (role === "admin") return "admin";
  if (role === "rescue") return "rescue";
  if (role === "citizen") return "citizen";
  return "landing";
}

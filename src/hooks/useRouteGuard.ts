import { useEffect } from "react";
import type { Location, NavigateFunction } from "react-router-dom";
import {
  getRequiredRole,
  homePageForRole,
  PAGE_PATHS,
  pageFromPath,
  type CitizenTab,
  type Page,
} from "@/utils/routes";

export interface AuthIntent {
  page: Page;
  citizenTab?: CitizenTab;
}

interface UseRouteGuardOptions {
  isAuthenticated: boolean;
  role: string | null;
  isInitializing: boolean;
  location: Location;
  navigate: NavigateFunction;
  setPage: (page: Page) => void;
  onAuthRequired: (intent: AuthIntent) => void;
  onRoleDenied: (message: string) => void;
}

export function useRouteGuard({
  isAuthenticated,
  role,
  isInitializing,
  location,
  navigate,
  setPage,
  onAuthRequired,
  onRoleDenied,
}: UseRouteGuardOptions) {
  useEffect(() => {
    if (isInitializing) return;

    const page = pageFromPath(location.pathname);
    const requiredRole = getRequiredRole(page);

    if (!requiredRole) {
      setPage(page);
      return;
    }

    if (!isAuthenticated) {
      onAuthRequired({ page });
      if (location.pathname !== PAGE_PATHS.landing) {
        navigate(PAGE_PATHS.landing, { replace: true });
        setPage("landing");
      }
      return;
    }

    if (role !== requiredRole) {
      const redirect = homePageForRole(role);
      onRoleDenied("You do not have access to this page.");
      navigate(PAGE_PATHS[redirect], { replace: true });
      setPage(redirect);
      return;
    }

    setPage(page);
  }, [
    isAuthenticated,
    role,
    isInitializing,
    location.pathname,
    navigate,
    setPage,
    onAuthRequired,
    onRoleDenied,
  ]);
}

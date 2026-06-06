import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/services/api";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, phone: string, password: string, passwordConfirmation: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialToken(): string | null {
  return localStorage.getItem("safe_lanka_token");
}

function getInitialUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("safe_lanka_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Boolean(token && user);
  const role = useMemo(() => {
    if (!user?.roles || user.roles.length === 0) return null;
    if (user.roles.includes("admin")) return "admin";
    if (user.roles.includes("rescue")) return "rescue";
    return "citizen";
  }, [user]);

  // On mount, verify token is still valid
  useEffect(() => {
    if (!token) return;
    authApi.me().catch(() => {
      localStorage.removeItem("safe_lanka_token");
      localStorage.removeItem("safe_lanka_user");
      setToken(null);
      setUser(null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { access_token, user: userData } = res.data.data;
      localStorage.setItem("safe_lanka_token", access_token);
      localStorage.setItem("safe_lanka_user", JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (
    name: string, email: string, phone: string, password: string, passwordConfirmation: string,
  ): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(name, email, phone, password, passwordConfirmation);
      const { access_token, user: userData } = res.data.data;
      localStorage.setItem("safe_lanka_token", access_token);
      localStorage.setItem("safe_lanka_user", JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("safe_lanka_token");
    localStorage.removeItem("safe_lanka_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, isAuthenticated, role, login, register, logout }),
    [user, token, isLoading, isAuthenticated, role, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

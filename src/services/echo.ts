import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: Echo<"pusher">;
  }
}

window.Pusher = Pusher;

function appBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "");
}

function reverbConfig() {
  const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";
  const host = import.meta.env.VITE_REVERB_HOST || "localhost";
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);
  const key = import.meta.env.VITE_REVERB_APP_KEY || "safe-lanka-key";

  return {
    key,
    host,
    port,
    scheme,
    forceTLS: scheme === "https",
  };
}

export function createEcho(): Echo<"pusher"> | null {
  const { key, host, port, forceTLS } = reverbConfig();

  if (!key) {
    return null;
  }

  const token = localStorage.getItem("safe_lanka_token");

  try {
    return new Echo({
      broadcaster: "pusher",
      key,
      cluster: "mt1",
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS,
      enabledTransports: ["ws", "wss"],
      disableStats: true,
      authEndpoint: `${appBaseUrl()}/broadcasting/auth`,
      auth: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });
  } catch {
    return null;
  }
}

export function getEcho(): Echo<"pusher"> | null {
  if (!window.Echo) {
    window.Echo = createEcho() ?? undefined;
  }

  return window.Echo ?? null;
}

export function resetEcho(): void {
  if (window.Echo) {
    window.Echo.disconnect();
    delete window.Echo;
  }
}

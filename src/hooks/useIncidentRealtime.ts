import { useEffect, useRef, useState } from "react";
import type Echo from "laravel-echo";
import { getEcho, resetEcho } from "@/services/echo";
import type { ApiIncidentItem } from "@/utils/incidents";

export type RealtimeConnectionStatus = "connecting" | "connected" | "disconnected";

export interface IncidentChangedPayload {
  action: "created" | "updated" | "assigned" | "status_changed";
  public_incident: ApiIncidentItem;
  incident: ApiIncidentItem;
}

interface UseIncidentRealtimeOptions {
  enabled: boolean;
  isAuthenticated: boolean;
  role: string | null;
  userId?: number;
  rescueTeamId?: number;
  onIncidentChanged: (payload: IncidentChangedPayload) => void;
}

function bindConnectionStatus(echo: Echo<"pusher">, onChange: (status: RealtimeConnectionStatus) => void) {
  const connector = echo.connector as { pusher?: { connection: { bind: (event: string, cb: () => void) => void } } };
  const connection = connector.pusher?.connection;

  if (!connection) {
    onChange("disconnected");
    return;
  }

  onChange("connecting");

  connection.bind("connected", () => onChange("connected"));
  connection.bind("unavailable", () => onChange("disconnected"));
  connection.bind("failed", () => onChange("disconnected"));
  connection.bind("disconnected", () => onChange("disconnected"));
}

export function useIncidentRealtime({
  enabled,
  isAuthenticated,
  role,
  userId,
  rescueTeamId,
  onIncidentChanged,
}: UseIncidentRealtimeOptions): RealtimeConnectionStatus {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("disconnected");
  const handlerRef = useRef(onIncidentChanged);

  useEffect(() => {
    handlerRef.current = onIncidentChanged;
  }, [onIncidentChanged]);

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    resetEcho();
    const echo = getEcho();

    if (!echo) {
      setStatus("disconnected");
      return;
    }

    bindConnectionStatus(echo, setStatus);

    const handleEvent = (payload: IncidentChangedPayload) => {
      handlerRef.current(payload);
    };

    const channelNames: string[] = [];

    if (!isAuthenticated) {
      channelNames.push("incidents.public");
      echo.channel("incidents.public").listen(".incident.changed", handleEvent);
    } else if (role === "admin") {
      channelNames.push("private-admin.incidents");
      echo.private("admin.incidents").listen(".incident.changed", handleEvent);
    } else if (role === "rescue" && rescueTeamId) {
      channelNames.push(`private-rescue.team.${rescueTeamId}`);
      echo.private(`rescue.team.${rescueTeamId}`).listen(".incident.changed", handleEvent);
    } else if (role === "citizen" && userId) {
      channelNames.push(`private-citizen.${userId}`);
      echo.private(`citizen.${userId}`).listen(".incident.changed", handleEvent);
    }

    return () => {
      channelNames.forEach((name) => echo.leave(name));
      resetEcho();
      setStatus("disconnected");
    };
  }, [enabled, isAuthenticated, role, userId, rescueTeamId]);

  return status;
}

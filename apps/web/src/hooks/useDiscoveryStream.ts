import { useEffect, useState, useRef } from "react";
import type { ActivityEvent, Severity } from "../types";

export interface StreamEvent {
  type: "asset_discovered" | "asset_verified" | "asset_enriched" | "risk_scored";
  data: any;
}

export function useDiscoveryStream() {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    total_assets: 0,
    active_risks: 0,
    compliance_score: 100, // Starts at 100, drops with risks
  });
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const addActivity = (type: ActivityEvent["type"], title: string, description: string, severity: Severity = "info") => {
    setActivities((prev) => {
      const newActivity: ActivityEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        title,
        description,
        severity,
        timestamp: new Date().toISOString(),
      };
      return [newActivity, ...prev].slice(0, 50); // Keep last 50
    });
  };

  useEffect(() => {
    // In dev, assuming Vite proxy routes /api to the Go backend
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    let reconnectTimeout: number;
    let retryCount = 0;

    const connect = () => {
      ws.current = new WebSocket(`${protocol}//${host}/api/v1/discovery/stream`);

      ws.current.onopen = () => {
        setIsConnected(true);
        retryCount = 0; // reset on successful connection
        console.log("WebSocket connected");
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
        // Auto-reconnect with exponential backoff (max 10s)
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
        retryCount++;
        console.log(`Will attempt to reconnect in ${timeout}ms...`);
        reconnectTimeout = window.setTimeout(connect, timeout);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.current?.close(); // Force close to trigger reconnect logic
      };

      ws.current.onmessage = (event) => {
        try {
          const payload: StreamEvent = JSON.parse(event.data);
          
          switch (payload.type) {
            case "asset_discovered":
              setStats((prev) => ({ ...prev, total_assets: prev.total_assets + 1 }));
              addActivity(
                "discovery",
                "Asset Discovered",
                `Found ${payload.data.asset_name} via ${payload.data.source}`,
                "info"
              );
              break;
              
            case "asset_verified":
              if (payload.data.is_active) {
                addActivity(
                  "scan",
                  "Asset Verified Active",
                  `${payload.data.asset_name} is active (IP: ${payload.data.ip_addresses?.join(", ") || "Unknown"})`,
                  "low"
                );
              }
              break;
              
            case "asset_enriched":
              addActivity(
                "discovery",
                "Asset Enriched",
                `Enriched ${payload.data.asset_name} with tech stack data`,
                "info"
              );
              break;
              
            case "risk_scored":
              if (payload.data.score > 0) {
                setStats((prev) => ({ 
                  ...prev, 
                  active_risks: prev.active_risks + 1,
                  // Simple mockup: drop compliance by 1 for each risk
                  compliance_score: Math.max(0, prev.compliance_score - 1) 
                }));
                addActivity(
                  "alert",
                  "Risk Identified",
                  `${payload.data.asset_name} scored ${payload.data.score} (${payload.data.severity})`,
                  payload.data.severity as Severity
                );
              }
              break;
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.onclose = null; // prevent reconnect loop on intentional unmount
        ws.current.close();
      }
    };
  }, []);

  return { isConnected, stats, activities };
}

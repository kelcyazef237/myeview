import { useState } from "react";
import {
  Search,
  Play,
  Zap,
  ShieldAlert,
  Clock,
  Globe,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useDiscoveryStream } from "../hooks/useDiscoveryStream";
import { useAuthStore } from "../stores/authStore";

interface DiscoveryJob {
  id: string;
  target: string;
  mode: "base" | "advanced";
  status: "running" | "completed" | "failed";
  assetsFound: number;
  startedAt: string;
}

export default function DiscoveryPage() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"base" | "advanced">("base");
  const [isStarting, setIsStarting] = useState(false);
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const { user } = useAuthStore();
  const { isConnected, stats, activities } = useDiscoveryStream();

  const handleStartDiscovery = async () => {
    if (!target.trim()) return;
    setIsStarting(true);

    const newJob: DiscoveryJob = {
      id: `job_${Date.now()}`,
      target: target.trim(),
      mode,
      status: "running",
      assetsFound: 0,
      startedAt: new Date().toISOString(),
    };

    setJobs((prev) => [newJob, ...prev]);

    try {
      const response = await fetch("/api/v1/discovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: target.trim(),
          mode,
          organization_id: user?.organization_id,
        }),
      });

      if (response.ok) {
        setTarget("");
        // Simulate job completion after a delay to reflect backend asynchronous processing
        setTimeout(() => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === newJob.id ? { ...j, status: "completed" as const } : j
            )
          );
        }, 15000);
      } else {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === newJob.id ? { ...j, status: "failed" as const } : j
          )
        );
      }
    } catch {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id ? { ...j, status: "failed" as const } : j
        )
      );
    } finally {
      setIsStarting(false);
    }
  };

  const statusConfig = {
    running: {
      icon: Loader2,
      text: "Running",
      color: "text-brand-400",
      bg: "bg-brand-500/10",
      border: "border-brand-500/20",
    },
    completed: {
      icon: CheckCircle2,
      text: "Completed",
      color: "text-cyber-green",
      bg: "bg-cyber-green/10",
      border: "border-cyber-green/20",
    },
    failed: {
      icon: XCircle,
      text: "Failed",
      color: "text-cyber-red",
      bg: "bg-cyber-red/10",
      border: "border-cyber-red/20",
    },
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-brand-500" />
            Passive Discovery
          </h1>
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
              <Wifi className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
        </div>
        <p className="text-sm text-white/40 mt-1">
          Launch passive intelligence scans to discover subdomains, IPs, certificates, and exposed services.
        </p>
      </div>

      {/* Discovery Launch Panel */}
      <div className="bg-surface-800/50 rounded-2xl border border-white/5 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-500" />
          New Discovery Scan
        </h3>

        {/* Mode Selector */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setMode("base")}
            className={cn(
              "flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
              mode === "base"
                ? "bg-brand-500/10 border-brand-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                : "bg-surface-900/50 border-white/5 hover:border-white/10"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-lg",
                mode === "base" ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-white/40"
              )}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className={cn("text-sm font-semibold", mode === "base" ? "text-brand-400" : "text-white/70")}>
                Base Scan
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                crt.sh · AlienVault · HackerTarget
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("advanced")}
            className={cn(
              "flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
              mode === "advanced"
                ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                : "bg-surface-900/50 border-white/5 hover:border-white/10"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-lg",
                mode === "advanced" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/40"
              )}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className={cn("text-sm font-semibold", mode === "advanced" ? "text-purple-400" : "text-white/70")}>
                Advanced Mode
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                Includes Shodan · Censys · Deep OSINT
              </p>
            </div>
          </button>
        </div>

        {/* Target Input + Launch */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Enter root domain (e.g. example.com)"
              className="bg-surface-900 border border-white/5 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 text-sm text-white placeholder:text-white/20 pl-11 pr-4 py-3 w-full rounded-xl outline-none transition-all"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStartDiscovery()}
            />
          </div>
          <button
            onClick={handleStartDiscovery}
            disabled={isStarting || !target.trim()}
            className={cn(
              "flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl transition-all active:scale-95 min-w-[140px]",
              mode === "base"
                ? "bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20"
                : "bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20"
            )}
          >
            {isStarting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {isStarting ? "Scanning..." : "Launch Scan"}
          </button>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-500/10">
            <Globe className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Live Discovered</p>
            <p className="text-xl font-bold text-white stat-number">{stats.total_assets}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-red/10">
            <ShieldAlert className="w-5 h-5 text-cyber-red" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Risks Found</p>
            <p className="text-xl font-bold text-white stat-number">{stats.active_risks}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-green/10">
            <CheckCircle2 className="w-5 h-5 text-cyber-green" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Compliance</p>
            <p className="text-xl font-bold text-white stat-number">{stats.compliance_score}%</p>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40" />
            Recent Discovery Jobs
          </h3>
          <span className="text-xs text-white/30">{jobs.length} jobs</span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No discovery jobs yet.</p>
            <p className="text-white/25 text-xs mt-1">
              Enter a domain above and launch a scan to begin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map((job) => {
              const sc = statusConfig[job.status];
              const StatusIcon = sc.icon;
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", sc.bg)}>
                      <StatusIcon
                        className={cn("w-4 h-4", sc.color, job.status === "running" && "animate-spin")}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{job.target}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
                            job.mode === "base"
                              ? "bg-brand-500/15 text-brand-400"
                              : "bg-purple-500/15 text-purple-400"
                          )}
                        >
                          {job.mode}
                        </span>
                        <span className="text-xs text-white/30">
                          {new Date(job.startedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-medium", sc.color)}>{sc.text}</span>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Activity Stream */}
      {activities.length > 0 && (
        <div className="bg-surface-800/50 rounded-2xl border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            Live Discovery Feed
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {activities.slice(0, 20).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-3 text-sm py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors animate-fade-in"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse-glow" />
                <span className="text-white/70 flex-1">{evt.description}</span>
                <span className="text-xs text-white/25 flex-shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

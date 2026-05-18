import { Globe, Shield, FileCheck, Activity, Search, Play, Zap, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/dashboard/StatCard";
import RiskGauge from "../components/dashboard/RiskGauge";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import AssetChart from "../components/dashboard/AssetChart";
import AttackPathGraph from "../components/dashboard/AttackPathGraph";
import { useDiscoveryStream } from "../hooks/useDiscoveryStream";
import { useAuthStore } from "../stores/authStore";

export default function DashboardPage() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"base" | "advanced">("base");
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [dbStats, setDbStats] = useState({ total_assets: 0, active_risks: 0 });
  const [dbDistribution, setDbDistribution] = useState<any[]>([]);
  const [dbTrend, setDbTrend] = useState<any[]>([]);

  // Real-time websocket data
  const { isConnected, stats: streamStats, activities: streamActivities } = useDiscoveryStream();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`/api/v1/discovery/assets?organization_id=${user?.organization_id}`);
        if (res.ok) {
          const assets = await res.json() || [];
          
          let activeRisks = 0;
          const distMap: Record<string, number> = {};
          
          assets.forEach((a: any) => {
             if (a.risk_score > 0) activeRisks++;
             const type = a.type || 'unknown';
             distMap[type] = (distMap[type] || 0) + 1;
          });

          setDbStats({ total_assets: assets.length, active_risks: activeRisks });

          const colors = ["#3b82f6", "#60a5fa", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
          const dist = Object.entries(distMap).map(([name, value], i) => ({
             name, value, color: colors[i % colors.length]
          }));
          setDbDistribution(dist);
          
          // Basic trend mockup reflecting actual asset counts
          setDbTrend([
            { day: "Mon", assets: Math.max(0, assets.length - 10), risks: Math.max(0, activeRisks - 2) },
            { day: "Tue", assets: Math.max(0, assets.length - 8), risks: Math.max(0, activeRisks - 1) },
            { day: "Wed", assets: Math.max(0, assets.length - 5), risks: activeRisks },
            { day: "Thu", assets: assets.length, risks: activeRisks },
            { day: "Fri", assets: assets.length, risks: activeRisks },
            { day: "Sat", assets: assets.length, risks: activeRisks },
            { day: "Sun", assets: assets.length, risks: activeRisks },
          ]);
        }
      } catch (e) {
        console.error("Failed to fetch initial stats", e);
      }
    };
    if (user?.organization_id) {
       fetchInitialData();
    }
  }, [user]);

  const handleStartDiscovery = async () => {
    if (!target) return;
    setIsStarting(true);
    try {
      const apiKeys: Record<string, string> = {};
      const shodanKey = localStorage.getItem("myeview_shodan_key");
      const censysId = localStorage.getItem("myeview_censys_id");
      const censysSecret = localStorage.getItem("myeview_censys_secret");
      
      if (shodanKey) apiKeys["shodan"] = shodanKey;
      if (censysId && censysSecret) {
        apiKeys["censys_id"] = censysId;
        apiKeys["censys_secret"] = censysSecret;
      }

      const response = await fetch("/api/v1/discovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, mode, api_keys: apiKeys }),
      });
      if (response.ok) {
        setTarget("");
        navigate("/assets");
      } else {
        alert("Failed to start discovery");
      }
    } catch (err) {
      alert("Error starting discovery");
    } finally {
      setIsStarting(false);
    }
  };

  const totalAssets = dbStats.total_assets + streamStats.total_assets;
  const activeRisks = dbStats.active_risks + streamStats.active_risks;
  const complianceScore = Math.max(0, 100 - activeRisks * 2);
  const gaugeScore = Math.min(100, activeRisks * 5); // Map risks to a 0-100 gauge

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
                <Wifi className="w-3.5 h-3.5" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-1">
            Attack surface overview · Real-time Intelligence
          </p>
        </div>

        {/* Discovery Control Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-surface-800/40 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
          {/* Mode Selector */}
          <div className="flex bg-surface-900 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setMode("base")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === "base"
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Base Scan
            </button>
            <button
              onClick={() => setMode("advanced")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === "advanced"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Advanced Mode
            </button>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block" />

          {/* Input + Button */}
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Enter domain (e.g. example.com)"
                className="bg-surface-900 border border-white/5 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 text-sm text-white placeholder:text-white/20 pl-9 pr-4 py-2 w-full rounded-lg outline-none transition-all"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <button
              onClick={handleStartDiscovery}
              disabled={isStarting || !target}
              className={`flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all active:scale-95 ${
                mode === "base" 
                  ? "bg-brand-500 hover:bg-brand-600" 
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              {isStarting ? "Starting..." : "Run"}
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assets"
          value={totalAssets}
          change={streamStats.total_assets > 0 ? streamStats.total_assets : 0}
          icon={Globe}
          accentColor="blue"
          delay={0}
        />
        <StatCard
          title="Active Risks"
          value={activeRisks}
          change={streamStats.active_risks > 0 ? streamStats.active_risks : 0}
          icon={Shield}
          accentColor="red"
          delay={100}
        />
        <StatCard
          title="Compliance Score"
          value={complianceScore}
          change={0}
          icon={FileCheck}
          accentColor="green"
          suffix="%"
          delay={200}
        />
        <StatCard
          title="Scan Status"
          value={totalAssets}
          icon={Activity}
          accentColor="purple"
          delay={300}
        />
      </div>

      {/* Middle Row: Risk Gauge + Asset Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <RiskGauge score={gaugeScore} />
        </div>
        <div className="lg:col-span-2">
          <AssetChart
            distribution={dbDistribution.length > 0 ? dbDistribution : [{ name: "No Data", value: 1, color: "#333" }]}
            weeklyTrend={dbTrend.length > 0 ? dbTrend : []}
          />
        </div>
      </div>

      {/* Attack Path Visualization */}
      <AttackPathGraph orgId={user?.organization_id} />

      {/* Activity Feed */}
      <ActivityFeed events={streamActivities} />
    </div>
  );
}

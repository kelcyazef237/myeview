import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useState } from "react";
import { cn } from "../../lib/utils";

// ── Asset Distribution (Donut) ──
interface AssetDistribution {
  name: string;
  value: number;
  color: string;
}

interface AssetChartProps {
  distribution: AssetDistribution[];
  weeklyTrend: { day: string; assets: number; risks: number }[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-border-default rounded-lg px-3 py-2 shadow-dropdown">
      <p className="text-xs text-white/60">{payload[0].name}</p>
      <p className="text-sm font-semibold text-white">{payload[0].value}</p>
    </div>
  );
};

/**
 * Combined asset visualization: donut chart for type distribution
 * and bar chart for weekly trend.
 */
export default function AssetChart({ distribution, weeklyTrend }: AssetChartProps) {
  const [activeTab, setActiveTab] = useState<"distribution" | "trend">("distribution");
  const total = distribution.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">
          Asset Intelligence
        </h3>
        <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("distribution")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
              activeTab === "distribution"
                ? "bg-brand-500/20 text-brand-400"
                : "text-white/40 hover:text-white/60"
            )}
          >
            Distribution
          </button>
          <button
            onClick={() => setActiveTab("trend")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
              activeTab === "trend"
                ? "bg-brand-500/20 text-brand-400"
                : "text-white/40 hover:text-white/60"
            )}
          >
            Weekly Trend
          </button>
        </div>
      </div>

      {/* Distribution View */}
      {activeTab === "distribution" && (
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-[180px] h-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="stat-number text-2xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5">
            {distribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-white/60">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="stat-number text-sm font-semibold text-white/80">
                    {item.value}
                  </span>
                  <span className="text-[11px] text-white/25">
                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend View */}
      {activeTab === "trend" && (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1629",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              />
              <Bar
                dataKey="assets"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Assets"
              />
              <Bar
                dataKey="risks"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name="Risks"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

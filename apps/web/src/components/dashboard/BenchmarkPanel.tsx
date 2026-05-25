import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SectorBenchmark } from "../../types";

// ── Seeded benchmark constants for Phase 1 ──────────────────────────────────
// Real compounding benchmarks require multi-org data (Phase 2).
export const SEEDED_BENCHMARKS: SectorBenchmark[] = [
  {
    metric: "External Exposure",
    organization_value: 0,
    sector_median: 55,
    sector_p25: 72,
    sector_p75: 38,
    unit: "score",
    context_label: "Mye-Score vs COBAC-regulated MFI peers",
  },
  {
    metric: "TLS Posture",
    organization_value: 0,
    sector_median: 61,
    sector_p25: 80,
    sector_p75: 42,
    unit: "score",
    context_label: "TLS health vs sector median",
  },
  {
    metric: "Compliance Violations",
    organization_value: 0,
    sector_median: 4,
    sector_p25: 1,
    sector_p75: 9,
    unit: "count",
    context_label: "Regulatory findings vs peer average",
  },
];

interface BenchmarkPanelProps {
  myeScore?: number;
  tlsScore?: number;
  violationCount?: number;
  sectorPercentile?: number;
}

interface ChartEntry {
  name: string;
  org: number;
  median: number;
  topQuartile: number;
  unit: string;
}

// Custom tooltip for the benchmark chart
function BenchmarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white/60 font-medium mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-white/50">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Sector Benchmarking Panel — shows where the organization sits relative
 * to COBAC-regulated MFI peers in the CEMAC region.
 *
 * Phase 1: Seeded synthetic benchmark data. Phase 2: real compounding dataset.
 */
export default function BenchmarkPanel({
  myeScore = 0,
  tlsScore = 0,
  violationCount = 0,
  sectorPercentile = 32,
}: BenchmarkPanelProps) {
  const benchmarks = SEEDED_BENCHMARKS.map((b, i) => ({
    ...b,
    organization_value: [myeScore, tlsScore, violationCount][i],
  }));

  const chartData: ChartEntry[] = benchmarks.map((b) => ({
    name: b.metric,
    org: b.organization_value,
    median: b.sector_median,
    topQuartile: b.sector_p25,
    unit: b.unit,
  }));

  // Exposure metric is inverted (lower violation count = better)
  const isExposed = sectorPercentile < 50;
  const peerStatement = isExposed
    ? `Your organization is more exposed than ${100 - sectorPercentile}% of COBAC-regulated MFIs in the CEMAC region.`
    : `Your organization has stronger posture than ${sectorPercentile}% of COBAC-regulated MFIs in the CEMAC region.`;

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Sector Benchmarking</h3>
          <p className="text-xs text-white/40 mt-0.5">
            Peer comparison · COBAC-regulated MFIs · CEMAC Region
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/30 bg-surface-900 px-2.5 py-1.5 rounded-lg border border-white/5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-mono">{benchmarks.length} metrics</span>
        </div>
      </div>

      {/* Peer positioning statement — the headline for the CEO */}
      <div
        className={`mb-5 p-3.5 rounded-xl border text-sm leading-relaxed ${
          isExposed
            ? "bg-cyber-red/5 border-cyber-red/20 text-cyber-red/90"
            : "bg-cyber-green/5 border-cyber-green/20 text-cyber-green/90"
        }`}
      >
        {peerStatement}
      </div>

      {/* Chart */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<BenchmarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />

            {/* Your organization */}
            <Bar dataKey="org" name="Your Score" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.org >= entry.median ? "#3b82f6" : "#ef4444"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>

            {/* Sector median */}
            <Bar dataKey="median" name="Sector Median" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} />

            {/* Top quartile threshold line */}
            <ReferenceLine
              y={chartData[0]?.topQuartile}
              stroke="rgba(16,185,129,0.35)"
              strokeDasharray="4 3"
              label={{ value: "Top 25%", fill: "rgba(16,185,129,0.6)", fontSize: 9, position: "right" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06] text-[10px] text-white/35">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
          Your score
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-white/15" />
          Sector median
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-px bg-cyber-green/50 border-dashed border-t border-cyber-green/50" />
          Top quartile
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "../../lib/utils";
import type { MyeScore } from "../../types";

interface RiskGaugeProps {
  score: number;
  maxScore?: number;
  myeScore?: MyeScore;
}

const QUARTILE_LABELS = [
  { q: 1, label: "Top Tier", color: "#10b981" },
  { q: 2, label: "Above Avg", color: "#3b82f6" },
  { q: 3, label: "Below Avg", color: "#f59e0b" },
  { q: 4, label: "At Risk", color: "#ef4444" },
];

function getColor(pct: number): string {
  if (pct >= 75) return "#10b981"; // green = healthy (high score)
  if (pct >= 50) return "#3b82f6"; // blue = above avg
  if (pct >= 25) return "#f59e0b"; // amber = below avg
  return "#ef4444";                 // red = critical
}

function getRiskLabel(pct: number): { text: string; color: string } {
  if (pct >= 75) return { text: "Top Tier", color: "text-cyber-green" };
  if (pct >= 50) return { text: "Above Average", color: "text-brand-400" };
  if (pct >= 25) return { text: "Below Average", color: "text-cyber-amber" };
  return { text: "At Risk", color: "text-cyber-red" };
}

/**
 * Mye-Score gauge — the single executive-facing risk number.
 * Higher score = healthier posture (inverted from raw risk).
 * Shows quartile legend, sector benchmark, and trend indicator.
 */
export default function RiskGauge({ score, maxScore = 100, myeScore }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const size = 200;

  useEffect(() => {
    const duration = 1200;
    const steps = 48;
    const stepDuration = duration / steps;
    const increment = score / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setAnimatedScore(Math.min(Math.round(increment * step), score));
      if (step >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [score]);

  const percentage = (animatedScore / maxScore) * 100;
  const radius = size * 0.38;
  const strokeWidth = size * 0.065;
  const cx = size / 2;
  const cy = size / 2 + size * 0.05;

  const circumference = Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;
  const arcColor = getColor(percentage);
  const riskLabel = getRiskLabel(percentage);

  // Sector benchmark needle position
  const sectorPct = myeScore?.sector_percentile ?? 50;
  const sectorScore = myeScore ? (myeScore.sector_median ?? score * 0.85) : score * 0.85;
  const sectorAngle = Math.PI - ((sectorScore / maxScore) * Math.PI);
  const needleX = cx + (radius - 4) * Math.cos(sectorAngle);
  const needleY = cy - (radius - 4) * Math.sin(sectorAngle);

  const TrendIcon = myeScore?.trend === "improving"
    ? TrendingUp
    : myeScore?.trend === "degrading"
      ? TrendingDown
      : Minus;

  const trendColor = myeScore?.trend === "improving"
    ? "text-cyber-green"
    : myeScore?.trend === "degrading"
      ? "text-cyber-red"
      : "text-white/30";

  const quartile = myeScore?.quartile ?? (
    percentage >= 75 ? 1 : percentage >= 50 ? 2 : percentage >= 25 ? 3 : 4
  );

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Mye-Score
          </h3>
          <p className="text-[10px] text-white/25 mt-0.5">
            {myeScore?.sector_label ?? "COBAC-regulated MFIs, CEMAC"}
          </p>
        </div>
        {/* Quartile badge */}
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border"
          style={{
            background: `${arcColor}18`,
            borderColor: `${arcColor}40`,
            color: arcColor,
          }}
        >
          Q{quartile} — {QUARTILE_LABELS.find((q) => q.q === quartile)?.label}
        </span>
      </div>

      {/* Gauge SVG */}
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          width={size}
          height={size * 0.6}
          viewBox={`0 0 ${size} ${size * 0.6}`}
          className="overflow-visible"
        >
          {/* Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Score fill */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.4s ease-out, stroke 0.4s ease-out",
              filter: `drop-shadow(0 0 8px ${arcColor}50)`,
            }}
          />

          {/* Sector average tick mark */}
          <circle
            cx={needleX}
            cy={needleY}
            r={4}
            fill="rgba(255,255,255,0.25)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
            style={{ transition: "all 0.4s ease-out" }}
          />

          {/* Tick marks at quartile boundaries */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const innerR = radius - strokeWidth - 3;
            const outerR = radius - strokeWidth - 9;
            const x1 = cx + innerR * Math.cos(angle);
            const y1 = cy - innerR * Math.sin(angle);
            const x2 = cx + outerR * Math.cos(angle);
            const y2 = cy - outerR * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>

        {/* Center Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="stat-number text-4xl font-bold text-white tabular-nums"
            style={{ textShadow: `0 0 24px ${arcColor}40` }}
          >
            {animatedScore}
          </span>
          <span className={cn("text-sm font-semibold mt-0.5", riskLabel.color)}>
            {riskLabel.text}
          </span>
        </div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between w-full max-w-[200px] mt-2 px-2">
        <span className="text-[10px] text-white/20">0</span>
        <span className="text-[10px] text-white/20">50</span>
        <span className="text-[10px] text-white/20">100</span>
      </div>

      {/* Sector benchmark line */}
      <div className="w-full mt-4 pt-4 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Sector avg</span>
          <span className="text-white/60 font-mono font-medium">
            {myeScore ? Math.round(myeScore.sector_median ?? score * 0.85) : Math.round(score * 0.85)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Peer ranking</span>
          <span
            className="font-medium"
            style={{ color: arcColor }}
          >
            Higher than {sectorPct}% of peers
          </span>
        </div>
        {myeScore?.trend && (
          <div className={cn("flex items-center gap-1 text-xs mt-1", trendColor)}>
            <TrendIcon size={12} />
            <span className="capitalize">{myeScore.trend} vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}

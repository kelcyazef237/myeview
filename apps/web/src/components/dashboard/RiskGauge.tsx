import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

interface RiskGaugeProps {
  score: number;
  maxScore?: number;
  label?: string;
  size?: number;
}

/**
 * Semi-circular risk gauge with animated fill.
 * Colors transition from green (low risk) through amber to red (critical).
 */
export default function RiskGauge({
  score,
  maxScore = 100,
  label = "Risk Score",
  size = 200,
}: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 40;
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

  // Semi-circle arc length
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  // Risk level
  const getRiskLevel = (pct: number) => {
    if (pct <= 25) return { text: "Low", color: "text-cyber-green" };
    if (pct <= 50) return { text: "Moderate", color: "text-cyber-amber" };
    if (pct <= 75) return { text: "High", color: "text-cyber-red" };
    return { text: "Critical", color: "text-cyber-red" };
  };

  const risk = getRiskLevel(percentage);

  // Gradient color based on score
  const getColor = (pct: number) => {
    if (pct <= 25) return "#10b981";
    if (pct <= 50) return "#f59e0b";
    if (pct <= 75) return "#ef4444";
    return "#dc2626";
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center">
      <h3 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
        {label}
      </h3>

      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          width={size}
          height={size * 0.6}
          viewBox={`0 0 ${size} ${size * 0.6}`}
          className="overflow-visible"
        >
          {/* Background Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.3s ease-out, stroke 0.3s ease-out",
              filter: `drop-shadow(0 0 6px ${getColor(percentage)}40)`,
            }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const innerR = radius - strokeWidth - 4;
            const outerR = radius - strokeWidth - 10;
            const x1 = cx + innerR * Math.cos(angle);
            const y1 = cy - innerR * Math.sin(angle);
            const x2 = cx + outerR * Math.cos(angle);
            const y2 = cy - outerR * Math.sin(angle);

            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
            );
          })}
        </svg>

        {/* Center Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="stat-number text-4xl font-bold text-white"
            style={{ textShadow: `0 0 20px ${getColor(percentage)}30` }}
          >
            {animatedScore}
          </span>
          <span className={cn("text-sm font-semibold mt-1", risk.color)}>
            {risk.text}
          </span>
        </div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between w-full max-w-[200px] mt-2 px-2">
        <span className="text-[10px] text-white/25">0</span>
        <span className="text-[10px] text-white/25">50</span>
        <span className="text-[10px] text-white/25">100</span>
      </div>
    </div>
  );
}

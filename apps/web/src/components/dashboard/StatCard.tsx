import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn, formatCompact } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  accentColor: "blue" | "green" | "amber" | "red" | "purple";
  suffix?: string;
  delay?: number;
  /** When set, renders a regulatory framework badge below the value instead of the % trend */
  regulatoryLabel?: string;
  /** Optional subtitle shown below the main value */
  subtitle?: string;
}

const accentMap = {
  blue: {
    bg: "bg-brand-500/10",
    text: "text-brand-400",
    border: "border-brand-500/20",
    glow: "shadow-glow-blue",
    icon: "text-brand-400",
  },
  green: {
    bg: "bg-cyber-green/10",
    text: "text-cyber-green",
    border: "border-cyber-green/20",
    glow: "shadow-glow-green",
    icon: "text-cyber-green",
  },
  amber: {
    bg: "bg-cyber-amber/10",
    text: "text-cyber-amber",
    border: "border-cyber-amber/20",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    icon: "text-cyber-amber",
  },
  red: {
    bg: "bg-cyber-red/10",
    text: "text-cyber-red",
    border: "border-cyber-red/20",
    glow: "shadow-glow-red",
    icon: "text-cyber-red",
  },
  purple: {
    bg: "bg-cyber-purple/10",
    text: "text-cyber-purple",
    border: "border-cyber-purple/20",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    icon: "text-cyber-purple",
  },
};

/**
 * Animated statistic card with count-up effect, trend indicator,
 * glassmorphic background, and accent color glow.
 */
export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  accentColor,
  suffix = "",
  delay = 0,
  regulatoryLabel,
  subtitle,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const accent = accentMap[accentColor];

  // Animate count-up
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 800;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  const TrendIcon =
    change === undefined || change === 0
      ? Minus
      : change > 0
        ? TrendingUp
        : TrendingDown;

  const trendColor =
    change === undefined || change === 0
      ? "theme-text-muted"
      : change > 0
        ? "text-cyber-green"
        : "text-cyber-red";

  return (
    <div
      className={cn(
        "glass-card group relative p-5 overflow-hidden",
        "transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
    >
      {/* Accent glow on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl",
          accent.glow
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium uppercase tracking-wider theme-text-tertiary">
            {title}
          </span>
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg",
              accent.bg
            )}
          >
            <Icon size={18} className={accent.icon} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-end gap-2">
          <span className="stat-number text-3xl font-bold theme-text">
            {formatCompact(displayValue)}
            {suffix}
          </span>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs theme-text-tertiary mt-1 leading-snug">{subtitle}</p>
        )}

        {/* Regulatory badge — shown instead of trend when regulatoryLabel is set */}
        {regulatoryLabel ? (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {regulatoryLabel.split("·").map((label) => (
              <span
                key={label.trim()}
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400"
              >
                {label.trim()}
              </span>
            ))}
          </div>
        ) : (
          /* Standard Trend */
          change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2", trendColor)}>
              <TrendIcon size={14} />
              <span className="text-xs font-medium">
                {change > 0 ? "+" : ""}
                {change}% from last scan
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

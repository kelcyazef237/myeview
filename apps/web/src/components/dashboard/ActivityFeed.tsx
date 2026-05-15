import {
  Globe,
  Shield,
  FileCheck,
  Search,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn, formatRelativeTime } from "../../lib/utils";
import type { ActivityEvent, Severity } from "../../types";

const typeIcons: Record<string, LucideIcon> = {
  discovery: Search,
  alert: AlertTriangle,
  compliance: FileCheck,
  scan: Globe,
  user: Shield,
};

const severityStyles: Record<Severity, string> = {
  critical: "badge-critical",
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
  info: "badge-info",
};

interface ActivityFeedProps {
  events: ActivityEvent[];
  maxItems?: number;
}

/**
 * Timeline-style activity feed showing recent platform events.
 * Each event has an icon, severity badge, and relative timestamp.
 */
export default function ActivityFeed({ events, maxItems = 8 }: ActivityFeedProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">
          Recent Activity
        </h3>
        <button className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium">
          View all
        </button>
      </div>

      <div className="space-y-1">
        {displayEvents.map((event, index) => {
          const Icon = typeIcons[event.type] || Globe;

          return (
            <div
              key={event.id}
              className={cn(
                "group flex items-start gap-3 p-3 -mx-1 rounded-lg",
                "hover:bg-white/[0.02] transition-colors duration-200",
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Timeline Dot + Line */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
                    event.severity === "critical"
                      ? "bg-cyber-red/10 text-cyber-red"
                      : event.severity === "high"
                        ? "bg-cyber-amber/10 text-cyber-amber"
                        : "bg-brand-500/10 text-brand-400"
                  )}
                >
                  <Icon size={14} />
                </div>
                {index < displayEvents.length - 1 && (
                  <div className="w-px h-full min-h-[16px] bg-border-subtle mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-white/75 group-hover:text-white/90 transition-colors leading-snug">
                    {event.title}
                  </p>
                  {event.severity && (
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                        severityStyles[event.severity]
                      )}
                    >
                      {event.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/30 mt-0.5">
                  {event.description}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-[11px] text-white/25 flex-shrink-0 pt-1.5">
                {formatRelativeTime(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-white/20">
          <Globe size={32} className="mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
}

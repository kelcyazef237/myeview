import { Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

interface TriageBannerProps {
  hiddenCount: number;
  mode: "executive" | "full";
  onToggleMode: () => void;
}

/**
 * Triage Banner — appears at the top of the Risk page in executive mode.
 * Informs the user that low-priority/low-confidence findings are hidden,
 * and provides a clear escape hatch to view the full noise scan.
 *
 * Designed to be informative but not alarming — it's a feature, not a warning.
 */
export default function TriageBanner({ hiddenCount, mode, onToggleMode }: TriageBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (mode === "full" || dismissed || hiddenCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 rounded-xl",
        "bg-brand-500/5 border border-brand-500/15 backdrop-blur-sm",
        "animate-fade-in"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
          <Eye className="w-3.5 h-3.5 text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white/80 font-medium">
            Executive view active —{" "}
            <span className="text-brand-400 font-semibold">{hiddenCount} low-priority finding{hiddenCount !== 1 ? "s" : ""} hidden</span>
          </p>
          <p className="text-xs text-white/35 mt-0.5 truncate">
            Showing only exploitable misconfigurations, real attack opportunities, and compliance-relevant findings.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggleMode}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
            "border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20",
            "transition-all duration-150"
          )}
        >
          <EyeOff className="w-3.5 h-3.5" />
          View Full Noise Scan
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

import { cn } from "../../lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

/**
 * MYEVIEW brand logo with animated shield icon.
 * Shows full logo text when expanded, icon only when collapsed.
 */
export default function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Shield Icon */}
      <div className="relative flex-shrink-0">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
        >
          {/* Shield shape */}
          <path
            d="M16 2L4 8v8c0 7.18 5.12 13.9 12 15.4C22.88 29.9 28 23.18 28 16V8L16 2z"
            fill="url(#shield-gradient)"
            stroke="rgba(59,130,246,0.3)"
            strokeWidth="0.5"
          />
          {/* Eye icon inside shield */}
          <ellipse
            cx="16"
            cy="15"
            rx="6"
            ry="4"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            opacity="0.9"
          />
          <circle cx="16" cy="15" r="1.8" fill="#fff" opacity="0.95" />
          {/* Scan line */}
          <line
            x1="10"
            y1="15"
            x2="22"
            y2="15"
            stroke="rgba(59,130,246,0.4)"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
          <defs>
            <linearGradient id="shield-gradient" x1="4" y1="2" x2="28" y2="25.4">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>
        {/* Glow pulse */}
        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-md animate-pulse-glow" />
      </div>

      {/* Brand Text */}
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-[0.12em] text-white">
            MYEVIEW
          </span>
          <span className="text-[9px] font-medium tracking-[0.08em] text-white/40 mt-0.5">
            ATTACK SURFACE INTEL
          </span>
        </div>
      )}
    </div>
  );
}

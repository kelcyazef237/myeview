import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, AlertCircle, CheckCircle2,
  Info, ChevronDown, ChevronUp, Search, BarChart3,
  Gavel, Target,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import TriageBanner from "../components/dashboard/TriageBanner";
import type { RiskFinding, Severity } from "../types";

// ── Severity config ordered by business consequence ──────────────────────────
const sevCfg: Record<Severity, {
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
  border: string;
  order: number;
  businessLabel: string;
}> = {
  critical: {
    icon: AlertTriangle,
    color: "text-cyber-red",
    bg: "bg-cyber-red/10",
    border: "border-cyber-red/20",
    order: 0,
    businessLabel: "Immediate Action Required",
  },
  high: {
    icon: AlertCircle,
    color: "text-cyber-amber",
    bg: "bg-cyber-amber/10",
    border: "border-cyber-amber/20",
    order: 1,
    businessLabel: "High Business Risk",
  },
  medium: {
    icon: Info,
    color: "text-brand-400",
    bg: "bg-brand-500/10",
    border: "border-brand-500/20",
    order: 2,
    businessLabel: "Moderate Exposure",
  },
  low: {
    icon: CheckCircle2,
    color: "text-cyber-green",
    bg: "bg-cyber-green/10",
    border: "border-cyber-green/20",
    order: 3,
    businessLabel: "Low Priority",
  },
  info: {
    icon: Info,
    color: "text-cyber-purple",
    bg: "bg-cyber-purple/10",
    border: "border-cyber-purple/20",
    order: 4,
    businessLabel: "Informational",
  },
};

// ── Executive triage thresholds ───────────────────────────────────────────────
const EXECUTIVE_HIDDEN_SEVERITIES: Severity[] = ["low", "info"];
const EXECUTIVE_MIN_CONFIDENCE = 0.6;

// ── Derive business impact narrative from a finding ───────────────────────────
function getBusinessImpact(finding: RiskFinding): string {
  if (finding.business_impact) return finding.business_impact;
  // Auto-derive from title for legacy findings without explicit business_impact
  const t = finding.title.toLowerCase();
  if (t.includes("ssl") || t.includes("tls") || t.includes("cert"))
    return "Unencrypted or weakly encrypted data transmission exposes customer data to interception, violating COBAC encryption obligations.";
  if (t.includes("admin") || t.includes("panel"))
    return "Exposed administrative interface creates unauthorized access pathway — potential for account takeover or data exfiltration.";
  if (t.includes("open port") || t.includes("exposed service"))
    return "Publicly reachable service that is not operationally required increases the external attack surface.";
  if (t.includes("dns") || t.includes("spf") || t.includes("dmarc"))
    return "Email authentication gap enables phishing and domain spoofing attacks targeting customers and staff.";
  return "Security gap that could be leveraged in a multi-step attack chain targeting business-critical systems.";
}

// ── Single finding card ───────────────────────────────────────────────────────
function FindingCard({ finding, mode }: { finding: RiskFinding; mode: "executive" | "full" }) {
  const [open, setOpen] = useState(false);
  const cfg = sevCfg[finding.severity] || sevCfg.info;
  const Icon = cfg.icon;
  const businessImpact = getBusinessImpact(finding);

  return (
    <div className="hover:bg-white/[0.015] transition-colors">
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between px-6 py-4 text-left gap-4"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", cfg.bg)}>
            <Icon className={cn("w-4 h-4", cfg.color)} />
          </div>
          <div className="min-w-0 flex-1">
            {/* Business consequence — primary text */}
            <p className="text-sm font-semibold text-white leading-snug">
              {finding.title}
            </p>
            {/* Business impact — always visible in executive mode */}
            {mode === "executive" && (
              <p className="text-xs text-white/50 mt-1 leading-relaxed line-clamp-2">
                {businessImpact}
              </p>
            )}
            <p className="text-xs text-white/30 mt-1 font-mono truncate">{finding.asset_value}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {/* Confidence badge — only shown in full mode */}
          {mode === "full" && finding.confidence > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-800 border border-white/8 text-white/35 font-mono">
              {Math.round(finding.confidence * 100)}% conf
            </span>
          )}
          {/* Severity badge */}
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded",
              cfg.bg, cfg.color, `border ${cfg.border}`
            )}
          >
            {cfg.businessLabel}
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-6 pb-5 pt-1 animate-fade-in">
          <div className="bg-surface-900/50 rounded-xl p-5 border border-white/5 space-y-4">

            {/* Business Impact */}
            {mode === "executive" && (
              <div className="bg-cyber-amber/5 border border-cyber-amber/15 rounded-lg p-4">
                <h4 className="text-[11px] font-semibold text-cyber-amber/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Business Consequence
                </h4>
                <p className="text-sm text-white/80 leading-relaxed">{businessImpact}</p>
              </div>
            )}

            {/* Description (technical, collapsed by default in exec mode) */}
            <div>
              <h4 className="text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Technical Detail
              </h4>
              <p className="text-sm text-white/70 leading-relaxed">{finding.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-white/50 mb-1.5 uppercase">Evidence</h4>
                <p className="text-sm text-white/65 font-mono text-xs leading-relaxed">{finding.evidence}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-brand-400/80 mb-1.5 uppercase">Recommended Action</h4>
                <p className="text-sm text-white/70 leading-relaxed">{finding.remediation}</p>
              </div>
            </div>

            {/* Compliance citations */}
            {finding.compliance_refs?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-white/50 mb-2 uppercase flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5" /> Regulatory Citations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {finding.compliance_refs.map((ref, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded bg-brand-500/8 border border-brand-500/20 text-brand-300 font-medium"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RiskScoringPage() {
  const [findings, setFindings] = useState<RiskFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [filterSev, setFilterSev] = useState<Severity | "all">("all");
  const [triageMode, setTriageMode] = useState<"executive" | "full">("executive");
  const { user } = useAuthStore();

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/v1/scoring/findings?organization_id=${user?.organization_id}`);
        if (res.ok) setFindings((await res.json()) || []);
      } catch (err) {
        console.error("Failed to fetch risk findings", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.organization_id) fetch_();
    else setLoading(false);
  }, [user]);

  // ── Triage filtering ──
  const hiddenFindings = findings.filter(
    (f) =>
      EXECUTIVE_HIDDEN_SEVERITIES.includes(f.severity) ||
      (f.confidence > 0 && f.confidence < EXECUTIVE_MIN_CONFIDENCE)
  );

  const visibleFindings =
    triageMode === "executive"
      ? findings.filter(
          (f) =>
            !EXECUTIVE_HIDDEN_SEVERITIES.includes(f.severity) &&
            (f.confidence === 0 || f.confidence >= EXECUTIVE_MIN_CONFIDENCE)
        )
      : findings;

  // Apply search + severity filter, then sort by business consequence
  const filtered = visibleFindings
    .filter((f) => filterSev === "all" || f.severity === filterSev)
    .filter(
      (f) =>
        !searchQ ||
        f.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        f.asset_value.toLowerCase().includes(searchQ.toLowerCase())
    )
    .sort((a, b) => (sevCfg[a.severity]?.order ?? 5) - (sevCfg[b.severity]?.order ?? 5));

  const breakdown = visibleFindings.reduce(
    (acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" />
            Risk Triage
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {triageMode === "executive"
              ? "Exploitable misconfigurations and real attack opportunities · Ranked by business consequence"
              : "Full noise scan · All findings including informational and low-confidence"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 bg-surface-800 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setTriageMode("executive")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              triageMode === "executive"
                ? "bg-brand-500/15 text-brand-300 border border-brand-500/25"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            Executive View
          </button>
          <button
            onClick={() => setTriageMode("full")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              triageMode === "full"
                ? "bg-surface-700 text-white/70 border border-white/10"
                : "text-white/40 hover:text-white/70"
            )}
          >
            Full Noise Scan
          </button>
        </div>
      </div>

      {/* ── Triage banner ───────────────────────────────────────────── */}
      <TriageBanner
        hiddenCount={hiddenFindings.length}
        mode={triageMode}
        onToggleMode={() => setTriageMode("full")}
      />

      {/* ── Severity Breakdown ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => {
          const c = sevCfg[sev];
          const I = c.icon;
          const count = triageMode === "executive"
            ? (breakdown[sev] || 0)
            : (findings.reduce((n, f) => n + (f.severity === sev ? 1 : 0), 0));
          return (
            <button
              key={sev}
              onClick={() => setFilterSev(filterSev === sev ? "all" : sev)}
              className={cn(
                "glass-card p-4 flex flex-col items-center gap-2 transition-all",
                filterSev === sev && `ring-1 ${c.border} ${c.bg}`
              )}
            >
              <div className={cn("p-2 rounded-lg", c.bg)}>
                <I className={cn("w-5 h-5", c.color)} />
              </div>
              <span className="stat-number text-2xl font-bold text-white tabular-nums">{count}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{sev}</span>
            </button>
          );
        })}
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search findings by title or asset..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="bg-surface-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white w-full focus:border-brand-500/50 outline-none transition-all"
        />
      </div>

      {/* ── Findings List ────────────────────────────────────────────── */}
      <div className="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-white/40" />
            {triageMode === "executive" ? "Actionable Findings" : "All Findings"}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">
              {filtered.length} of {findings.length} total
              {triageMode === "executive" && hiddenFindings.length > 0 && (
                <span className="text-white/20"> · {hiddenFindings.length} filtered</span>
              )}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {findings.length === 0 ? "No Risks Detected" : "No Matching Findings"}
            </h3>
            <p className="text-white/40 max-w-md mx-auto text-sm">
              {findings.length === 0
                ? "Run a discovery scan to identify risk exposure across your external attack surface."
                : triageMode === "executive"
                  ? "No exploitable findings match your filter. Switch to Full Noise Scan to see all findings."
                  : "Adjust search or severity filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((f) => (
              <FindingCard key={f.id} finding={f} mode={triageMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

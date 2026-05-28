import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, AlertCircle, ShieldCheck,
  ChevronDown, ChevronUp, BookOpen, Clock, CheckCircle2,
  FileWarning, Gavel, Zap, RefreshCw
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import api from "../lib/api";
import { cn } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface ComplianceViolation {
  id: string;
  organization_id: string;
  asset_name: string;
  canonical_key: string;
  law_name: string;
  article: string;
  business_stake: string;
  alert_level: "CRITICAL ALERT" | "HIGH ALERT" | "ADVISORY" | string;
  match_source: "deterministic" | "rag" | string;
  violated_requirement: string;
  evidence: string;
  remediation: string;
  severity: string;
  status: string;
  created_at: string;
}

interface ViolationSummary {
  "CRITICAL ALERT": number;
  "HIGH ALERT": number;
  "ADVISORY": number;
  total: number;
}

interface ViolationsResponse {
  summary: ViolationSummary;
  violations: ComplianceViolation[];
}

// ── Alert Level Config ──────────────────────────────────────────────────────

const alertConfig = {
  "CRITICAL ALERT": {
    border: "border-red-500/40",
    bg: "bg-red-500/[0.06]",
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: "text-red-400",
    pulse: "bg-red-500",
    summaryBg: "bg-red-500/10 border-red-500/20",
    summaryText: "text-red-400",
  },
  "HIGH ALERT": {
    border: "border-orange-500/40",
    bg: "bg-orange-500/[0.06]",
    badge: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: "text-orange-400",
    pulse: "bg-orange-500",
    summaryBg: "bg-orange-500/10 border-orange-500/20",
    summaryText: "text-orange-400",
  },
  "ADVISORY": {
    border: "border-blue-500/30",
    bg: "bg-blue-500/[0.04]",
    badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    icon: <BookOpen className="w-5 h-5" />,
    iconColor: "text-blue-400",
    pulse: "bg-blue-500",
    summaryBg: "bg-blue-500/10 border-blue-500/20",
    summaryText: "text-blue-400",
  },
};

function getAlertConfig(level: string) {
  return alertConfig[level as keyof typeof alertConfig] ?? alertConfig["ADVISORY"];
}

// ── Violation Card ──────────────────────────────────────────────────────────

function ViolationCard({ violation }: { violation: ComplianceViolation }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getAlertConfig(violation.alert_level);

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      cfg.border, cfg.bg,
      "hover:border-opacity-70"
    )}>
      {/* Header */}
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Alert + Asset */}
          <div className="flex items-start gap-3 min-w-0">
            {/* Pulsing severity dot */}
            <div className="relative flex-shrink-0 mt-0.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", cfg.pulse)} />
              {violation.alert_level === "CRITICAL ALERT" && (
                <div className={cn("absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-60", cfg.pulse)} />
              )}
            </div>

            <div className="min-w-0">
              {/* Canonical key badge */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={cn("font-mono text-xs font-bold px-2 py-0.5 rounded", cfg.badge)}>
                  {violation.canonical_key}
                </span>
                {violation.match_source === "deterministic" && (
                  <span className="flex items-center gap-1 text-[10px] text-white/30 uppercase tracking-widest">
                    <Zap className="w-2.5 h-2.5" /> Instant
                  </span>
                )}
              </div>

              {/* Asset name */}
              <h3 className="text-sm font-semibold theme-text truncate">
                {violation.asset_name}
              </h3>

              {/* Law name */}
              <p className="text-xs theme-text-tertiary mt-0.5 flex items-center gap-1">
                <Gavel className="w-3 h-3" />
                {violation.law_name}
                {violation.article && ` — ${violation.article}`}
              </p>
            </div>
          </div>

          {/* Right: Alert badge + status + expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn("text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded", cfg.badge)}>
              {violation.alert_level}
            </span>
            <span className={cn(
              "text-[10px] uppercase px-2 py-0.5 rounded border",
              violation.status === "open"
                ? "theme-text-muted theme-border-subtle"
                : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            )}>
              {violation.status}
            </span>
            {expanded
              ? <ChevronUp className="w-4 h-4 theme-text-muted" />
              : <ChevronDown className="w-4 h-4 theme-text-muted" />}
          </div>
        </div>

        {/* Business Stake — always visible, this is the CEO-level message */}
        {violation.business_stake && (
          <div className="mt-3 ml-5 pl-3 border-l-2 theme-border-subtle">
            <p className="text-sm theme-text-secondary italic leading-relaxed">
              "{violation.business_stake}"
            </p>
          </div>
        )}
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t theme-border-subtle px-5 pb-5 pt-4 space-y-4 animate-fade-in">
          {/* Technical Evidence */}
          <div>
            <h4 className="text-[11px] font-semibold theme-text-muted uppercase tracking-widest mb-2">
              Technical Evidence
            </h4>
            <p className="text-sm theme-text-secondary theme-bg-body rounded-lg p-3 border theme-border-subtle font-mono leading-relaxed">
              {violation.evidence}
            </p>
          </div>

          {/* Mandated State */}
          <div>
            <h4 className="text-[11px] font-semibold theme-text-muted uppercase tracking-widest mb-2">
              What the Law Requires
            </h4>
            <p className="text-sm theme-text-secondary leading-relaxed">
              {violation.violated_requirement}
            </p>
          </div>

          {/* Remediation */}
          <div className="bg-emerald-500/[0.06] rounded-lg p-4 border border-emerald-500/20">
            <h4 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Action
            </h4>
            <p className="text-sm text-white/80 leading-relaxed">
              {violation.remediation}
            </p>
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] theme-text-muted">
              <Clock className="w-3 h-3" />
              Detected {new Date(violation.created_at).toLocaleString()}
            </div>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 hover:bg-brand-600/30 transition-colors">
              Mark as Mitigated
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [data, setData] = useState<ViolationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const { user } = useAuthStore();

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const res = await api.get<ViolationsResponse>(
        `/compliance/violations?organization_id=${user?.organization_id}`
      );
      setData(res.data);
    } catch {
      // Backend offline — show empty state
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organization_id) fetchViolations();
  }, [user]);

  const handleSeedDB = async () => {
    setSeeding(true);
    try {
      await api.post("/compliance/seed");
      alert("✅ Regulatory database seeded with COBAC/ANTIC/Finance Law regulations.");
    } catch {
      alert("⚠️ Seeding requires OpenAI API key and a running compliance service.");
    } finally {
      setSeeding(false);
    }
  };

  const violations = data?.violations ?? [];
  const summary = data?.summary ?? { "CRITICAL ALERT": 0, "HIGH ALERT": 0, "ADVISORY": 0, total: 0 };

  const filtered = filter === "ALL"
    ? violations
    : violations.filter(v => v.alert_level === filter);

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold theme-text flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-brand-500" />
            Regulatory Intelligence
          </h1>
          <p className="text-sm theme-text-tertiary mt-1">
            Technical vulnerabilities mapped to COBAC · ANTIC · Finance Law violations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchViolations}
            className="flex items-center gap-1.5 px-3 py-2 text-sm theme-text-secondary theme-bg-card border theme-border-subtle rounded-lg hover:theme-border-default transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleSeedDB}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-brand-400 bg-brand-600/10 border border-brand-500/20 rounded-lg hover:bg-brand-600/20 transition-colors disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {seeding ? "Seeding..." : "Seed Regulations DB"}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["CRITICAL ALERT", "HIGH ALERT", "ADVISORY"] as const).map((level) => {
          const cfg = getAlertConfig(level);
          return (
            <button
              key={level}
              onClick={() => setFilter(filter === level ? "ALL" : level)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all duration-150",
                cfg.summaryBg,
                filter === level ? "ring-1 ring-white/20 scale-[1.02]" : "hover:opacity-90"
              )}
            >
              <div className={cn("text-2xl font-bold tabular-nums", cfg.summaryText)}>
                {summary[level]}
              </div>
              <div className="text-xs theme-text-tertiary mt-0.5 font-medium">{level}</div>
            </button>
          );
        })}
        <div className="rounded-xl border theme-border-subtle theme-bg-card p-4 text-left">
          <div className="text-2xl font-bold tabular-nums theme-text">{summary.total}</div>
          <div className="text-xs theme-text-tertiary mt-0.5 font-medium">Total Violations</div>
        </div>
      </div>

      {/* Filter Tabs */}
      {violations.length > 0 && (
        <div className="flex gap-2">
          {["ALL", "CRITICAL ALERT", "HIGH ALERT", "ADVISORY"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg border transition-colors",
                filter === f
                  ? "bg-brand-600/20 border-brand-500/30 text-brand-300"
                  : "theme-bg-card border-theme-border-subtle theme-text-secondary hover:theme-text"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-bg-card rounded-2xl border theme-border-subtle p-16 flex flex-col items-center justify-center text-center">
          {violations.length === 0 ? (
            <>
              <ShieldCheck className="w-16 h-16 text-emerald-500/50 mb-4" />
              <h3 className="text-lg font-semibold theme-text mb-2">No Violations Detected</h3>
              <p className="text-sm theme-text-tertiary max-w-md leading-relaxed">
                Run a discovery scan to automatically cross-reference your infrastructure against
                COBAC Circular No. 000002, ANTIC Law 2010/012, and Finance Law 2026 Article 17c.
              </p>
              <div className="mt-4 text-xs theme-text-muted flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5" />
                Tip: Seed the regulations database first using the button above.
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="w-12 h-12 text-emerald-500/50 mb-3" />
              <h3 className="text-base font-semibold theme-text mb-1">No {filter} violations</h3>
              <button onClick={() => setFilter("ALL")} className="text-sm text-brand-400 mt-2">
                Show all violations
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <ViolationCard key={v.id} violation={v} />
          ))}
        </div>
      )}
    </div>
  );
}

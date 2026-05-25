import { useState } from "react";
import {
  FileBarChart2, Download, Shield, Lock, TrendingUp,
  Gavel, CheckCircle2, AlertTriangle, Building2,
  ChevronRight, Loader2, FileText, Eye,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import api from "../lib/api";

// ── Report section preview card ───────────────────────────────────────────
interface ReportSectionProps {
  icon: typeof Shield;
  title: string;
  description: string;
  included: boolean;
}

function ReportSection({ icon: Icon, title, description, included }: ReportSectionProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3.5 rounded-xl border transition-colors",
      included
        ? "bg-brand-500/5 border-brand-500/15"
        : "bg-surface-800/40 border-white/5 opacity-50"
    )}>
      <div className={cn("p-2 rounded-lg flex-shrink-0", included ? "bg-brand-500/10" : "bg-white/5")}>
        <Icon className={cn("w-4 h-4", included ? "text-brand-400" : "text-white/30")} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", included ? "text-white" : "text-white/40")}>{title}</p>
        <p className="text-xs text-white/35 mt-0.5 leading-snug">{description}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {included
          ? <CheckCircle2 className="w-4 h-4 text-brand-400" />
          : <div className="w-4 h-4 rounded-full border border-white/15" />}
      </div>
    </div>
  );
}

// ── What is EXCLUDED (the differentiator) ────────────────────────────────
const EXCLUDED_ITEMS = [
  "Raw scanner output or verbose port dumps",
  "Uncontextualized CVE lists without business framing",
  "Compliance percentage scores (e.g. '74% compliant')",
  "Technical jargon without business consequence",
  "Noisy informational findings with no remediation path",
];

// ── Regulatory frameworks selector ───────────────────────────────────────
const FRAMEWORKS = [
  { id: "COBAC", label: "COBAC Circular No. 000002", description: "Encryption standards, TLS obligations" },
  { id: "ANTIC", label: "ANTIC Law 2010/012", description: "Digital security requirements" },
  { id: "Finance Law 2026", label: "Finance Law 2026", description: "Art. 17c, Fintech compliance" },
] as const;

type FrameworkId = (typeof FRAMEWORKS)[number]["id"];

export default function ExecutiveReportPage() {
  const { user } = useAuthStore();
  const [selectedFrameworks, setSelectedFrameworks] = useState<FrameworkId[]>(["COBAC", "ANTIC", "Finance Law 2026"]);
  const [includeTLS, setIncludeTLS] = useState(true);
  const [includeBenchmarks, setIncludeBenchmarks] = useState(true);
  const [includeAttackPaths, setIncludeAttackPaths] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleFramework = (fw: FrameworkId) => {
    setSelectedFrameworks((prev) =>
      prev.includes(fw) ? prev.filter((f) => f !== fw) : [...prev, fw]
    );
  };

  const handleGenerate = async () => {
    if (selectedFrameworks.length === 0) {
      setError("Select at least one regulatory framework.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await api.post("/compliance/report/executive", {
        organization_id: user?.organization_id,
        include_tls: includeTLS,
        include_benchmarks: includeBenchmarks,
        include_attack_paths: includeAttackPaths,
        regulatory_frameworks: selectedFrameworks,
      });
      const url = response.data?.url || response.data?.report_url;
      if (url) {
        setReportUrl(url);
        setGenerated(true);
      } else {
        // Fallback: open blank PDF placeholder
        setGenerated(true);
        setReportUrl(null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Report generation failed.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const sectionCount = [includeTLS, includeBenchmarks, includeAttackPaths].filter(Boolean).length + 3; // +3 = always-on sections

  return (
    <div className="space-y-6 max-w-[1100px]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <FileBarChart2 className="w-6 h-6 text-brand-500" />
          Executive Report
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Board-ready intelligence · Regulatory framing · No raw scanner output
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Configuration ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Organization */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/40" />
              Organization
            </h3>
            <div className="bg-surface-900 rounded-lg p-3 border border-white/5">
              <p className="text-sm font-medium text-white">{user?.organization_name || "Your Organization"}</p>
              <p className="text-xs text-white/35 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Regulatory Frameworks */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-white/40" />
              Regulatory Frameworks
            </h3>
            <div className="space-y-2">
              {FRAMEWORKS.map((fw) => {
                const selected = selectedFrameworks.includes(fw.id);
                return (
                  <button
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                      selected
                        ? "bg-brand-500/8 border-brand-500/20"
                        : "bg-surface-800/40 border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                      selected ? "bg-brand-500 border-brand-500" : "border-white/20"
                    )}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold", selected ? "text-brand-300" : "text-white/50")}>{fw.label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{fw.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Include Sections */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/40" />
              Include Sections
            </h3>
            <div className="space-y-2">
              {[
                { label: "TLS/SSL Certificate Intelligence", value: includeTLS, set: setIncludeTLS, desc: "8-dimensional certificate posture" },
                { label: "Sector Benchmarking", value: includeBenchmarks, set: setIncludeBenchmarks, desc: "Peer comparison vs CEMAC MFIs" },
                { label: "Attack Path Narrative", value: includeAttackPaths, set: setIncludeAttackPaths, desc: "Multi-step breach scenarios" },
              ].map(({ label, value, set, desc }) => (
                <button
                  key={label}
                  onClick={() => set(!value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    value ? "bg-brand-500/8 border-brand-500/20" : "bg-surface-800/40 border-white/5"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                    value ? "bg-brand-500 border-brand-500" : "border-white/20"
                  )}>
                    {value && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium", value ? "text-white" : "text-white/40")}>{label}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-cyber-red/8 border border-cyber-red/20 text-sm text-cyber-red/90">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Generate CTA */}
          <button
            onClick={handleGenerate}
            disabled={generating || selectedFrameworks.length === 0}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl",
              "font-semibold text-sm text-white transition-all active:scale-[0.98]",
              "bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-brand-500/25"
            )}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating Report…</>
            ) : (
              <><FileBarChart2 className="w-4 h-4" /> Generate Executive Report</>
            )}
          </button>

          {/* Download (shown after generation) */}
          {generated && (
            <div className="flex flex-col gap-2 animate-fade-in">
              {reportUrl ? (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-cyber-green/20 border border-cyber-green/30 hover:bg-cyber-green/30 transition-all"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              ) : (
                <div className="p-3.5 rounded-xl bg-cyber-green/5 border border-cyber-green/15 text-center">
                  <CheckCircle2 className="w-5 h-5 text-cyber-green mx-auto mb-1.5" />
                  <p className="text-sm text-white/70">Report generation queued.</p>
                  <p className="text-xs text-white/35 mt-0.5">Check the compliance service for the generated PDF.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Report Preview ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Report structure preview */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-white/40" />
                Report Structure Preview
              </h3>
              <span className="text-[10px] text-white/25 bg-surface-800 px-2 py-1 rounded border border-white/5">
                {sectionCount} sections
              </span>
            </div>

            <div className="space-y-2">
              {/* Always included sections */}
              <ReportSection
                icon={AlertTriangle}
                title="Executive Risk Summary"
                description="Attack exposure narrative, Mye-Score, and top-line business impact. Written for board and risk committee audience."
                included
              />
              <ReportSection
                icon={Shield}
                title="Ranked Remediation Priorities"
                description="Ordered by business consequence and regulatory urgency — not alphabetically or by CVSS number."
                included
              />
              <ReportSection
                icon={Gavel}
                title="Regulatory Citation Mapping"
                description={`Direct citation of violated articles across ${selectedFrameworks.join(", ")}. No compliance percentages.`}
                included
              />
              <ReportSection
                icon={Lock}
                title="TLS/SSL Certificate Intelligence"
                description="8-dimensional certificate posture analysis mapped to COBAC Circular No. 000002 §4 obligations."
                included={includeTLS}
              />
              <ReportSection
                icon={TrendingUp}
                title="Sector Benchmarking"
                description="Peer comparison vs COBAC-regulated MFIs in CEMAC region. Quartile placement and trend direction."
                included={includeBenchmarks}
              />
              <ReportSection
                icon={ChevronRight}
                title="Attack Path Narrative"
                description="Multi-step breach scenarios reconstructed from discovered assets. No technical graph notation."
                included={includeAttackPaths}
              />
            </div>
          </div>

          {/* Explicitly excluded items — the differentiation story */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/30" />
              Deliberately Excluded From This Report
            </h3>
            <div className="space-y-2">
              {EXCLUDED_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs text-white/35">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-red/40 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/20 mt-4 leading-relaxed">
              MYEVIEW executive reports are built for non-technical leadership, risk committees, and board compliance personnel.
              Technical detail remains available in the full analyst view.
            </p>
          </div>

          {/* Audience callout */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-800/60 border border-white/5">
            <Building2 className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/45 leading-relaxed">
              <strong className="text-white/60">Intended audience:</strong> CEO, CFO, Board Risk Committee, Regulatory Affairs, Internal Audit.
              This report does not contain raw scanner output. Analysts can access full technical findings via the Risk Triage and Discovery pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

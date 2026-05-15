import { useEffect, useState } from "react";
import {
  Shield, AlertTriangle, AlertCircle, CheckCircle2,
  Info, ChevronDown, ChevronUp, Search, Filter, BarChart3,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import type { RiskFinding, Severity } from "../types";

const sevCfg: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string; border: string; order: number }> = {
  critical: { icon: AlertTriangle, color: "text-cyber-red", bg: "bg-cyber-red/10", border: "border-cyber-red/20", order: 0 },
  high: { icon: AlertCircle, color: "text-cyber-amber", bg: "bg-cyber-amber/10", border: "border-cyber-amber/20", order: 1 },
  medium: { icon: Info, color: "text-brand-400", bg: "bg-brand-500/10", border: "border-brand-500/20", order: 2 },
  low: { icon: CheckCircle2, color: "text-cyber-green", bg: "bg-cyber-green/10", border: "border-cyber-green/20", order: 3 },
  info: { icon: Info, color: "text-cyber-purple", bg: "bg-cyber-purple/10", border: "border-cyber-purple/20", order: 4 },
};

export default function RiskScoringPage() {
  const [findings, setFindings] = useState<RiskFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterSev, setFilterSev] = useState<Severity | "all">("all");
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const res = await fetch(`/api/v1/scoring/findings?organization_id=${user?.organization_id}`);
        if (res.ok) { setFindings((await res.json()) || []); }
      } catch (err) { console.error("Failed to fetch risk findings", err); }
      finally { setLoading(false); }
    };
    if (user?.organization_id) fetchFindings();
    else setLoading(false);
  }, [user]);

  const breakdown = findings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {} as Record<string, number>);

  const filtered = findings
    .filter((f) => filterSev === "all" || f.severity === filterSev)
    .filter((f) => !searchQ || f.title.toLowerCase().includes(searchQ.toLowerCase()) || f.asset_value.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => (sevCfg[a.severity]?.order ?? 5) - (sevCfg[b.severity]?.order ?? 5));

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-500" /> Risk Scoring Engine
        </h1>
        <p className="text-sm text-white/40 mt-1">Weighted risk analysis with CVSS-aware scoring, explainable findings, and remediation guidance.</p>
      </div>

      {/* Severity Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => {
          const c = sevCfg[sev]; const I = c.icon;
          return (
            <button key={sev} onClick={() => setFilterSev(filterSev === sev ? "all" : sev)}
              className={cn("glass-card p-4 flex flex-col items-center gap-2 transition-all", filterSev === sev && `ring-1 ${c.border} ${c.bg}`)}>
              <div className={cn("p-2 rounded-lg", c.bg)}><I className={cn("w-5 h-5", c.color)} /></div>
              <span className="stat-number text-2xl font-bold text-white">{breakdown[sev] || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{sev}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Search findings by title or asset..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            className="bg-surface-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white w-full focus:border-brand-500/50 outline-none transition-all" />
        </div>
        <button onClick={() => setFilterSev("all")}
          className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors",
            filterSev === "all" ? "bg-surface-800 border-white/10 text-white/70" : "bg-brand-500/10 border-brand-500/20 text-brand-400")}>
          <Filter className="w-4 h-4" /> {filterSev === "all" ? "All Severities" : `Showing: ${filterSev}`}
        </button>
      </div>

      {/* Findings List */}
      <div className="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-white/40" /> Risk Findings</h3>
          <span className="text-xs text-white/30">{filtered.length} of {findings.length}</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{findings.length === 0 ? "No Risks Detected" : "No Matching Findings"}</h3>
            <p className="text-white/40 max-w-md mx-auto text-sm">{findings.length === 0 ? "Run a discovery scan to identify risk exposure." : "Adjust search or filter."}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((f) => {
              const c = sevCfg[f.severity] || sevCfg.info; const I = c.icon; const open = expandedId === f.id;
              return (
                <div key={f.id} className="hover:bg-white/[0.01] transition-colors">
                  <button onClick={() => setExpandedId(open ? null : f.id)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg flex-shrink-0", c.bg)}><I className={cn("w-4 h-4", c.color)} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{f.title}</p>
                        <p className="text-xs text-white/40 mt-0.5 truncate">{f.asset_value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={cn("text-[10px] font-semibold uppercase px-2 py-1 rounded", c.bg, c.color, `border ${c.border}`)}>{f.severity}</span>
                      {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </button>
                  {open && (
                    <div className="px-6 pb-5 pt-1 animate-fade-in">
                      <div className="bg-surface-900/50 rounded-xl p-5 border border-white/5 space-y-4">
                        <div><h4 className="text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Description</h4><p className="text-sm text-white/80 leading-relaxed">{f.description}</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><h4 className="text-xs font-medium text-white/50 mb-1.5 uppercase">Evidence</h4><p className="text-sm text-white/70">{f.evidence}</p></div>
                          <div><h4 className="text-xs font-medium text-brand-500/80 mb-1.5 uppercase">Remediation</h4><p className="text-sm text-white/70">{f.remediation}</p></div>
                        </div>
                        {f.compliance_refs?.length > 0 && (
                          <div><h4 className="text-xs font-medium text-white/50 mb-1.5 uppercase">Compliance Refs</h4>
                            <div className="flex flex-wrap gap-2">{f.compliance_refs.map((r, i) => (<span key={i} className="text-xs px-2 py-1 rounded bg-surface-800 border border-white/10 text-white/60">{r}</span>))}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

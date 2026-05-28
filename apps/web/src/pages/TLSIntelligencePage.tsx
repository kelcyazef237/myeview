import { useState, useEffect } from "react";
import {
  Lock, AlertTriangle, AlertCircle, CheckCircle2,
  ShieldOff, RefreshCw, ExternalLink, HelpCircle,
  ChevronDown, ChevronUp, Gavel, Network, Eye,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import type { TLSDimension, TLSDimensionKey } from "../types";

// ── 8-Dimension TLS Schema ──────────────────────────────────────────────────
const TLS_DIMENSION_SCHEMA: Omit<TLSDimension, "status" | "affected_assets" | "finding_summary">[] = [
  {
    key: "expired_certs",
    label: "Expired Certificates",
    cobac_article: "COBAC Circular No. 000002, §4",
    cobac_framework: "COBAC",
    remediation: "Renew expired TLS certificates immediately. Implement automated renewal via Let's Encrypt or internal PKI with 30-day pre-expiry alerts.",
    business_risk: "Expired certificates are the most visible external exposure signal. They cause service outages, trigger browser security warnings, and directly indicate a breakdown in security operations to regulators and auditors.",
  },
  {
    key: "weak_ciphers",
    label: "Weak Cipher Suites",
    cobac_article: "COBAC Circular No. 000002, §4.2",
    cobac_framework: "COBAC",
    remediation: "Disable RC4, 3DES, and EXPORT cipher suites on all servers. Configure servers to prefer ECDHE_RSA_WITH_AES_256_GCM_SHA384 and forward-secrecy suites only.",
    business_risk: "RC4, 3DES, and EXPORT ciphers are cryptographically broken. Traffic encrypted with these can be decrypted by attackers, exposing customer financial data and triggering direct violations under COBAC encryption standards.",
  },
  {
    key: "downgrade_risk",
    label: "TLS Downgrade Risk",
    cobac_article: "COBAC Circular No. 000002, §4.3",
    cobac_framework: "COBAC",
    remediation: "Disable TLS_FALLBACK_SCSV negotiation or remove weaker protocol support. Enforce TLS 1.2 minimum with strict cipher ordering.",
    business_risk: "Servers accepting protocol downgrades allow man-in-the-middle attackers to negotiate weaker encryption than both parties support, bypassing the security value of modern TLS.",
  },
  {
    key: "invalid_chain",
    label: "Invalid Certificate Chain",
    cobac_article: "COBAC Circular No. 000002, §4",
    cobac_framework: "COBAC",
    remediation: "Install the complete intermediate CA chain on the server. Validate chain integrity using openssl verify before deployment.",
    business_risk: "Broken certificate chains cause automated payment systems, mobile apps, and API integrations to fail validation checks, potentially halting business operations without warning.",
  },
  {
    key: "missing_hsts",
    label: "Missing HSTS Header",
    cobac_article: "ANTIC Law 2010/012, Art. 8",
    cobac_framework: "ANTIC",
    remediation: "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' to all HTTPS responses. Submit to HSTS preload list.",
    business_risk: "Without HSTS, the first HTTP request from a returning user can be intercepted and downgraded before HTTPS redirect kicks in. This enables session hijacking on unprotected initial connections.",
  },
  {
    key: "deprecated_protocol",
    label: "Deprecated Protocol (TLS 1.0/1.1)",
    cobac_article: "COBAC Circular No. 000002, §4.1",
    cobac_framework: "COBAC",
    remediation: "Disable TLS 1.0 and TLS 1.1 on all servers and load balancers. Update client-facing configurations to TLS 1.2 minimum, TLS 1.3 preferred.",
    business_risk: "TLS 1.0 and 1.1 are explicitly named in COBAC Circular No. 000002 as non-compliant for financial institutions. Continued support constitutes a direct regulatory violation subject to escalating fines under the 2026 Fintech Compliance Framework.",
  },
  {
    key: "wildcard_exposure",
    label: "Wildcard Certificate Exposure",
    cobac_article: "COBAC Circular No. 000002, §4",
    cobac_framework: "COBAC",
    remediation: "Scope wildcard certificates to specific subdomains. Avoid deploying *.domain.com certificates to third-party or shared infrastructure. Audit all systems holding private keys.",
    business_risk: "A wildcard certificate compromise exposes the entire domain namespace — not just one service. If the private key is stolen from any one system, all subdomains under the certificate are impersonable.",
  },
  {
    key: "ct_log_anomaly",
    label: "CT Log Anomaly",
    cobac_article: "Finance Law 2026, Art. 17c",
    cobac_framework: "Finance Law 2026",
    remediation: "Audit Certificate Transparency logs for unauthorized issuance. Revoke rogue certificates immediately via CA revocation request. Investigate potential unauthorized access to domain control.",
    business_risk: "Certificate Transparency log irregularities signal unauthorized certificate issuance — an indicator of domain hijack, rogue CA compromise, or infrastructure drift. Under Finance Law 2026, material certificate anomalies must be reported.",
  },
];

const STATUS_CFG = {
  pass: {
    icon: CheckCircle2,
    color: "text-cyber-green",
    bg: "bg-cyber-green/10",
    border: "border-cyber-green/20",
    label: "Secure",
    dot: "bg-cyber-green",
  },
  warn: {
    icon: AlertCircle,
    color: "text-cyber-amber",
    bg: "bg-cyber-amber/10",
    border: "border-cyber-amber/20",
    label: "Warning",
    dot: "bg-cyber-amber",
  },
  fail: {
    icon: AlertTriangle,
    color: "text-cyber-red",
    bg: "bg-cyber-red/10",
    border: "border-cyber-red/20",
    label: "Critical",
    dot: "bg-cyber-red",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-white/30",
    bg: "bg-white/5",
    border: "border-white/10",
    label: "Unknown",
    dot: "bg-white/20",
  },
};

const FRAMEWORK_COLORS: Record<string, string> = {
  "COBAC": "bg-brand-500/10 border-brand-500/20 text-brand-300",
  "ANTIC": "bg-purple-500/10 border-purple-500/20 text-purple-300",
  "Finance Law 2026": "bg-amber-500/10 border-amber-500/20 text-amber-300",
};

// ── Derive TLS dimensions from scoring API findings ─────────────────────────
function deriveDimensionsFromFindings(findings: any[]): Map<TLSDimensionKey, Partial<TLSDimension>> {
  const map = new Map<TLSDimensionKey, Partial<TLSDimension>>();

  findings.forEach((f) => {
    const title = (f.title || "").toLowerCase();
    const match = (keys: string[]): boolean => keys.some((k) => title.includes(k));

    let key: TLSDimensionKey | null = null;
    if (match(["expired cert", "certificate expir", "ssl expired", "tls expired"])) key = "expired_certs";
    else if (match(["rc4", "3des", "export cipher", "weak cipher", "weak encryption"])) key = "weak_ciphers";
    else if (match(["downgrade", "fallback", "ssl stripping"])) key = "downgrade_risk";
    else if (match(["invalid chain", "cert chain", "incomplete chain", "untrusted ca"])) key = "invalid_chain";
    else if (match(["hsts", "strict transport"])) key = "missing_hsts";
    else if (match(["tls 1.0", "tls 1.1", "ssl 3", "sslv3", "deprecated protocol", "tls version"])) key = "deprecated_protocol";
    else if (match(["wildcard", "*."])) key = "wildcard_exposure";
    else if (match(["ct log", "certificate transparency", "unauthorized certificate"])) key = "ct_log_anomaly";

    if (!key) return;

    const existing = map.get(key);
    const assets = existing?.affected_assets || [];
    if (f.asset_value && !assets.includes(f.asset_value)) assets.push(f.asset_value);

    map.set(key, {
      status: f.severity === "critical" || f.severity === "high" ? "fail" : "warn",
      affected_assets: assets,
      finding_summary: existing?.finding_summary || f.description || "",
    });
  });

  return map;
}

// ── TLS Dimension Card ───────────────────────────────────────────────────────
function DimensionCard({ dimension }: { dimension: TLSDimension }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[dimension.status];
  const Icon = cfg.icon;
  const frameworkClass = FRAMEWORK_COLORS[dimension.cobac_framework] ?? FRAMEWORK_COLORS["COBAC"];

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        cfg.border,
        dimension.status === "fail"
          ? "bg-cyber-red/[0.04]"
          : dimension.status === "warn"
            ? "bg-cyber-amber/[0.03]"
            : "theme-bg-card"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Status indicator */}
          <div className={cn("p-2.5 rounded-xl flex-shrink-0", cfg.bg)}>
            <Icon className={cn("w-5 h-5", cfg.color)} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold theme-text">{dimension.label}</p>
              {/* Pulse for fails */}
              {dimension.status === "fail" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-red opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-red" />
                </span>
              )}
            </div>
            <p className="text-xs theme-text-tertiary mt-0.5 truncate">
              {dimension.affected_assets.length > 0
                ? `${dimension.affected_assets.length} asset${dimension.affected_assets.length !== 1 ? "s" : ""} affected`
                : dimension.status === "pass"
                  ? "No issues detected"
                  : "Awaiting scan data"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Framework citation badge */}
          <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide", frameworkClass)}>
            <Gavel className="w-2.5 h-2.5" />
            {dimension.cobac_framework}
          </span>
          {/* Status badge */}
          <span className={cn("text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border", cfg.bg, cfg.color, cfg.border)}>
            {cfg.label}
          </span>
          {open ? <ChevronUp className="w-4 h-4 theme-text-muted" /> : <ChevronDown className="w-4 h-4 theme-text-muted" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t theme-border-subtle px-5 pb-5 pt-4 space-y-4 animate-fade-in">
          {/* Business risk */}
          <div className={cn("p-4 rounded-xl border", cfg.bg, cfg.border)}>
            <h4 className={cn("text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5", cfg.color)}>
              <Eye className="w-3.5 h-3.5" /> Business Risk
            </h4>
            <p className="text-sm theme-text-secondary leading-relaxed">{dimension.business_risk}</p>
          </div>

          {/* Finding summary */}
          {dimension.finding_summary && (
            <div>
              <h4 className="text-[11px] font-semibold theme-text-muted uppercase tracking-widest mb-2">
                Technical Finding
              </h4>
              <p className="text-sm theme-text-secondary leading-relaxed font-mono text-xs">{dimension.finding_summary}</p>
            </div>
          )}

          {/* Affected assets */}
          {dimension.affected_assets.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold theme-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" /> Affected Domains / IPs
              </h4>
              <div className="flex flex-col gap-2">
                {dimension.affected_assets.map((asset, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg theme-bg-input theme-border-subtle">
                    <span className="text-xs font-mono font-semibold theme-text">{asset}</span>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full badge-critical border">
                      Flagged
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regulatory citation */}
          <div className="flex items-center gap-2 pt-1">
            <Gavel className="w-3.5 h-3.5 theme-text-muted flex-shrink-0" />
            <span className="text-xs theme-text-tertiary">Regulatory obligation:</span>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", frameworkClass)}>
              {dimension.cobac_article}
            </span>
          </div>

          {/* Remediation */}
          <div className="bg-emerald-500/[0.06] rounded-xl p-4 border border-emerald-500/20">
            <h4 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Action
            </h4>
            <p className="text-sm theme-text-secondary leading-relaxed">{dimension.remediation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary stats ────────────────────────────────────────────────────────────
function SummaryStats({ dimensions }: { dimensions: TLSDimension[] }) {
  const fail = dimensions.filter((d) => d.status === "fail").length;
  const warn = dimensions.filter((d) => d.status === "warn").length;
  const pass = dimensions.filter((d) => d.status === "pass").length;
  const unknown = dimensions.filter((d) => d.status === "unknown").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { count: fail, label: "Critical Issues", color: "text-cyber-red", bg: "bg-cyber-red/10", border: "border-cyber-red/20", Icon: AlertTriangle },
        { count: warn, label: "Warnings", color: "text-cyber-amber", bg: "bg-cyber-amber/10", border: "border-cyber-amber/20", Icon: AlertCircle },
        { count: pass, label: "Passing", color: "text-cyber-green", bg: "bg-cyber-green/10", border: "border-cyber-green/20", Icon: CheckCircle2 },
        { count: unknown, label: "Awaiting Data", color: "text-white/30", bg: "bg-white/5", border: "border-white/10", Icon: HelpCircle },
      ].map(({ count, label, color, bg, border, Icon }) => (
        <div key={label} className={cn("rounded-xl border p-4 flex flex-col items-center gap-2", bg, border)}>
          <Icon className={cn("w-5 h-5", color)} />
          <span className={cn("text-2xl font-bold tabular-nums", color)}>{count}</span>
          <span className="text-[10px] uppercase tracking-wider theme-text-tertiary font-semibold text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TLSIntelligencePage() {
  const [dimensions, setDimensions] = useState<TLSDimension[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { user } = useAuthStore();

  const buildDimensions = (findings: any[]): TLSDimension[] => {
    const derived = deriveDimensionsFromFindings(findings);
    return TLS_DIMENSION_SCHEMA.map((schema) => ({
      ...schema,
      status: derived.get(schema.key)?.status ?? "unknown",
      affected_assets: derived.get(schema.key)?.affected_assets ?? [],
      finding_summary: derived.get(schema.key)?.finding_summary ?? "",
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pull from scoring findings, filter for TLS-relevant findings
      const [scoringRes, assetsRes] = await Promise.all([
        fetch(`/api/v1/scoring/findings?organization_id=${user?.organization_id}`),
        fetch(`/api/v1/discovery/assets?organization_id=${user?.organization_id}`)
      ]);
      
      if (scoringRes.ok) {
        const allFindings = (await scoringRes.json()) || [];
        setDimensions(buildDimensions(allFindings));
      } else {
        setDimensions(buildDimensions([]));
      }

      if (assetsRes.ok) {
        const allAssets = (await assetsRes.json()) || [];
        setAssets(allAssets);
      } else {
        setAssets([]);
      }
    } catch {
      setDimensions(buildDimensions([]));
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    if (user?.organization_id) fetchData();
    else {
      setDimensions(buildDimensions([]));
      setLoading(false);
    }
  }, [user]);

  const criticalCount = dimensions.filter((d) => d.status === "fail").length;

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold theme-text flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-brand-500" />
            TLS/SSL Certificate Intelligence
          </h1>
          <p className="text-sm theme-text-tertiary mt-1">
            8-dimensional certificate posture · Mapped to COBAC Circular No. 000002, ANTIC, and Finance Law 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] theme-text-muted hidden sm:block">
            Refreshed {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm theme-text-secondary theme-bg-card border theme-border-subtle rounded-lg hover:theme-border-default transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Critical Alert Banner ────────────────────────────────────── */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-cyber-red/5 border border-cyber-red/20 animate-fade-in">
          <ShieldOff className="w-5 h-5 text-cyber-red flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-cyber-red">
              {criticalCount} critical TLS issue{criticalCount !== 1 ? "s" : ""} detected
            </p>
            <p className="text-xs theme-text-secondary mt-0.5">
              These configurations constitute direct violations of COBAC Circular No. 000002 encryption standards and require immediate remediation.
            </p>
          </div>
          <a
            href="/compliance"
            className="flex items-center gap-1 text-xs text-cyber-red/70 hover:text-cyber-red transition-colors flex-shrink-0"
          >
            View compliance impact <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      )}

      {/* ── Summary Stats ────────────────────────────────────────────── */}
      <SummaryStats dimensions={dimensions} />

      {/* ── 8 Dimension Cards ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sort: fail first, then warn, then pass, then unknown */}
          {[...dimensions]
            .sort((a, b) => {
              const order = { fail: 0, warn: 1, pass: 2, unknown: 3 };
              return (order[a.status] ?? 3) - (order[b.status] ?? 3);
            })
            .map((dim) => (
              <DimensionCard key={dim.key} dimension={dim} />
            ))}
            
          {/* ── TLS Asset Overview Table ────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t theme-border-subtle">
            <h2 className="text-lg font-bold theme-text mb-4">Domain Certificates Overview</h2>
            <div className="theme-bg-card rounded-2xl border theme-border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="theme-bg-body border-b theme-border-subtle">
                    <tr>
                      <th className="px-6 py-4 font-medium theme-text-secondary">Domain / IP</th>
                      <th className="px-6 py-4 font-medium theme-text-secondary">TLS Status</th>
                      <th className="px-6 py-4 font-medium theme-text-secondary">Issuer</th>
                      <th className="px-6 py-4 font-medium theme-text-secondary">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border-subtle">
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center theme-text-tertiary text-sm">
                          No assets found. Run a discovery scan first.
                        </td>
                      </tr>
                    ) : (
                      assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-black/[0.02] transition-colors">
                          <td className="px-6 py-4 font-medium theme-text">{asset.name}</td>
                          <td className="px-6 py-4">
                            {asset.tls_valid === true ? (
                              <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider badge-low">Valid</span>
                            ) : asset.tls_valid === false && asset.tls_cert_issuer ? (
                              <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider badge-critical">Invalid</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider theme-bg-input theme-text-muted theme-border-subtle border">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs theme-text-secondary max-w-[200px] truncate" title={asset.tls_cert_issuer || "N/A"}>
                            {asset.tls_cert_issuer ? asset.tls_cert_issuer.split(",")[0].replace("CN=", "") : "-"}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">
                            {asset.tls_cert_expiry && asset.tls_cert_expiry !== "0001-01-01T00:00:00Z" ? (
                              <span className={new Date(asset.tls_cert_expiry) < new Date() ? "text-cyber-red font-bold" : "theme-text-secondary"}>
                                {new Date(asset.tls_cert_expiry).toLocaleDateString()}
                              </span>
                            ) : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer note ──────────────────────────────────────────────── */}
      <div className="text-xs theme-text-muted text-center pt-2">
        TLS data is derived from passive intelligence and semi-active validation (TLS handshakes, certificate retrieval). No intrusive scanning is performed.
      </div>
    </div>
  );
}

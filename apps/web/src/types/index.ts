/* ───────────────────────────────────────────────
   MYEVIEW TypeScript Type Definitions
   ─────────────────────────────────────────────── */

// ── Auth ──
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization_id: string;
  organization_name: string;
  avatar_url?: string;
  created_at: string;
}

export type UserRole = "admin" | "analyst" | "viewer";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organization_name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ── Assets ──
export type AssetType = "domain" | "subdomain" | "ip" | "service" | "certificate" | "cloud";
export type AssetStatus = "active" | "inactive" | "unknown";

export interface Asset {
  id: string;
  type: AssetType;
  value: string;
  status: AssetStatus;
  risk_score: number;
  first_seen: string;
  last_seen: string;
  organization_id: string;
}

// ── Risk ──
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface RiskFinding {
  id: string;
  title: string;
  severity: Severity;
  confidence: number;
  asset_id: string;
  asset_value: string;
  description: string;
  evidence: string;
  remediation: string;
  compliance_refs: string[];
  business_impact?: string;      // executive-facing consequence narrative
  is_exploitable?: boolean;      // true = real attack opportunity
  created_at: string;
}

// ── Mye-Score ──
export interface MyeScore {
  score: number;              // 0-100, higher = healthier
  quartile: 1 | 2 | 3 | 4;
  sector_percentile: number;  // 0-100, % of peers you score higher than
  sector_label: string;       // e.g. "COBAC-regulated MFIs, CEMAC region"
  sector_median?: number;     // average score across peer set
  peer_count: number;
  trend: "improving" | "stable" | "degrading";
}

// ── TLS Intelligence ──
export type TLSDimensionKey =
  | "expired_certs"
  | "weak_ciphers"
  | "downgrade_risk"
  | "invalid_chain"
  | "missing_hsts"
  | "deprecated_protocol"
  | "wildcard_exposure"
  | "ct_log_anomaly";

export interface TLSDimension {
  key: TLSDimensionKey;
  label: string;
  status: "pass" | "warn" | "fail" | "unknown";
  affected_assets: string[];
  cobac_article: string;
  cobac_framework: string;
  finding_summary: string;
  remediation: string;
  business_risk: string;     // plain-language risk for CEO
}

// ── Triage ──
export interface TriageFilter {
  mode: "executive" | "full";
  min_confidence: number;    // 0.0-1.0, findings below this are hidden in executive mode
  hidden_count: number;
}

// ── Executive Report ──
export interface ReportConfig {
  organization_id: string;
  scope_domains: string[];
  include_tls: boolean;
  include_benchmarks: boolean;
  include_compliance: boolean;
  regulatory_frameworks: ("COBAC" | "ANTIC" | "Finance Law 2026")[];
}

// ── Benchmarking ──
export interface SectorBenchmark {
  metric: string;
  organization_value: number;
  sector_median: number;
  sector_p25: number;  // top quartile threshold
  sector_p75: number;  // bottom quartile threshold
  unit: string;
  context_label: string;  // e.g. "External exposure score"
}

// ── Activity ──
export type ActivityType = "discovery" | "alert" | "compliance" | "scan" | "user";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  severity?: Severity;
  timestamp: string;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  total_assets: number;
  active_risks: number;
  compliance_score: number;
  scan_status: "idle" | "running" | "completed" | "failed";
  assets_change: number;
  risks_change: number;
  compliance_change: number;
}

// ── Navigation ──
export interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

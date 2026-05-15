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
  created_at: string;
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

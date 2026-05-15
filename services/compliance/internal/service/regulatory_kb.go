package service

import (
	"strings"
	"time"

	"github.com/myeview/myeview/services/compliance/internal/domain"
)

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Law Keys — Primary Keys for the Cameroonian Regulatory Framework
// Source: MYEVIEW Compliance Violation Notice document
//
// These keys are the stable identifiers. If COBAC or ANTIC updates their
// bulletins, we only update the rule definition here — one change ripples
// across all organization dashboards.
// ─────────────────────────────────────────────────────────────────────────────

const (
	KeyCOBAC_CIRC_000002_2026   = "COBAC_CIRC_000002_2026"
	KeyCOBAC_R_2025_02          = "COBAC_R_2025_02"
	KeyANTIC_LAW_2010_012_ART7  = "ANTIC_LAW_2010_012_ART7"
	KeyANTIC_CIRT_SURVEILLANCE  = "ANTIC_CIRT_SURVEILLANCE"
	KeyFINANCE_LAW_2026_ART17C  = "FINANCE_LAW_2026_ART17C"
	KeyCOBAC_AUDIT_TRAIL        = "COBAC_AUDIT_TRAIL"
)

// RegulatoryRule represents one entry in the Cameroonian regulatory framework.
type RegulatoryRule struct {
	// CanonicalKey is the stable database primary key (e.g. "COBAC_CIRC_000002_2026")
	CanonicalKey string
	// LawName is the full, human-readable law name
	LawName string
	// Article is the specific article or section referenced
	Article string
	// MandatedState describes what the law requires
	MandatedState string
	// BusinessStake explains the business risk in CEO-level language
	BusinessStake string
	// AlertLevel is "CRITICAL ALERT", "HIGH ALERT", or "ADVISORY"
	AlertLevel string
	// Severity maps to the ComplianceGap severity field
	Severity string
	// Keywords are the factor strings that trigger this rule (case-insensitive match)
	Keywords []string
	// RemediationTemplate is the recommended fix action
	RemediationTemplate string
}

// regulatoryKnowledgeBase is the canonical mapping of vulnerabilities to
// Cameroonian laws, derived from the MYEVIEW Compliance Violation Notice document.
var regulatoryKnowledgeBase = []RegulatoryRule{
	{
		CanonicalKey: KeyCOBAC_CIRC_000002_2026,
		LawName:      "COBAC Circular No. 000002",
		Article:      "Encryption & System Standards for Financial Transactions",
		MandatedState: "Explicitly mandates minimum technical standards for data integrity " +
			"and encryption for dematerialized financial transactions. Mandates that payment " +
			"systems meet technical standards for access controls and uptime to ensure the " +
			"safety of financial flows.",
		BusinessStake: "Non-compliance with COBAC encryption mandates may trigger regulatory " +
			"scrutiny, remediation obligations, or audit findings under the 2026 fintech " +
			"compliance framework. Financial institutions risk increased audit frequency " +
			"and potential license conditions.",
		AlertLevel: "CRITICAL ALERT",
		Severity:   "critical",
		Keywords: []string{
			"ssl", "tls", "certificate", "expired", "encryption",
			"insecure remote", "rdp", "ssh", "access control",
			"http only", "no https",
		},
		RemediationTemplate: "Deploy a valid TLS 1.3 certificate immediately. Disable insecure " +
			"protocols (HTTP, TLS 1.0/1.1). Implement multi-factor authentication for all " +
			"remote access. Target: within 24 hours to maintain Defensible Risk posture.",
	},
	{
		CanonicalKey: KeyCOBAC_R_2025_02,
		LawName:      "COBAC Regulation R-2025/02",
		Article:      "Cyber Resilience & Third-Party Risk Management",
		MandatedState: "Requires banks and MFIs to maintain system and infrastructure standards " +
			"that ensure data integrity and prevent unauthorized access. Banks are expected to " +
			"manage third-party digital risk. Failure to monitor vendors may trigger remediation " +
			"requirements or audit findings.",
		BusinessStake: "Unpatched systems and unmonitored vendor APIs represent direct exposure " +
			"under COBAC cyber resilience requirements. Institutions with known CVEs or insecure " +
			"vendor connections face mandatory remediation timelines enforced by COBAC supervisors.",
		AlertLevel: "CRITICAL ALERT",
		Severity:   "critical",
		Keywords: []string{
			"vulnerability", "cve", "unpatched", "outdated", "patch",
			"vendor", "partner", "api", "third-party", "supplier",
			"known vulnerabilities",
		},
		RemediationTemplate: "Apply all critical security patches within 72 hours. Conduct immediate " +
			"vendor security assessment. Implement automated vulnerability scanning on a weekly schedule. " +
			"Document remediation actions for COBAC audit trail.",
	},
	{
		CanonicalKey: KeyANTIC_LAW_2010_012_ART7,
		LawName:      "ANTIC Law No. 2010/012",
		Article:      "Article 7 — CIRT Security Bulletin Compliance",
		MandatedState: "Mandates that institutions implement recommendations from security bulletins " +
			"issued by the CIRT (Computer Incident Response Team) to correct vulnerabilities " +
			"inherent in systems. Open or exposed service ports that have been identified in " +
			"CIRT advisories must be remediated.",
		BusinessStake: "Failure to comply with ANTIC Law 2010/012 Art. 7 may result in regulatory " +
			"sanctions from the Agence Nationale des Technologies de l'Information et de la " +
			"Communication. This law applies to all entities operating in Cameroon's digital space, " +
			"including MFIs and fintech operators.",
		AlertLevel: "HIGH ALERT",
		Severity:   "high",
		Keywords: []string{
			"open port", "exposed port", "port 22", "port 3389", "port 21",
			"ftp", "telnet", "service exposed", "network exposure",
			"identified technologies",
		},
		RemediationTemplate: "Immediately close or firewall all non-essential ports. " +
			"Review ANTIC CIRT security bulletins for your service type. " +
			"Document all open ports with business justification for regulatory review.",
	},
	{
		CanonicalKey: KeyANTIC_CIRT_SURVEILLANCE,
		LawName:      "ANTIC CIRT National Surveillance Mandate",
		Article:      "National Cyberspace Infrastructure Protection",
		MandatedState: "ANTIC identifies critical national cyberspace infrastructure and monitors " +
			"incidents threatening .cm domain stability. Institutions with DNS misconfigurations " +
			"that could enable hijacking or domain spoofing are subject to CIRT incident reporting " +
			"obligations.",
		BusinessStake: "DNS misconfigurations on .cm domains expose the institution to hijacking " +
			"and man-in-the-middle attacks. Under the ANTIC CIRT mandate, such misconfigurations " +
			"must be reported and remediated. Failure to do so may result in domain suspension " +
			"or mandatory CIRT-supervised remediation.",
		AlertLevel: "HIGH ALERT",
		Severity:   "high",
		Keywords: []string{
			"dns", "spf", "dmarc", "dnssec", "missing spf", "missing dmarc",
			"dns misconfiguration", "domain", "email authentication",
		},
		RemediationTemplate: "Publish a valid SPF record, DMARC policy (minimum p=quarantine), " +
			"and enable DNSSEC on all .cm domains. Report significant DNS incidents to ANTIC CIRT. " +
			"Target resolution: 48 hours.",
	},
	{
		CanonicalKey: KeyFINANCE_LAW_2026_ART17C,
		LawName:      "Finance Law 2026",
		Article:      "Article 17c — Digital Economic Presence & Real-Time E-Invoicing",
		MandatedState: "Establishes Significant Economic Presence tax considerations for " +
			"non-resident platforms. Requires transaction-level visibility and automated tax " +
			"control. Inability to provide audit logs may create tax compliance exposure.",
		BusinessStake: "Use of non-resident SaaS platforms (AWS, Azure, Google Cloud without " +
			"local data residency) may trigger Significant Economic Presence tax obligations " +
			"under Finance Law 2026. Missing audit logs create direct tax compliance exposure " +
			"and may invalidate tax deductions on digital services.",
		AlertLevel: "HIGH ALERT",
		Severity:   "high",
		Keywords: []string{
			"cloud exposure", "aws", "azure", "google cloud", "cloudflare",
			"non-resident", "saas", "logging", "audit", "shadow it",
			"unmapped", "cloud provider",
		},
		RemediationTemplate: "Conduct a cloud data residency audit. Register all non-resident " +
			"SaaS with Finance Ministry's digital services registry. Implement transaction-level " +
			"logging for all financial operations. Target: 30-day compliance roadmap.",
	},
	{
		CanonicalKey: KeyCOBAC_AUDIT_TRAIL,
		LawName:      "COBAC Audit Trail Obligations",
		Article:      "Tamper-Evident Digital Audit Trails for Financial Transactions",
		MandatedState: "Mandates comprehensive, tamper-evident digital audit trails for " +
			"transactions. You cannot audit what you cannot see. Shadow IT and unmapped assets " +
			"create blind spots in the audit trail that COBAC examiners will identify.",
		BusinessStake: "Shadow IT and unmapped digital assets directly compromise COBAC audit " +
			"trail requirements. During a COBAC supervisory examination, undocumented systems " +
			"processing any financial data — even indirectly — may result in findings that " +
			"require immediate remediation and may delay license renewals.",
		AlertLevel: "HIGH ALERT",
		Severity:   "high",
		Keywords: []string{
			"shadow", "unmapped", "undocumented", "asset discovered", "unknown service",
			"unregistered", "hidden", "rogue",
		},
		RemediationTemplate: "Conduct a complete asset inventory using MYEVIEW's discovery scan. " +
			"Document all discovered assets with business owner and data classification. " +
			"Submit updated asset register to COBAC as part of your next supervisory return.",
	},
}

// ─────────────────────────────────────────────────────────────────────────────
// FindMatchingRules performs deterministic keyword matching against the
// canonical regulatory knowledge base. Returns all matching rules for a
// given set of risk factors.
//
// This is Tier 1 — zero latency, zero token cost, never hallucinates.
// ─────────────────────────────────────────────────────────────────────────────

func FindMatchingRules(factors []string, assetMetadata map[string]string) []RegulatoryRule {
	var matched []RegulatoryRule
	seenKeys := make(map[string]bool)

	// Combine all factors and metadata into one searchable string
	combined := strings.ToLower(strings.Join(factors, " "))
	for k, v := range assetMetadata {
		combined += " " + strings.ToLower(k) + " " + strings.ToLower(v)
	}

	for _, rule := range regulatoryKnowledgeBase {
		if seenKeys[rule.CanonicalKey] {
			continue
		}
		for _, keyword := range rule.Keywords {
			if strings.Contains(combined, strings.ToLower(keyword)) {
				matched = append(matched, rule)
				seenKeys[rule.CanonicalKey] = true
				break
			}
		}
	}

	return matched
}

// BuildViolationGap converts a matched RegulatoryRule + risk event into
// a ComplianceGap domain object ready for persistence.
func BuildViolationGap(
	rule RegulatoryRule,
	orgID, assetName, evidence string,
) *domain.ComplianceGap {
	return &domain.ComplianceGap{
		AssetName:           assetName,
		CanonicalKey:        rule.CanonicalKey,
		LawName:             rule.LawName,
		Article:             rule.Article,
		ViolatedRequirement: rule.MandatedState,
		BusinessStake:       rule.BusinessStake,
		Evidence:            evidence,
		Remediation:         rule.RemediationTemplate,
		AlertLevel:          rule.AlertLevel,
		Severity:            rule.Severity,
		MatchSource:         "deterministic",
		Status:              "open",
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}
}

// SeedRegulations returns the canonical regulation documents for seeding
// the pgvector database. These provide the RAG fallback for novel findings.
func SeedRegulations() []struct {
	Name    string
	Version string
	Content string
} {
	return []struct {
		Name    string
		Version string
		Content string
	}{
		{
			Name:    "COBAC Circular No. 000002",
			Version: "2026",
			Content: `COBAC Circular No. 000002 — Encryption and System Standards for Financial Transactions

This circular establishes minimum technical standards for data integrity and encryption for all dematerialized financial transactions conducted by banking institutions and Microfinance Institutions (MFIs) supervised by COBAC in the CEMAC zone.

Article 1 — Scope: Applies to all banks, MFIs, electronic money institutions, and payment service providers supervised by COBAC.

Article 2 — Encryption Mandate: All financial data in transit must be encrypted using TLS 1.2 or higher. TLS 1.3 is the recommended standard. HTTP-only endpoints processing any financial data are prohibited.

Article 3 — Access Control Standards: Payment systems must implement multi-factor authentication for privileged access. Remote administration via insecure protocols (Telnet, unencrypted RDP, unencrypted SSH without key-based auth) is prohibited.

Article 4 — Certificate Management: SSL/TLS certificates must be valid and issued by a recognized Certificate Authority. Expired certificates must be replaced within 24 hours of expiry. Certificate expiry monitoring is mandatory.

Article 5 — Payment System Uptime: Core payment systems must maintain 99.5% uptime. Planned maintenance windows must be declared to COBAC 72 hours in advance.

Sanctions: Non-compliance may result in remediation orders, increased supervisory scrutiny, monetary penalties, or conditions placed on operating licenses.`,
		},
		{
			Name:    "COBAC Regulation R-2025/02",
			Version: "2025",
			Content: `COBAC Regulation R-2025/02 — Cyber Resilience for Banking and Microfinance Institutions

This regulation establishes a comprehensive cyber resilience framework for all COBAC-supervised institutions operating in the CEMAC zone.

Chapter 1 — Vulnerability Management: Institutions must maintain a documented vulnerability management program. Critical CVEs (CVSS score 9.0+) must be patched within 72 hours. High severity CVEs must be patched within 30 days. All systems must run supported, vendor-maintained software versions.

Chapter 2 — Third-Party Risk Management: Institutions must conduct documented due diligence on all technology vendors with access to financial data. Vendor security assessments must be conducted annually. Insecure vendor API connections that expose customer financial data must be remediated within 48 hours of discovery.

Chapter 3 — Incident Response: Institutions must maintain a documented Cyber Incident Response Plan. Significant cyber incidents must be reported to COBAC within 24 hours of detection. Near-miss events must be logged for supervisory review.

Chapter 4 — Penetration Testing: Annual penetration testing by a qualified third party is mandatory for all institutions with digital channels.

Definitions: "Cyber resilience" means the ability to anticipate, withstand, recover from, and adapt to adverse conditions, stresses, attacks, or compromises on cyber resources.`,
		},
		{
			Name:    "ANTIC Law No. 2010/012",
			Version: "2010",
			Content: `ANTIC Law No. 2010/012 — Electronic Communications and Cybersecurity in Cameroon

Article 7 — Security Standards and CIRT Compliance: All entities operating information systems in Cameroon's national cyberspace are required to implement recommendations issued by the CIRT (Computer Incident Response Team) of ANTIC. This includes patching vulnerabilities identified in CIRT security bulletins and closing ports or services identified as threat vectors in national security advisories.

Article 8 — National Cyberspace Infrastructure: ANTIC identifies and protects critical national cyberspace infrastructure. Operators of .cm domain names and digital services are subject to ANTIC's surveillance mandate and must cooperate with incident investigations.

Article 12 — Reporting Obligations: Operators of critical digital infrastructure must report significant cybersecurity incidents to ANTIC within 72 hours. Failure to report constitutes a violation of this law.

Article 15 — Sanctions: Violations of this law may result in fines, suspension of operating licenses, and in cases of gross negligence, criminal referral.

CIRT Mandate: The CIRT is responsible for monitoring threats to national cyberspace, issuing vulnerability alerts, and coordinating incident response. Entities must subscribe to CIRT advisories and implement remediation within specified timeframes.`,
		},
		{
			Name:    "Finance Law 2026 — Article 17c",
			Version: "2026",
			Content: `Finance Law of Cameroon 2026 — Article 17c: Digital Economy and Significant Economic Presence

Article 17c — Significant Economic Presence (SEP) Tax: Non-resident digital platforms generating revenue from Cameroonian users are subject to the Significant Economic Presence tax framework. This applies to SaaS providers, cloud platforms, and digital service providers whose services are consumed in Cameroon regardless of where the provider is incorporated.

Real-Time E-Invoicing Mandate: All taxable commercial transactions above the threshold must be accompanied by real-time electronic invoices transmitted to the DGI (Direction Générale des Impôts) digital fiscal system. Institutions must maintain transaction-level logs that can be queried by tax authorities.

Data Residency Considerations: Financial institutions using non-resident cloud providers for systems that process customer financial data must ensure compliance with both COBAC data protection requirements and Finance Law digital presence provisions.

Audit Log Requirements: Transaction logs must be maintained for a minimum of 10 years in a tamper-evident format. Logs must be accessible to authorized fiscal authorities within 24 hours of request.

Penalties: Non-compliance with real-time e-invoicing requirements may result in tax assessments, penalties of up to 100% of undeclared transaction value, and suspension of fiscal advantages.`,
		},
		{
			Name:    "COBAC Audit Trail Obligations",
			Version: "2026",
			Content: `COBAC Supervisory Requirements — Digital Audit Trail Standards

Audit Trail Mandate: All COBAC-supervised institutions must maintain comprehensive, tamper-evident digital audit trails for all financial transactions and system access events. The audit trail must capture: who performed an action, what action was performed, when it was performed, and from what system.

Shadow IT Prohibition: All systems that touch, process, or have access to financial data must be documented in the institution's IT asset register. Undocumented systems ("shadow IT") discovered during COBAC supervisory examinations constitute an automatic finding requiring remediation.

Asset Discovery Requirements: Institutions must maintain an up-to-date inventory of all digital assets including servers, network equipment, cloud services, and third-party integrations. Annual asset inventory audits are required and must be available for COBAC review.

Consequences of Non-Compliance: Shadow IT findings during supervisory examinations may result in: (1) mandatory remediation orders with defined timelines, (2) enhanced supervisory monitoring for 12-24 months, (3) conditions placed on expansion licenses, (4) in cases involving customer data exposure, mandatory customer notification obligations.`,
		},
	}
}

package domain

// Role represents an authorization role in the RBAC system.
type Role string

const (
	RoleAdmin   Role = "admin"
	RoleAnalyst Role = "analyst"
	RoleViewer  Role = "viewer"
)

// IsValid checks if the role is a recognized value.
func (r Role) IsValid() bool {
	switch r {
	case RoleAdmin, RoleAnalyst, RoleViewer:
		return true
	}
	return false
}

// Permission represents a granular access permission.
type Permission string

const (
	PermAssetRead       Permission = "asset:read"
	PermAssetWrite      Permission = "asset:write"
	PermScanExecute     Permission = "scan:execute"
	PermRiskRead        Permission = "risk:read"
	PermComplianceRead  Permission = "compliance:read"
	PermComplianceWrite Permission = "compliance:write"
	PermSettingsRead    Permission = "settings:read"
	PermSettingsWrite   Permission = "settings:write"
	PermUserManage      Permission = "user:manage"
)

// RolePermissions maps each role to its allowed permissions.
var RolePermissions = map[Role][]Permission{
	RoleAdmin: {
		PermAssetRead, PermAssetWrite,
		PermScanExecute,
		PermRiskRead,
		PermComplianceRead, PermComplianceWrite,
		PermSettingsRead, PermSettingsWrite,
		PermUserManage,
	},
	RoleAnalyst: {
		PermAssetRead, PermAssetWrite,
		PermScanExecute,
		PermRiskRead,
		PermComplianceRead,
		PermSettingsRead,
	},
	RoleViewer: {
		PermAssetRead,
		PermRiskRead,
		PermComplianceRead,
	},
}

// HasPermission checks if a role has a specific permission.
func HasPermission(role Role, perm Permission) bool {
	perms, ok := RolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

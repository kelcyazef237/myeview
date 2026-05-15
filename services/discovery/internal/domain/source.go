package domain

import (
	"context"
)

// DiscoverySource defines the contract for any passive intelligence source (e.g., crt.sh, shodan, alienvault).
type DiscoverySource interface {
	// Name returns the identifier of the source (e.g., "crt.sh", "alienvault").
	Name() string
	
	// Discover fetches passive intelligence assets for a given target domain.
	Discover(ctx context.Context, target string) ([]DiscoveredAsset, error)
}

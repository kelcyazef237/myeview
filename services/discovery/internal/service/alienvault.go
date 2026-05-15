package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/myeview/myeview/services/discovery/internal/domain"
)

type AlienVaultResponse struct {
	PassiveDNS []struct {
		Hostname string `json:"hostname"`
	} `json:"passive_dns"`
}

type AlienVaultSource struct {
	client *http.Client
}

func NewAlienVaultSource() *AlienVaultSource {
	return &AlienVaultSource{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *AlienVaultSource) Name() string {
	return "alienvault"
}

func (s *AlienVaultSource) Discover(ctx context.Context, target string) ([]domain.DiscoveredAsset, error) {
	url := fmt.Sprintf("https://otx.alienvault.com/api/v1/indicators/domain/%s/passive_dns", target)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("alienvault request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("alienvault returned status: %d", resp.StatusCode)
	}

	var otxResp AlienVaultResponse
	if err := json.NewDecoder(resp.Body).Decode(&otxResp); err != nil {
		return nil, fmt.Errorf("failed to decode alienvault response: %w", err)
	}

	uniqueNames := make(map[string]bool)
	var assets []domain.DiscoveredAsset

	for _, record := range otxResp.PassiveDNS {
		hostname := record.Hostname
		if hostname == "" || uniqueNames[hostname] {
			continue
		}
		uniqueNames[hostname] = true

		assets = append(assets, domain.DiscoveredAsset{
			Name:      hostname,
			Type:      "subdomain",
			Source:    s.Name(),
			Timestamp: time.Now(),
		})
	}

	return assets, nil
}

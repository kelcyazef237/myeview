package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/myeview/myeview/services/discovery/internal/domain"
)

type ShodanResponse struct {
	Domain     string   `json:"domain"`
	Subdomains []string `json:"subdomains"`
}

type ShodanSource struct {
	client *http.Client
	apiKey string
}

func NewShodanSource(apiKey string) *ShodanSource {
	return &ShodanSource{
		client: &http.Client{Timeout: 30 * time.Second},
		apiKey: apiKey,
	}
}

func (s *ShodanSource) Name() string {
	return "shodan"
}

func (s *ShodanSource) Discover(ctx context.Context, target string) ([]domain.DiscoveredAsset, error) {
	if s.apiKey == "" {
		// Silently skip if no API key is provided
		return nil, nil
	}

	url := fmt.Sprintf("https://api.shodan.io/dns/domain/%s?key=%s", target, s.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("shodan request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil // No data found
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("shodan returned status: %d", resp.StatusCode)
	}

	var shodanResp ShodanResponse
	if err := json.NewDecoder(resp.Body).Decode(&shodanResp); err != nil {
		return nil, fmt.Errorf("failed to decode shodan response: %w", err)
	}

	var assets []domain.DiscoveredAsset

	for _, sub := range shodanResp.Subdomains {
		hostname := fmt.Sprintf("%s.%s", sub, shodanResp.Domain)
		if sub == "" {
			hostname = shodanResp.Domain
		}

		assets = append(assets, domain.DiscoveredAsset{
			Name:      hostname,
			Type:      "subdomain",
			Source:    s.Name(),
			Timestamp: time.Now(),
		})
	}

	return assets, nil
}

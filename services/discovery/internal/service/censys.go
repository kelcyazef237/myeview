package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/myeview/myeview/services/discovery/internal/domain"
)

type CensysSource struct {
	apiID     string
	apiSecret string
}

func NewCensysSource(apiID, apiSecret string) *CensysSource {
	return &CensysSource{
		apiID:     apiID,
		apiSecret: apiSecret,
	}
}

func (s *CensysSource) Name() string {
	return "censys"
}

type censysResponse struct {
	Result struct {
		Hits []struct {
			Names []string `json:"names"`
		} `json:"hits"`
	} `json:"result"`
}

func (s *CensysSource) Discover(ctx context.Context, target string) ([]domain.DiscoveredAsset, error) {
	if s.apiID == "" || s.apiSecret == "" {
		return nil, fmt.Errorf("censys credentials not configured")
	}

	// Censys Search API for subdomains (Simplified version)
	url := fmt.Sprintf("https://search.censys.io/api/v2/hosts/search?q=services.dns.answers.name:%%22%s%%22", target)
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(s.apiID, s.apiSecret)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("censys API returned status %d", resp.StatusCode)
	}

	var data censysResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var assets []domain.DiscoveredAsset
	seen := make(map[string]bool)

	for _, hit := range data.Result.Hits {
		for _, name := range hit.Names {
			if !seen[name] {
				assets = append(assets, domain.DiscoveredAsset{
					Name:      name,
					Type:      "subdomain",
					Source:    s.Name(),
					Timestamp: time.Now(),
				})
				seen[name] = true
			}
		}
	}

	return assets, nil
}

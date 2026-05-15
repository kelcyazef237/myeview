package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/myeview/myeview/services/discovery/internal/domain"
)

type CrtshResult struct {
	NameValue string `json:"name_value"`
}

type CrtshService struct {
	client *http.Client
}

func NewCrtshService() *CrtshService {
	return &CrtshService{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *CrtshService) Name() string {
	return "crt.sh"
}

func (s *CrtshService) Discover(ctx context.Context, domainName string) ([]domain.DiscoveredAsset, error) {
	url := fmt.Sprintf("https://crt.sh/?q=%%25.%s&output=json", domainName)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("crt.sh request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("crt.sh returned status: %d", resp.StatusCode)
	}

	var results []CrtshResult
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return nil, fmt.Errorf("failed to decode crt.sh response: %w", err)
	}

	uniqueNames := make(map[string]bool)
	var assets []domain.DiscoveredAsset

	for _, r := range results {
		// crt.sh can return multiple names separated by newlines
		names := strings.Split(r.NameValue, "\n")
		for _, name := range names {
			name = strings.TrimSpace(name)
			if name == "" || strings.Contains(name, "*") || uniqueNames[name] {
				continue
			}
			uniqueNames[name] = true
			assets = append(assets, domain.DiscoveredAsset{
				Name:      name,
				Type:      "subdomain",
				Source:    "crt.sh",
				Timestamp: time.Now(),
			})
		}
	}

	return assets, nil
}

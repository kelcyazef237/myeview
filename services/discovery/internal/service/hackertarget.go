package service

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/myeview/myeview/services/discovery/internal/domain"
)

type HackerTargetSource struct {
	client *http.Client
}

func NewHackerTargetSource() *HackerTargetSource {
	return &HackerTargetSource{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *HackerTargetSource) Name() string {
	return "hackertarget"
}

func (s *HackerTargetSource) Discover(ctx context.Context, target string) ([]domain.DiscoveredAsset, error) {
	url := fmt.Sprintf("https://api.hackertarget.com/hostsearch/?q=%s", target)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("hackertarget request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("hackertarget returned status: %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read hackertarget response: %w", err)
	}

	body := string(bodyBytes)
	if strings.Contains(body, "API count exceeded") || strings.Contains(body, "error") {
		return nil, fmt.Errorf("hackertarget error: %s", body)
	}

	var assets []domain.DiscoveredAsset
	lines := strings.Split(body, "\n")
	uniqueNames := make(map[string]bool)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		
		// HackerTarget returns CSV format: subdomain,ip
		parts := strings.Split(line, ",")
		if len(parts) > 0 {
			subdomain := parts[0]
			if subdomain == "" || uniqueNames[subdomain] {
				continue
			}
			uniqueNames[subdomain] = true

			assets = append(assets, domain.DiscoveredAsset{
				Name:      subdomain,
				Type:      "subdomain",
				Source:    s.Name(),
				Timestamp: time.Now(),
			})

			// If it includes an IP, we can also record that as an asset if needed, 
			// but for now we focus on the domain name. The verification service will resolve it anyway.
		}
	}

	return assets, nil
}

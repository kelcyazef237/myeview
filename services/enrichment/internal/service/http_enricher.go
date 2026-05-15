package service

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/myeview/myeview/services/enrichment/internal/domain"
)

type HTTPEnricher struct {
	client *http.Client
}

func NewHTTPEnricher() *HTTPEnricher {
	return &HTTPEnricher{
		client: &http.Client{
			Timeout: 5 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse // Don't follow redirects to capture initial headers
			},
		},
	}
}

func (e *HTTPEnricher) Name() string {
	return "http"
}

func (e *HTTPEnricher) Enrich(ctx context.Context, name string) (*domain.EnrichedAsset, error) {
	result := &domain.EnrichedAsset{
		Metadata:  make(map[string]interface{}),
		TechStack: []string{},
	}

	protocols := []string{"https://", "http://"}
	for _, proto := range protocols {
		url := proto + name
		req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
		resp, err := e.client.Do(req)
		
		if err == nil {
			defer resp.Body.Close()
			
			// Server Header
			if server := resp.Header.Get("Server"); server != "" {
				result.Metadata["server_header"] = server
				result.TechStack = append(result.TechStack, server)
			}

			// X-Powered-By
			if xpowered := resp.Header.Get("X-Powered-By"); xpowered != "" {
				result.Metadata["x_powered_by"] = xpowered
				result.TechStack = append(result.TechStack, xpowered)
			}

			// Cloud Provider
			if strings.Contains(resp.Header.Get("Via"), "CloudFront") || resp.Header.Get("X-Amz-Cf-Id") != "" {
				result.CloudProvider = "AWS"
			} else if strings.HasPrefix(resp.Header.Get("Server"), "cloudflare") {
				result.CloudProvider = "Cloudflare"
			}
			
			break // Enriched successfully
		}
	}

	return result, nil
}

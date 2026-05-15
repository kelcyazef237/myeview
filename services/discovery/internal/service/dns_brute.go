package service

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/myeview/myeview/services/discovery/internal/domain"
)

type DNSBruteSource struct {
	wordlist []string
}

func NewDNSBruteSource() *DNSBruteSource {
	// A small default wordlist for "Base Scan"
	// In production, this would be loaded from a file or larger list
	return &DNSBruteSource{
		wordlist: []string{
			"www", "api", "dev", "staging", "test", "mail", "vpn", "remote",
			"blog", "shop", "app", "portal", "admin", "db", "ns1", "ns2",
			"smtp", "pop", "imap", "m", "mobile", "secure", "status",
		},
	}
}

func (s *DNSBruteSource) Name() string {
	return "dns-brute"
}

func (s *DNSBruteSource) Discover(ctx context.Context, target string) ([]domain.DiscoveredAsset, error) {
	var assets []domain.DiscoveredAsset
	var mu sync.Mutex
	var wg sync.WaitGroup

	log.Printf("Starting DNS brute-force for %s", target)

	semaphore := make(chan struct{}, 10) // Limit concurrency

	for _, sub := range s.wordlist {
		wg.Add(1)
		go func(subdomain string) {
			defer wg.Done()
			
			select {
			case semaphore <- struct{}{}:
			case <-ctx.Done():
				return
			}
			defer func() { <-semaphore }()

			hostname := fmt.Sprintf("%s.%s", subdomain, target)
			
			// Use a resolver with a short timeout
			resolver := &net.Resolver{
				PreferGo: true,
			}
			
			ctxWithTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
			defer cancel()

			ips, err := resolver.LookupHost(ctxWithTimeout, hostname)
			if err == nil && len(ips) > 0 {
				mu.Lock()
				assets = append(assets, domain.DiscoveredAsset{
					Name:      hostname,
					Type:      "subdomain",
					Source:    s.Name(),
					Timestamp: time.Now(),
				})
				mu.Unlock()
			}
		}(sub)
	}

	wg.Wait()
	return assets, nil
}

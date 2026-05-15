package service

import (
	"context"
	"crypto/tls"
	"net"
	"strconv"
	"sync"
	"time"

	"github.com/myeview/myeview/services/verification/internal/domain"
)

type VerificationService struct {
	resolver *net.Resolver
}

func NewVerificationService() *VerificationService {
	return &VerificationService{
		resolver: &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{
					Timeout: time.Millisecond * time.Duration(10000),
				}
				return d.DialContext(ctx, network, "8.8.8.8:53")
			},
		},
	}
}

func (s *VerificationService) VerifyAsset(ctx context.Context, name string, assetType string) (*domain.VerifiedAsset, error) {
	verified := &domain.VerifiedAsset{
		Name:      name,
		Type:      assetType,
		Timestamp: time.Now(),
		PortsOpen: []int{},
	}

	// 1. DNS Resolution
	ips, err := s.resolver.LookupIPAddr(ctx, name)
	if err != nil || len(ips) == 0 {
		verified.IsActive = false
		return verified, nil
	}

	verified.IsActive = true // At least it resolves
	for _, ip := range ips {
		verified.IPAddresses = append(verified.IPAddresses, ip.IP.String())
	}

	// 2. TCP Port Handshakes (concurrently check common ports)
	portsToCheck := []int{80, 443, 8080, 8443}
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, port := range portsToCheck {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			addr := net.JoinHostPort(name, strconv.Itoa(p))
			d := net.Dialer{Timeout: 3 * time.Second}
			conn, err := d.DialContext(ctx, "tcp", addr)
			if err == nil {
				conn.Close()
				mu.Lock()
				verified.PortsOpen = append(verified.PortsOpen, p)
				mu.Unlock()
			}
		}(port)
	}
	wg.Wait()

	// 3. SSL/TLS Verification (if 443 is open)
	has443 := false
	for _, p := range verified.PortsOpen {
		if p == 443 {
			has443 = true
			break
		}
	}

	if has443 {
		d := net.Dialer{Timeout: 3 * time.Second}
		conn, err := tls.DialWithDialer(&d, "tcp", net.JoinHostPort(name, "443"), &tls.Config{
			InsecureSkipVerify: true, // We want to inspect the cert even if it's invalid
			ServerName:         name,
		})
		if err == nil {
			defer conn.Close()
			certs := conn.ConnectionState().PeerCertificates
			if len(certs) > 0 {
				cert := certs[0]
				verified.TLSValid = time.Now().Before(cert.NotAfter) && time.Now().After(cert.NotBefore)
				verified.TLSCertIssuer = cert.Issuer.CommonName
				if verified.TLSCertIssuer == "" && len(cert.Issuer.Organization) > 0 {
					verified.TLSCertIssuer = cert.Issuer.Organization[0]
				}
				verified.TLSCertExpiry = cert.NotAfter
			}
		}
	}

	return verified, nil
}

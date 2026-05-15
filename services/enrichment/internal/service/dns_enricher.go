package service

import (
	"context"
	"net"
	"strings"

	"github.com/myeview/myeview/services/enrichment/internal/domain"
)

type DNSEnricher struct{}

func NewDNSEnricher() *DNSEnricher {
	return &DNSEnricher{}
}

func (e *DNSEnricher) Name() string {
	return "dns"
}

func (e *DNSEnricher) Enrich(ctx context.Context, name string) (*domain.EnrichedAsset, error) {
	result := &domain.EnrichedAsset{
		Metadata: make(map[string]interface{}),
	}

	// TXT Records (SPF)
	txtRecords, _ := net.LookupTXT(name)
	for _, txt := range txtRecords {
		if strings.HasPrefix(txt, "v=spf1") {
			result.Metadata["spf_record"] = txt
		}
	}

	// DMARC Records
	dmarcRecords, _ := net.LookupTXT("_dmarc." + name)
	if len(dmarcRecords) > 0 {
		result.Metadata["dmarc_record"] = dmarcRecords[0]
	}

	return result, nil
}

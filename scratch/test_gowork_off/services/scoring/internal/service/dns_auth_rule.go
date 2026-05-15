package service

import (
	"github.com/myeview/myeview/libs/events"
)

type DNSAuthRule struct{}

func NewDNSAuthRule() *DNSAuthRule {
	return &DNSAuthRule{}
}

func (r *DNSAuthRule) Name() string {
	return "dns_auth"
}

func (r *DNSAuthRule) Evaluate(event events.AssetEnrichedEvent) (int, []string) {
	score := 0
	var factors []string

	if spf, ok := event.Metadata["spf_record"]; !ok || spf == "" {
		score += 15
		factors = append(factors, "Missing SPF record")
	}
	
	if dmarc, ok := event.Metadata["dmarc_record"]; !ok || dmarc == "" {
		score += 10
		factors = append(factors, "Missing DMARC record")
	}

	return score, factors
}

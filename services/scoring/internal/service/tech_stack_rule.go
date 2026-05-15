package service

import (
	"fmt"

	"github.com/myeview/myeview/libs/events"
)

type TechStackRule struct{}

func NewTechStackRule() *TechStackRule {
	return &TechStackRule{}
}

func (r *TechStackRule) Name() string {
	return "tech_stack"
}

func (r *TechStackRule) Evaluate(event events.AssetEnrichedEvent) (int, []string) {
	score := 0
	var factors []string

	if len(event.TechStack) > 0 {
		score += len(event.TechStack) * 2
		factors = append(factors, fmt.Sprintf("Identified technologies: %d", len(event.TechStack)))
	}

	return score, factors
}

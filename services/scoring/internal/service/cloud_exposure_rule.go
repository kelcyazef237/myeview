package service

import (
	"github.com/myeview/myeview/libs/events"
)

type CloudExposureRule struct{}

func NewCloudExposureRule() *CloudExposureRule {
	return &CloudExposureRule{}
}

func (r *CloudExposureRule) Name() string {
	return "cloud_exposure"
}

func (r *CloudExposureRule) Evaluate(event events.AssetEnrichedEvent) (int, []string) {
	score := 0
	var factors []string

	if event.CloudProvider != "" {
		score += 5
		factors = append(factors, "Cloud exposure: "+event.CloudProvider)
	}

	return score, factors
}

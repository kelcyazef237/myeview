package service

import (
	"github.com/myeview/myeview/libs/events"
)

// RiskRule defines the interface for an isolated scoring module
type RiskRule interface {
	Name() string
	Evaluate(event events.AssetEnrichedEvent) (score int, factors []string)
}

package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

type EventBus interface {
	Publish(ctx context.Context, subject string, data interface{}) error
	Subscribe(ctx context.Context, subject, queue string, handler func(data []byte) error) error
	Close()
}

type NATSEventBus struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

// NewNATSEventBus creates a new NATS JetStream event bus.
func NewNATSEventBus(url string) (*NATSEventBus, error) {
	nc, err := nats.Connect(url, nats.RetryOnFailedConnect(true), nats.MaxReconnects(10), nats.ReconnectWait(time.Second))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to initialize JetStream: %w", err)
	}

	// Ensure the streams exist
	err = ensureStreams(js)
	if err != nil {
		log.Printf("Warning: failed to ensure streams: %v", err)
	}

	return &NATSEventBus{
		nc: nc,
		js: js,
	}, nil
}

func ensureStreams(js nats.JetStreamContext) error {
	streams := []nats.StreamConfig{
		{
			Name:     "DISCOVERY",
			Subjects: []string{"asset.discovered.*"},
			MaxAge:   24 * time.Hour,
		},
		{
			Name:     "VERIFICATION",
			Subjects: []string{"asset.verified.*"},
			MaxAge:   24 * time.Hour,
		},
		{
			Name:     "ENRICHMENT",
			Subjects: []string{"asset.enriched.*"},
			MaxAge:   24 * time.Hour,
		},
		{
			Name:     "SCORING",
			Subjects: []string{"risk.scored.*"},
			MaxAge:   24 * time.Hour,
		},
	}

	for _, cfg := range streams {
		if _, err := js.AddStream(&cfg); err != nil {
			return fmt.Errorf("failed to create stream %s: %w", cfg.Name, err)
		}
	}

	return nil
}

func (b *NATSEventBus) Publish(ctx context.Context, subject string, data interface{}) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	_, err = b.js.Publish(subject, payload)
	if err != nil {
		return fmt.Errorf("failed to publish to jetstream: %w", err)
	}
	return nil
}

func (b *NATSEventBus) Subscribe(ctx context.Context, subject, queue string, handler func(data []byte) error) error {
	var err error
	var sub *nats.Subscription

	mcb := func(msg *nats.Msg) {
		if err := handler(msg.Data); err != nil {
			log.Printf("Error handling message on subject %s: %v", msg.Subject, err)
			msg.Nak()
			return
		}
		msg.Ack()
	}

	if queue != "" {
		sub, err = b.js.QueueSubscribe(subject, queue, mcb, nats.ManualAck())
	} else {
		sub, err = b.js.Subscribe(subject, mcb, nats.ManualAck())
	}

	if err != nil {
		return fmt.Errorf("failed to subscribe to jetstream: %w", err)
	}

	go func() {
		<-ctx.Done()
		if sub != nil {
			sub.Unsubscribe()
		}
	}()

	return nil
}

func (b *NATSEventBus) Close() {
	if b.nc != nil {
		b.nc.Close()
	}
}

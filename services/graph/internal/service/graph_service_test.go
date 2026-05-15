package service

import (
	"context"
	"testing"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/graph/internal/domain"
)

// mockGraphRepo is a stub repository for testing
type mockGraphRepo struct {
	nodes map[string]*domain.Node
	edges []domain.Edge
}

func newMockGraphRepo() *mockGraphRepo {
	return &mockGraphRepo{
		nodes: make(map[string]*domain.Node),
		edges: []domain.Edge{},
	}
}

func (m *mockGraphRepo) UpsertNode(ctx context.Context, node *domain.Node) error {
	m.nodes[node.ID] = node
	return nil
}

func (m *mockGraphRepo) UpsertEdge(ctx context.Context, edge *domain.Edge) error {
	m.edges = append(m.edges, *edge)
	return nil
}

func (m *mockGraphRepo) GetGraphByOrg(ctx context.Context, orgID string) ([]domain.Node, []domain.Edge, error) {
	var nodes []domain.Node
	for _, n := range m.nodes {
		nodes = append(nodes, *n)
	}
	return nodes, m.edges, nil
}

func TestGraphServiceProcessEnrichedEvent(t *testing.T) {
	repo := newMockGraphRepo()
	svc := NewGraphService(repo)

	event := events.AssetEnrichedEvent{
		OrganizationID: "00000000-0000-0000-0000-000000000000",
		AssetName:      "test.example.com",
		CloudProvider:  "AWS",
	}

	err := svc.ProcessEnrichedEvent(context.Background(), event)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	node, exists := repo.nodes["test.example.com"]
	if !exists {
		t.Fatalf("Expected node 'test.example.com' to be created")
	}

	if node.Properties["cloud_provider"] != "AWS" {
		t.Errorf("Expected cloud_provider 'AWS', got %v", node.Properties["cloud_provider"])
	}
}

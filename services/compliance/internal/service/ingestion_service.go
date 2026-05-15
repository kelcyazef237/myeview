package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/myeview/myeview/services/compliance/internal/domain"
	"github.com/myeview/myeview/services/compliance/internal/repository"
)

type IngestionService struct {
	repo repository.ComplianceRepository
	llm  LLMService
}

func NewIngestionService(repo repository.ComplianceRepository, llm LLMService) *IngestionService {
	return &IngestionService{
		repo: repo,
		llm:  llm,
	}
}

func (s *IngestionService) IngestRegulation(ctx context.Context, name, version, content string) error {
	// 1. Save the Regulation record
	reg := &domain.Regulation{
		Name:    name,
		Version: version,
	}
	if err := s.repo.SaveRegulation(ctx, reg); err != nil {
		return fmt.Errorf("failed to save regulation: %w", err)
	}

	// 2. Simple chunking strategy (e.g., split by double newline or fixed length)
	// For production, use a more robust token-based text splitter
	chunks := strings.Split(content, "\n\n")
	
	var regChunks []domain.RegulationChunk

	for i, chunkText := range chunks {
		trimmed := strings.TrimSpace(chunkText)
		if len(trimmed) < 10 { // Skip very small empty chunks
			continue
		}

		// 3. Generate Embedding
		embedding, err := s.llm.GenerateEmbedding(ctx, trimmed)
		if err != nil {
			return fmt.Errorf("failed to generate embedding for chunk %d: %w", i, err)
		}

		regChunks = append(regChunks, domain.RegulationChunk{
			ID:           uuid.New(),
			RegulationID: reg.ID,
			Content:      trimmed,
			Embedding:    embedding,
			ChunkIndex:   i,
		})
	}

	// 4. Save Chunks
	if len(regChunks) > 0 {
		if err := s.repo.SaveChunks(ctx, regChunks); err != nil {
			return fmt.Errorf("failed to save regulation chunks: %w", err)
		}
	}

	return nil
}

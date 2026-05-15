package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/pgvector/pgvector-go"
	"github.com/sashabaranov/go-openai"
)

type LLMService interface {
	GenerateEmbedding(ctx context.Context, text string) (pgvector.Vector, error)
	AnalyzeGap(ctx context.Context, regulationContext string, assetRisks string) (string, error)
}

type openAILLMService struct {
	client *openai.Client
}

func NewLLMService(apiKey string) LLMService {
	client := openai.NewClient(apiKey)
	return &openAILLMService{client: client}
}

func (s *openAILLMService) GenerateEmbedding(ctx context.Context, text string) (pgvector.Vector, error) {
	if s.client == nil || len(strings.TrimSpace(text)) == 0 {
		return pgvector.NewVector(make([]float32, 1536)), fmt.Errorf("invalid client or text")
	}

	req := openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.SmallEmbedding3, // 1536 dimensions
	}

	resp, err := s.client.CreateEmbeddings(ctx, req)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to generate embedding: %w", err)
	}

	if len(resp.Data) == 0 {
		return pgvector.Vector{}, fmt.Errorf("no embedding data returned")
	}

	return pgvector.NewVector(resp.Data[0].Embedding), nil
}

func (s *openAILLMService) AnalyzeGap(ctx context.Context, regulationContext string, assetRisks string) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("OpenAI client not configured")
	}

	systemPrompt := `You are a specialized compliance auditor for financial institutions in Cameroon (CEMAC zone).
Your expertise covers COBAC (Banking Commission of Central Africa), ANTIC (National Agency for ICT), 
and Cameroonian Finance Law regulations.

When analyzing cybersecurity risks against the provided regulatory context, you output a JSON array 
of compliance gaps. Each gap must reference the specific Cameroonian law or regulation from the context.

Output ONLY a valid JSON array with this structure (no markdown, no explanation):
[
  {
    "violated_requirement": "Specific article or requirement from the regulation",
    "evidence": "Technical finding that demonstrates the violation",
    "remediation": "Specific, actionable remediation step with timeline",
    "severity": "critical|high|medium|low"
  }
]

Focus on: COBAC circulars, COBAC regulations, ANTIC Law No. 2010/012, Finance Law provisions.
Map technical findings to business risk in terms of: license risk, audit findings, regulatory sanctions.`

	userPrompt := fmt.Sprintf("Regulatory Context:\n%s\n\nAsset Risks:\n%s\n\nGenerate the JSON gap analysis.", regulationContext, assetRisks)

	req := openai.ChatCompletionRequest{
		Model: openai.GPT4o,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: userPrompt},
		},
		Temperature: 0.2, // Low temp for more deterministic output
	}

	resp, err := s.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return "", fmt.Errorf("failed to generate gap analysis: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices returned from LLM")
	}

	return resp.Choices[0].Message.Content, nil
}

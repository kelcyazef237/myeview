package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/pgvector/pgvector-go"
	"github.com/sashabaranov/go-openai"
)

// DashScope (Alibaba Cloud) OpenAI-compatible API endpoint
// Qwen models are fully compatible with the OpenAI SDK via this base URL
const dashScopeBaseURL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

// Model constants for Qwen
const (
	qwenChatModel      = "qwen-plus"          // Best cost/quality balance
	qwenEmbeddingModel = "text-embedding-v3"  // 1536-dim, matches pgvector schema
)

type LLMService interface {
	GenerateEmbedding(ctx context.Context, text string) (pgvector.Vector, error)
	AnalyzeGap(ctx context.Context, regulationContext string, assetRisks string) (string, error)
}

type openAILLMService struct {
	client   *openai.Client
	provider string // "qwen" | "openai"
}

// NewLLMService initialises the LLM client.
// Priority: DASHSCOPE_API_KEY (Qwen) → OPENAI_API_KEY (fallback).
// Pass the active key and provider name from the config layer.
func NewLLMService(apiKey, provider string) LLMService {
	if apiKey == "" {
		return &noopLLMService{}
	}

	var client *openai.Client

	if provider == "qwen" {
		cfg := openai.DefaultConfig(apiKey)
		cfg.BaseURL = dashScopeBaseURL
		client = openai.NewClientWithConfig(cfg)
	} else {
		client = openai.NewClient(apiKey)
	}

	return &openAILLMService{client: client, provider: provider}
}

func (s *openAILLMService) GenerateEmbedding(ctx context.Context, text string) (pgvector.Vector, error) {
	if len(strings.TrimSpace(text)) == 0 {
		return pgvector.NewVector(make([]float32, 1536)), fmt.Errorf("empty text")
	}

	model := openai.SmallEmbedding3 // default for OpenAI
	if s.provider == "qwen" {
		model = openai.EmbeddingModel(qwenEmbeddingModel)
	}

	req := openai.EmbeddingRequest{
		Input: []string{text},
		Model: model,
	}

	resp, err := s.client.CreateEmbeddings(ctx, req)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("embedding failed (%s): %w", s.provider, err)
	}

	if len(resp.Data) == 0 {
		return pgvector.Vector{}, fmt.Errorf("no embedding data returned")
	}

	return pgvector.NewVector(resp.Data[0].Embedding), nil
}

func (s *openAILLMService) AnalyzeGap(ctx context.Context, regulationContext string, assetRisks string) (string, error) {
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

	chatModel := openai.GPT4o
	if s.provider == "qwen" {
		chatModel = qwenChatModel
	}

	req := openai.ChatCompletionRequest{
		Model: chatModel,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: fmt.Sprintf(
				"Regulatory Context:\n%s\n\nAsset Risks:\n%s\n\nGenerate the JSON gap analysis.",
				regulationContext, assetRisks,
			)},
		},
		Temperature: 0.2,
	}

	resp, err := s.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return "", fmt.Errorf("chat completion failed (%s): %w", s.provider, err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices returned from %s", s.provider)
	}

	return resp.Choices[0].Message.Content, nil
}

// ── noopLLMService: used when no API key is configured ──────────────────────
// Deterministic Tier 1 still works fully — this only disables the RAG fallback.

type noopLLMService struct{}

func (n *noopLLMService) GenerateEmbedding(_ context.Context, _ string) (pgvector.Vector, error) {
	return pgvector.NewVector(make([]float32, 1536)), nil
}

func (n *noopLLMService) AnalyzeGap(_ context.Context, _, _ string) (string, error) {
	return "[]", nil // Return empty gaps — deterministic layer handles it
}

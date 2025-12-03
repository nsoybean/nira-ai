/**
 * Model Configuration
 * Defines available AI models and their providers
 */

export type ModelProvider = "openai" | "anthropic";

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  inputCostPer1k: number; // USD per 1000 tokens
  outputCostPer1k: number; // USD per 1000 tokens
}

export const AVAILABLE_MODELS = [
  // Anthropic Models
  {
    id: "claude-sonnet-4-5",
    name: "Claude 4.5 Sonnet",
    provider: "anthropic",
    description: "Latest and most intelligent model",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    description: "Most intelligent model, best for complex tasks",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude 4.5 Haiku",
    provider: "anthropic",
    description: "Fastest model, great for simple tasks",
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.005,
  },
  // OpenAI Models
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    description: "Best model for coding and agentic tasks across industries",
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.01,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    description: "A faster, cheaper version of GPT-5 for well-defined tasks",
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.002,
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    description:
      "The fastest, cheapest version of GPT-5—great for summarization and classification tasks",
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most advanced multimodal model",
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
  },
] satisfies ModelConfig[];

export const DEFAULT_MODEL_ID: (typeof AVAILABLE_MODELS)[0]["id"] =
  "claude-haiku-4-5";

/**
 * Get model configuration by ID
 */
export function getModelById(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === modelId);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000) * model.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * model.outputCostPer1k;
  return inputCost + outputCost;
}

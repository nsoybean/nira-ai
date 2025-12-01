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

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Anthropic Models
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    description: "Most intelligent model, best for complex tasks",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Balanced intelligence and speed",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fastest model, great for simple tasks",
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.005,
  },
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI's most advanced multimodal model",
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and affordable OpenAI model",
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
  },
  {
    id: "o1",
    name: "OpenAI o1",
    provider: "openai",
    description: "Advanced reasoning model",
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06,
  },
  {
    id: "o1-mini",
    name: "OpenAI o1-mini",
    provider: "openai",
    description: "Faster reasoning model",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.012,
  },
];

export const DEFAULT_MODEL_ID = "claude-3-7-sonnet-20250219";

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
